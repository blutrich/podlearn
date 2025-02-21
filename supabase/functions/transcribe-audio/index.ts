import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { episodeId, audioUrl, title, podcastId } = await req.json()

    if (!episodeId || !audioUrl || !title || !podcastId) {
      throw new Error('Missing required parameters')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('API_URL')
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if an episode record already exists
    const { data: existingEpisode, error: searchError } = await supabase
      .from('episodes')
      .select('id, transcription_status')
      .eq('original_id', episodeId)
      .maybeSingle()

    if (searchError) {
      throw new Error(`Error checking existing episode: ${searchError.message}`)
    }

    let episodeDbId

    if (existingEpisode) {
      // Update existing episode
      episodeDbId = existingEpisode.id
      if (existingEpisode.transcription_status === 'completed') {
        return new Response(
          JSON.stringify({ message: 'Transcription already exists' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error: updateError } = await supabase
        .from('episodes')
        .update({
          transcription_status: 'processing',
          transcription_started_at: new Date().toISOString(),
          max_transcription_duration: '20 minutes',
          transcription_error: null
        })
        .eq('id', episodeDbId)

      if (updateError) {
        throw new Error(`Error updating episode: ${updateError.message}`)
      }
    } else {
      // Create new episode record
      const { data: newEpisode, error: insertError } = await supabase
        .from('episodes')
        .insert({
          original_id: episodeId,
          title: title,
          podcast_id: podcastId,
          audio_url: audioUrl,
          transcription_status: 'processing',
          transcription_started_at: new Date().toISOString(),
          max_transcription_duration: '20 minutes'
        })
        .select()
        .single()

      if (insertError || !newEpisode) {
        throw new Error(`Error creating episode: ${insertError?.message}`)
      }

      episodeDbId = newEpisode.id
    }

    // Start AssemblyAI transcription
    const assemblyKey = Deno.env.get('ASSEMBLYAI_API_KEY')
    if (!assemblyKey) {
      throw new Error('Missing AssemblyAI API key')
    }

    console.log('Starting AssemblyAI transcription for:', audioUrl)

    // Create transcription request
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'authorization': assemblyKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        speaker_labels: true,
        entity_detection: true,
        sentiment_analysis: true,
        webhook_url: `${Deno.env.get('FUNCTIONS_URL')}/assembly-webhook`,
        webhook_auth_header_name: 'Authorization',
        webhook_auth_header_value: Deno.env.get('WEBHOOK_SECRET')
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AssemblyAI error: ${errorText}`)
    }

    const transcriptionData = await response.json()
    console.log('AssemblyAI response:', transcriptionData)

    // Update episode with AssemblyAI ID
    const { error: updateError } = await supabase
      .from('episodes')
      .update({
        assemblyai_transcript_id: transcriptionData.id
      })
      .eq('id', episodeDbId)

    if (updateError) {
      throw new Error(`Error updating episode with transcript ID: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        message: 'Transcription started successfully',
        transcript_id: transcriptionData.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in transcribe-audio function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
