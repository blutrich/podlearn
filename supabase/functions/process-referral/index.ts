import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Parse the request body
    const { referrerId, referredId, action } = await req.json()
    
    // Validate required parameters
    if (!referrerId || !referredId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: referrerId and referredId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('API_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Process the referral based on the action
    let result
    
    if (action === 'complete') {
      // Complete the referral and award credits
      const { data, error } = await supabase.rpc('complete_referral', {
        p_referred_id: referredId
      })
      
      if (error) throw error
      result = { success: true, message: 'Referral completed successfully', data }
    } else {
      // Default action: process/create the referral
      const { data, error } = await supabase.rpc('process_referral', {
        p_referrer_id: referrerId,
        p_referred_id: referredId
      })
      
      if (error) throw error
      result = { success: true, message: 'Referral processed successfully', data }
    }
    
    // Return success response
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing referral:', error)
    
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