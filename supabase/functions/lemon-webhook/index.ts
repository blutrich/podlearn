import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const verifySignature = async (payload: string, signature: string, secret: string) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  
  const verified = await crypto.subtle.verify(
    "HMAC",
    key,
    hexToUint8Array(signature),
    encoder.encode(payload)
  );

  return verified;
};

const hexToUint8Array = (hexString: string) => {
  const pairs = hexString.match(/[\dA-F]{2}/gi);
  if (!pairs) return new Uint8Array();
  return new Uint8Array(
    pairs.map(s => parseInt(s, 16))
  );
};

serve(async (req) => {
  console.log("LemonSqueezy webhook received a request");
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('X-Signature');
    if (!signature) {
      console.error('Missing webhook signature');
      throw new Error('Missing webhook signature');
    }

    console.log("Received signature:", signature);

    // Get the raw payload
    const payload = await req.text();
    console.log("Received payload:", payload.substring(0, 200) + "..."); // Log first 200 chars for privacy
    
    // Verify the signature
    const secret = Deno.env.get('LEMON_WEBHOOK_SECRET');
    if (!secret) {
      console.error('Missing webhook secret');
      throw new Error('Missing webhook secret');
    }
    console.log("Using webhook secret:", secret === "podclass" ? "Correct (podclass)" : "Incorrect");

    const isValid = await verifySignature(payload, signature, secret);
    console.log("Signature verification result:", isValid ? "Valid" : "Invalid");
    
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    // Parse the payload
    const data = JSON.parse(payload);
    
    // Check if this is a test mode event
    const isTestMode = data.meta.test_mode === true;
    console.log(`Processing ${isTestMode ? 'TEST' : 'PRODUCTION'} webhook event`);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('DB_URL');
    const supabaseKey = Deno.env.get('DB_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing database credentials');
    }

    console.log("Connecting to Supabase:", supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle different webhook events
    const eventName = data.meta.event_name;
    const customData = data.meta.custom_data || {};
    const { user_id, credits, plan } = customData;
    
    console.log(`Processing event ${eventName} for user ${user_id}`);
    console.log("Custom data:", JSON.stringify(customData));

    switch (eventName) {
      case 'order_created':
        if (credits) {
          console.log(`Adding ${credits} credits to user ${user_id}`);
          
          // First check if the user already has credits
          const { data: existingCredits, error: fetchError } = await supabase
            .from('user_credits')
            .select('credits')
            .eq('user_id', user_id)
            .single();
            
          if (fetchError && fetchError.code !== 'PGRST116') { // Not found is OK
            console.error("Error fetching existing credits:", fetchError);
            throw new Error(`Failed to fetch existing credits: ${fetchError.message}`);
          }
          
          // Calculate new total (either add to existing or start fresh)
          const currentCredits = existingCredits?.credits || 0;
          const newTotal = currentCredits + Number(credits);
          
          console.log(`Updating credits: ${currentCredits} + ${credits} = ${newTotal}`);
          
          const { error: creditsError } = await supabase
            .from('user_credits')
            .upsert({
              user_id,
              credits: newTotal,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });

          if (creditsError) {
            console.error("Error updating credits:", creditsError);
            throw new Error(`Failed to update user credits: ${creditsError.message}`);
          }
          
          console.log(`Successfully updated credits for user ${user_id}`);
        }
        break;

      case 'subscription_created':
      case 'subscription_updated':
        if (plan) {
          console.log(`Setting subscription plan ${plan} for user ${user_id}`);
          
          const { error: subscriptionError } = await supabase
            .from('user_subscriptions')
            .upsert({
              user_id,
              plan,
              status: 'active',
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });

          if (subscriptionError) {
            console.error("Error updating subscription:", subscriptionError);
            throw new Error(`Failed to update user subscription: ${subscriptionError.message}`);
          }
          
          console.log(`Successfully updated subscription for user ${user_id}`);
        }
        break;

      case 'subscription_cancelled':
        if (user_id) {
          console.log(`Cancelling subscription for user ${user_id}`);
          
          const { error: cancelError } = await supabase
            .from('user_subscriptions')
            .update({
              status: 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user_id);

          if (cancelError) {
            console.error("Error cancelling subscription:", cancelError);
            throw new Error(`Failed to cancel subscription: ${cancelError.message}`);
          }
          
          console.log(`Successfully cancelled subscription for user ${user_id}`);
        }
        break;
        
      default:
        console.log(`Received unhandled event type: ${eventName}`);
    }

    return new Response(
      JSON.stringify({ 
        message: 'Webhook processed successfully',
        isTestMode,
        eventName
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
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