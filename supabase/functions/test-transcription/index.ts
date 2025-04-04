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
    // Initialize variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const assemblyKey = Deno.env.get('ASSEMBLYAI_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !assemblyKey) {
      console.error('Missing environment variables. URL:', !!supabaseUrl, 'Service Key:', !!supabaseServiceKey, 'API Key:', !!assemblyKey);
      throw new Error('Missing environment variables');
    }

    // Short test audio URL - this is a Creative Commons sample
    const testAudioUrl = "https://download.samplelib.com/mp3/sample-3s.mp3";
    
    // Create a sample episode for testing
    const episodeId = `test-episode-${Date.now()}`;
    const title = `Test Episode ${Date.now()}`;
    const podcastId = 1; // Use a numeric podcast ID

    // Initialize Supabase client
    console.log('Initializing Supabase client with URL:', supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Create a new episode record
    console.log(`Creating new episode record for original_id ${episodeId}`);
    const { data: newEpisode, error: insertError } = await supabase
      .from('episodes')
      .insert({
        original_id: episodeId,
        title: title,
        podcast_id: podcastId,
        audio_url: testAudioUrl,
        transcription_status: 'processing',
        transcription_started_at: new Date().toISOString(),
        is_hebrew: false
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
    
    const episodeDbId = newEpisode.id;
    console.log(`Successfully created new episode with ID ${episodeDbId}`);

    // Step 2: Start AssemblyAI transcription
    console.log('Starting AssemblyAI transcription for:', testAudioUrl)

    const requestBody: any = {
      audio_url: testAudioUrl,
      language_code: 'en',
      speaker_labels: true,
      sentiment_analysis: true,
      entity_detection: true,
      webhook_url: `${supabaseUrl}/functions/v1/assembly-webhook`,
      webhook_auth_header_name: 'Authorization',
      webhook_auth_header_value: supabaseServiceKey
    };
    
    console.log('Sending request to AssemblyAI:', JSON.stringify(requestBody));
    
    const transcriptionResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
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
      throw new Error(`AssemblyAI error: ${errorText}`);
    }

    const transcriptionData = await transcriptionResponse.json();
    console.log('AssemblyAI response:', transcriptionData);

    // Step 3: Update episode with AssemblyAI ID
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

    return new Response(
      JSON.stringify({ 
        message: 'Transcription test started successfully',
        episode_id: episodeDbId,
        original_id: episodeId,
        transcript_id: transcriptionData.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in test-transcription function:', error);
    
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