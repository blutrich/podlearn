import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

interface Segment {
  content: string;
  start_time: number;
  end_time: number;
  speaker: string;
  sentiment: string;
  sentiment_confidence: number;
  entities: any | null;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BATCH_SIZE = 50; // Process 50 segments at a time

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('Received webhook payload:', payload);

    // Verify this is a completed transcription
    if (payload.status !== 'completed') {
      console.log('Transcription not completed yet, status:', payload.status);
      return new Response(JSON.stringify({ message: 'Transcription not completed yet' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const transcript_id = payload.transcript_id;
    if (!transcript_id) {
      throw new Error('No transcript ID in webhook payload');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const assemblyKey = Deno.env.get('ASSEMBLYAI_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !assemblyKey) {
      throw new Error('Missing environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get episode associated with this transcript
    console.log('Fetching episode data for transcript:', transcript_id);
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select('*')
      .eq('assemblyai_transcript_id', transcript_id)
      .single();

    if (episodeError) {
      console.error('Episode fetch error:', episodeError);
      throw new Error('Episode not found for transcript ID: ' + transcript_id);
    }

    if (!episode) {
      throw new Error('No episode found for transcript ID: ' + transcript_id);
    }

    console.log('Found episode:', {
      id: episode.id,
      original_id: episode.original_id,
      is_hebrew: episode.is_hebrew
    });

    // Check if transcriptions already exist for this episode to avoid duplication
    const { count, error: countError } = await supabase
      .from('transcriptions')
      .select('*', { count: 'exact', head: true })
      .eq('episode_id', episode.id);

    if (countError) {
      console.error('Error checking existing transcriptions:', countError);
    } else if (count && count > 0) {
      console.log(`Transcription already exists with ${count} segments, skipping processing`);
      
      // Ensure episode status is marked as completed
      if (episode.transcription_status !== 'completed') {
        await supabase
          .from('episodes')
          .update({
            transcription_status: 'completed',
            transcription_error: null
          })
          .eq('id', episode.id);
      }
      
      return new Response(JSON.stringify({
        status: 'completed',
        message: `Transcription already processed with ${count} segments`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize segments array
    let segments: Segment[] = [];

    // Fetch segments based on whether it's Hebrew or not
    const endpoint = episode.is_hebrew ? 'paragraphs' : 'utterances';
    console.log(`Using ${endpoint} endpoint for ${episode.is_hebrew ? 'Hebrew' : 'non-Hebrew'} content`);
    
    try {
      const segmentsResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcript_id}/${endpoint}`, {
        headers: {
          'Authorization': assemblyKey
        }
      });

      if (!segmentsResponse.ok) {
        const errorText = await segmentsResponse.text();
        console.error(`Failed to fetch ${endpoint}:`, {
          status: segmentsResponse.status,
          statusText: segmentsResponse.statusText,
          error: errorText
        });

        // Check if we need to fall back to the transcript endpoint
        if (segmentsResponse.status === 404 || segmentsResponse.status === 400) {
          console.log('Falling back to transcript endpoint');
          const transcriptResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcript_id}`, {
            headers: {
              'Authorization': assemblyKey
            }
          });

          if (!transcriptResponse.ok) {
            const transcriptError = await transcriptResponse.text();
            throw new Error(`Failed to fetch transcript: ${transcriptError}`);
          }

          const transcriptData = await transcriptResponse.json();
          if (transcriptData.text) {
            console.log('Successfully retrieved transcript text');
            segments = [{
              content: transcriptData.text,
              start_time: 0,
              end_time: Math.floor((transcriptData.audio_duration || 0) / 1000),
              speaker: 'Speaker A',
              sentiment: 'NEUTRAL',
              sentiment_confidence: 1,
              entities: null
            }];
          } else {
            throw new Error(`No text found in transcript response: ${JSON.stringify(transcriptData)}`);
          }
        } else {
          throw new Error(`Failed to fetch ${endpoint}: ${errorText}`);
        }
      } else {
        const segmentsData = await segmentsResponse.json();
        console.log(`Received ${endpoint} data:`, {
          count: Array.isArray(segmentsData) ? segmentsData.length : 0,
          sample: segmentsData[0] ? {
            text: segmentsData[0].text?.substring(0, 50),
            start: segmentsData[0].start,
            end: segmentsData[0].end
          } : null,
          isArray: Array.isArray(segmentsData),
          type: typeof segmentsData
        });

        if (episode.is_hebrew) {
          segments = segmentsData.map((para: any) => ({
            content: para.text || '',
            start_time: Math.floor(para.start / 1000), // Convert to seconds
            end_time: Math.floor(para.end / 1000),
            speaker: 'Speaker A', // Hebrew transcripts don't have speaker detection
            sentiment: 'NEUTRAL',
            sentiment_confidence: 1,
            entities: null
          }));
        } else {
          segments = segmentsData.map((utterance: any) => ({
            content: utterance.text || '',
            start_time: Math.floor(utterance.start / 1000),
            end_time: Math.floor(utterance.end / 1000),
            speaker: utterance.speaker || 'Speaker A',
            sentiment: utterance.sentiment || 'NEUTRAL',
            sentiment_confidence: utterance.sentiment_confidence || 1,
            entities: utterance.entities || null
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching segments:', err);
      // Try to use raw transcript if segments fetch fails
      if (payload.text) {
        console.log('Using payload text as fallback after segment fetch error');
        segments = [{
          content: payload.text,
          start_time: 0,
          end_time: Math.floor((payload.audio_duration || 0) / 1000),
          speaker: 'Speaker A',
          sentiment: 'NEUTRAL',
          sentiment_confidence: 1,
          entities: null
        }];
      } else {
        throw err; // Re-throw if we can't fall back
      }
    }

    console.log(`Processed ${segments.length} segments`);

    if (segments.length === 0) {
      console.log('No segments found, checking raw transcript...');
      // If no segments, try to get raw transcript text
      const rawText = payload.text;
      if (rawText) {
        console.log('Found raw transcript text, creating single segment');
        segments = [{
          content: rawText,
          start_time: 0,
          end_time: Math.floor((payload.audio_duration || 0) / 1000),
          speaker: 'Speaker A',
          sentiment: 'NEUTRAL',
          sentiment_confidence: 1,
          entities: null
        }];
      }
    }

    if (segments.length > 0) {
      // Insert segments in batches
      const batchSize = 100;
      console.log(`Inserting ${segments.length} segments in batches of ${batchSize}`);
      
      for (let i = 0; i < segments.length; i += batchSize) {
        const batch = segments.slice(i, i + batchSize).map(segment => ({
          episode_id: episode.id,
          content: segment.content,
          start_time: segment.start_time,
          end_time: segment.end_time,
          speaker: segment.speaker,
          sentiment: segment.sentiment,
          sentiment_confidence: segment.sentiment_confidence,
          entities: segment.entities,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        console.log(`Inserting batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(segments.length/batchSize)}`);
        const { error: insertError } = await supabase
          .from('transcriptions')
          .insert(batch);

        if (insertError) {
          console.error('Segment insertion error:', insertError);
          throw new Error(`Failed to insert segments: ${insertError.message}`);
        }
      }

      // Update episode status
      console.log('Updating episode status to completed');
      const { error: updateError } = await supabase
        .from('episodes')
        .update({
          transcription_status: 'completed',
          transcription_error: null
        })
        .eq('id', episode.id);

      if (updateError) {
        console.error('Episode status update error:', updateError);
        throw new Error(`Failed to update episode status: ${updateError.message}`);
      }

      return new Response(JSON.stringify({
        status: 'completed',
        message: `Successfully stored ${segments.length} segments`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const errorMessage = 'No segments or raw text found in the transcript';
    console.error(errorMessage);
    
    // Update episode with error status
    await supabase
      .from('episodes')
      .update({
        transcription_status: 'failed',
        transcription_error: errorMessage
      })
      .eq('id', episode.id);
      
    throw new Error(errorMessage);

  } catch (error) {
    console.error('Error in assembly-webhook:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 