import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { episodeId, audioUrl, title, podcastId } = await req.json()

    if (!episodeId || !audioUrl || !title || !podcastId) {
      throw new Error('Missing required parameters')
    }

    console.log(`Episode data retrieved: {title: '${title}', audioUrl: '${audioUrl}', podcastId: ${podcastId}, episodeId: '${episodeId}'}`)
    
    // Initialize Supabase client first to be able to check podcast data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const assemblyKey = Deno.env.get('ASSEMBLYAI_API_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey || !assemblyKey) {
      console.error('Missing environment variables. URL:', !!supabaseUrl, 'Service Key:', !!supabaseServiceKey, 'API Key:', !!assemblyKey);
      throw new Error('Missing environment variables')
    }

    console.log('Initializing Supabase client with URL:', supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check if this is a Hebrew podcast
    const isHebrewPodcast = /[\u0590-\u05FF]/.test(title);
    console.log('Is Hebrew podcast:', isHebrewPodcast);

    // Check if an episode record already exists
    console.log(`Checking if episode with original_id ${episodeId} already exists`);
    const { data: existingEpisode, error: searchError } = await supabase
      .from('episodes')
      .select('id, transcription_status')
      .eq('original_id', episodeId)
      .maybeSingle();

    if (searchError) {
      console.error(`Error checking existing episode: ${searchError.message}`, searchError);
      throw new Error(`Error checking existing episode: ${searchError.message}`);
    }

    let episodeDbId;

    if (existingEpisode) {
      // Update existing episode
      console.log(`Found existing episode with ID ${existingEpisode.id}, status: ${existingEpisode.transcription_status}`);
      episodeDbId = existingEpisode.id;
      
      if (existingEpisode.transcription_status === 'completed') {
        return new Response(
          JSON.stringify({ message: 'Transcription already exists' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        console.log(`Updating episode ${episodeDbId} status to 'processing'`);
        const { error: updateError } = await supabase
          .from('episodes')
          .update({
            transcription_status: 'processing',
            transcription_started_at: new Date().toISOString(),
            transcription_error: null,
            is_hebrew: isHebrewPodcast
          })
          .eq('id', episodeDbId);

        if (updateError) {
          console.error(`Error updating episode: ${updateError.message}`, updateError);
          throw new Error(`Error updating episode: ${updateError.message}`);
        }
        console.log(`Successfully updated episode ${episodeDbId}`);
      } catch (updateError) {
        console.error('Exception updating episode:', updateError);
        throw new Error(`Exception updating episode: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`);
      }
    } else {
      // Create new episode record
      try {
        console.log(`Creating new episode record for original_id ${episodeId}`);
        const { data: newEpisode, error: insertError } = await supabase
          .from('episodes')
          .insert({
            original_id: episodeId,
            title: title,
            podcast_id: podcastId,
            audio_url: audioUrl,
            transcription_status: 'processing',
            transcription_started_at: new Date().toISOString(),
            is_hebrew: isHebrewPodcast
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Error creating episode: ${insertError.message}`, insertError);
          throw new Error(`Error creating episode: ${insertError.message}`);
        }
        
        if (!newEpisode) {
          console.error('No episode returned after insert');
          throw new Error('No episode returned after insert');
        }
        
        episodeDbId = newEpisode.id;
        console.log(`Successfully created new episode with ID ${episodeDbId}`);
      } catch (insertError) {
        console.error('Exception creating episode:', insertError);
        throw new Error(`Exception creating episode: ${insertError instanceof Error ? insertError.message : 'Unknown error'}`);
      }
    }

    // Start AssemblyAI transcription
    console.log('Starting AssemblyAI transcription for:', audioUrl)

    const requestBody: any = {
      audio_url: audioUrl,
      language_code: isHebrewPodcast ? 'he' : 'en',
      speaker_labels: !isHebrewPodcast, // Only for non-Hebrew content
      sentiment_analysis: !isHebrewPodcast, // Only for non-Hebrew content
      entity_detection: !isHebrewPodcast, // Only for non-Hebrew content
      webhook_url: `${supabaseUrl}/functions/v1/assembly-webhook`,
      webhook_auth_header_name: 'Authorization',
      webhook_auth_header_value: supabaseServiceKey
    };
    
    console.log('Sending request to AssemblyAI:', JSON.stringify(requestBody));
    try {
      const transcriptionResponse = await fetch('https://api.eu.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': assemblyKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!transcriptionResponse.ok) {
        const errorText = await transcriptionResponse.text();
        console.error(`AssemblyAI error response (${transcriptionResponse.status}): ${errorText}`);
        
        // Update episode with error information
        try {
          await supabase
            .from('episodes')
            .update({
              transcription_status: 'error',
              transcription_error: `AssemblyAI error: ${errorText}`
            })
            .eq('id', episodeDbId);
        } catch (updateError) {
          console.error('Failed to update episode with error status:', updateError);
        }
        
        throw new Error(`AssemblyAI error: ${errorText}`);
      }

      const transcriptionData = await transcriptionResponse.json();
      console.log('AssemblyAI response:', transcriptionData);

      // Update episode with AssemblyAI ID
      try {
        console.log(`Updating episode ${episodeDbId} with AssemblyAI transcript ID ${transcriptionData.id}`);
        const { error: updateError } = await supabase
          .from('episodes')
          .update({
            assemblyai_transcript_id: transcriptionData.id
          })
          .eq('id', episodeDbId);

        if (updateError) {
          console.error(`Error updating episode with transcript ID: ${updateError.message}`, updateError);
          throw new Error(`Error updating episode with transcript ID: ${updateError.message}`);
        }
        console.log(`Successfully updated episode ${episodeDbId} with transcript ID`);
      } catch (updateError) {
        console.error('Exception updating episode with transcript ID:', updateError);
        // Continue even if this update fails
      }

      return new Response(
        JSON.stringify({ 
          message: 'Transcription started successfully',
          transcript_id: transcriptionData.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error in AssemblyAI transcription:', error);
      
      return new Response(
        JSON.stringify({ 
          error: error instanceof Error ? error.message : 'An unexpected error occurred'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error in transcribe-audio function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
