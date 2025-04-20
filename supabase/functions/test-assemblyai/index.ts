import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
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
    // Get AssemblyAI key
    const assemblyKey = Deno.env.get('ASSEMBLYAI_API_KEY');
    
    if (!assemblyKey) {
      throw new Error('Missing AssemblyAI API key');
    }

    console.log('Testing AssemblyAI connection');
    
    // Test connection to AssemblyAI
    const response = await fetch('https://api.eu.assemblyai.com/v2', {
      headers: {
        'Authorization': assemblyKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to connect to AssemblyAI: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'AssemblyAI connection successful',
      response: data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in test-assemblyai:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 