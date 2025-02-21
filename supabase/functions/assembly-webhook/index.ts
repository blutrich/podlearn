/// <reference path="../deno.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.3'

interface WebhookRequest {
  status: string;
  transcript_id: string;
  utterances: Array<{
    text: string;
    speaker: string;
    start: number;
    end: number;
    sentiment?: string;
    sentiment_confidence?: number;
    entities?: Array<{
      entity_type: string;
      text: string;
      start: number;
      end: number;
    }>;
  }>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BATCH_SIZE = 50; // Process 50 segments at a time

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const webhookData = await req.json()
    
    // Verify this is a completed transcription
    if (webhookData.status !== 'completed') {
      return new Response(JSON.stringify({ message: 'Transcription not completed yet' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('API_URL')
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Find the episode with this transcript ID
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select('id')
      .eq('assemblyai_transcript_id', webhookData.transcript_id)
      .single()

    if (episodeError || !episode) {
      throw new Error(`Episode not found for transcript ID: ${webhookData.transcript_id}`)
    }

    // Process transcription segments in batches
    const utterances = webhookData.utterances || [];
    for (let i = 0; i < utterances.length; i += BATCH_SIZE) {
      const batch = utterances.slice(i, i + BATCH_SIZE);
      const segments = batch.map((utterance: any) => ({
        episode_id: episode.id,
        content: utterance.text,
        speaker: utterance.speaker,
        start_time: utterance.start,
        end_time: utterance.end,
        sentiment: utterance.sentiment,
        sentiment_confidence: utterance.sentiment_confidence,
        entities: utterance.entities || []
      }));

      const { error: insertError } = await supabase
        .from('transcriptions')
        .insert(segments)

      if (insertError) {
        throw new Error(`Failed to insert transcription batch ${i/BATCH_SIZE + 1}: ${insertError.message}`)
      }
    }

    // Update episode status
    const { error: updateError } = await supabase
      .from('episodes')
      .update({ 
        transcription_status: 'completed',
        transcription_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', episode.id)

    if (updateError) {
      throw new Error(`Failed to update episode status: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ message: 'Transcription stored successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in assembly-webhook function:', error)
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