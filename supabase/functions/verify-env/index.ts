import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check for required environment variables
    const environmentVariables = {
      // Supabase
      SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? '✓ Set' : 'Missing',
      
      // AssemblyAI
      ASSEMBLYAI_API_KEY: Deno.env.get('ASSEMBLYAI_API_KEY') ? '✓ Set' : 'Missing',
      
      // OpenAI
      OPENAI_API_KEY: Deno.env.get('OPENAI_API_KEY') ? '✓ Set' : 'Missing',
      
      // LemonSqueezy
      LEMON_WEBHOOK_SECRET: Deno.env.get('LEMON_WEBHOOK_SECRET') ? '✓ Set' : 'Missing',
      LEMON_SQUEEZY_API_KEY: Deno.env.get('LEMON_SQUEEZY_API_KEY') ? '✓ Set' : 'Missing',
    };

    const missingVariables = Object.entries(environmentVariables)
      .filter(([_, value]) => value === 'Missing')
      .map(([key]) => key);

    return new Response(JSON.stringify({
      status: missingVariables.length === 0 ? 'ok' : 'missing_variables',
      environment: environmentVariables,
      missing: missingVariables,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 