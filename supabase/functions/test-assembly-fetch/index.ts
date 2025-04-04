import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { transcript_id } = await req.json();
    
    if (!transcript_id) {
      throw new Error('No transcript ID provided');
    }

    console.log('Fetching transcript details for:', transcript_id);

    // Initialize environment variables
    const assemblyKey = Deno.env.get('ASSEMBLYAI_API_KEY');

    if (!assemblyKey) {
      throw new Error('Missing environment variables');
    }

    // Check AssemblyAI status
    console.log('Checking AssemblyAI transcript...');
    const response = await fetch(`https://api.assemblyai.com/v2/transcript/${transcript_id}`, {
      headers: {
        'Authorization': assemblyKey
      }
    });

    if (!response.ok) {
      console.error('AssemblyAI request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch transcript: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('AssemblyAI response:', {
      status: data.status,
      audio_duration: data.audio_duration,
      text_length: data.text?.length || 0
    });
    
    // Check for paragraphs endpoint
    let paragraphs = [];
    try {
      const paragraphsResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcript_id}/paragraphs`, {
        headers: {
          'Authorization': assemblyKey
        }
      });
      
      if (paragraphsResponse.ok) {
        const paragraphsData = await paragraphsResponse.json();
        paragraphs = paragraphsData.paragraphs || [];
        console.log(`Found ${paragraphs.length} paragraphs`);
      } else {
        console.log('Paragraphs endpoint failed:', paragraphsResponse.status);
      }
    } catch (err) {
      console.error('Error fetching paragraphs:', err);
    }
    
    // Check for utterances endpoint
    let utterances = [];
    try {
      const utterancesResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcript_id}/utterances`, {
        headers: {
          'Authorization': assemblyKey
        }
      });
      
      if (utterancesResponse.ok) {
        const utterancesData = await utterancesResponse.json();
        utterances = utterancesData.utterances || [];
        console.log(`Found ${utterances.length} utterances`);
      } else {
        console.log('Utterances endpoint failed:', utterancesResponse.status);
      }
    } catch (err) {
      console.error('Error fetching utterances:', err);
    }
    
    return new Response(JSON.stringify({
      transcript: {
        id: transcript_id,
        status: data.status,
        text_available: !!data.text,
        text_length: data.text?.length || 0,
        audio_duration: data.audio_duration,
        error: data.error,
        paragraphs_count: paragraphs.length,
        utterances_count: utterances.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in test-assembly-fetch:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 