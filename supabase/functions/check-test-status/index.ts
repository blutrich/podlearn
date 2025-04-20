import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { episodeId, transcriptId } = await req.json();
    
    if (!episodeId && !transcriptId) {
      throw new Error('Either episodeId or transcriptId is required');
    }

    // Initialize variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const assemblyKey = Deno.env.get('ASSEMBLYAI_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !assemblyKey) {
      console.error('Missing environment variables. URL:', !!supabaseUrl, 'Service Key:', !!supabaseServiceKey, 'API Key:', !!assemblyKey);
      throw new Error('Missing environment variables');
    }

    // Initialize Supabase client
    console.log('Initializing Supabase client with URL:', supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let episode;
    
    // If episodeId is provided, get episode details
    if (episodeId) {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('id', episodeId)
        .single();
      
      if (error) {
        console.error('Error fetching episode:', error);
        throw new Error(`Error fetching episode: ${error.message}`);
      }
      
      if (!data) {
        throw new Error(`Episode with ID ${episodeId} not found`);
      }
      
      episode = data;
    }
    
    // If transcriptId is provided (either directly or via episode), check AssemblyAI status
    const transcript_id = transcriptId || episode?.assemblyai_transcript_id;
    
    if (transcript_id) {
      console.log('Checking AssemblyAI status for transcript ID:', transcript_id);
      
      // Check AssemblyAI status manually
      const response = await fetch(`https://api.eu.assemblyai.com/v2/transcript/${transcript_id}`, {
        headers: {
          'Authorization': assemblyKey
        }
      });

      if (!response.ok) {
        console.error('AssemblyAI status check failed:', response.status);
        throw new Error('Failed to fetch transcript status');
      }

      const data = await response.json();
      console.log('AssemblyAI status response:', {
        status: data.status,
        audio_duration: data.audio_duration,
        text_length: data.text?.length || 0
      });
      
      if (data.status === 'completed' && episode) {
        // Get transcription segments
        const { data: segments, error: segmentsError } = await supabase
          .from('transcriptions')
          .select('*')
          .eq('episode_id', episode.id);
        
        if (segmentsError) {
          console.error('Error fetching segments:', segmentsError);
        }
        
        return new Response(JSON.stringify({
          episode: {
            id: episode.id,
            original_id: episode.original_id,
            title: episode.title,
            transcription_status: episode.transcription_status
          },
          transcript: {
            id: transcript_id,
            status: data.status,
            text_length: data.text?.length || 0,
            segments_count: segments?.length || 0
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // If we only have transcript ID without episode
      if (!episode) {
        return new Response(JSON.stringify({
          transcript: {
            id: transcript_id,
            status: data.status,
            text_length: data.text?.length || 0
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // If the transcript is not completed yet
      return new Response(JSON.stringify({
        episode: {
          id: episode.id,
          original_id: episode.original_id,
          title: episode.title,
          transcription_status: episode.transcription_status
        },
        transcript: {
          id: transcript_id,
          status: data.status
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // If no transcript ID was found
    return new Response(JSON.stringify({
      episode: {
        id: episode.id,
        original_id: episode.original_id,
        title: episode.title,
        transcription_status: episode.transcription_status
      },
      error: 'No transcript ID found'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in check-test-status function:', error);
    
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
}); 