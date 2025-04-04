import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

/**
 * IMPORTANT: This webhook needs to be deployed with the --no-verify-jwt flag to work with LemonSqueezy
 * Run: supabase functions deploy lemon-webhook --no-verify-jwt
 * 
 * This allows LemonSqueezy to call this webhook without JWT authentication
 * Instead, we use X-Signature verification for security
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple in-memory rate limiting
// In production, consider using Redis or another persistent store
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const RATE_LIMIT_MAX = 60; // Max 60 requests per minute
const ipRequests = new Map<string, { count: number, resetTime: number }>();

function checkRateLimit(ip: string): { limited: boolean, remaining: number } {
  const now = Date.now();
  const record = ipRequests.get(ip);
  
  // If no record or window expired, create new record
  if (!record || now > record.resetTime) {
    ipRequests.set(ip, { 
      count: 1, 
      resetTime: now + RATE_LIMIT_WINDOW 
    });
    return { limited: false, remaining: RATE_LIMIT_MAX - 1 };
  }
  
  // Increment count
  record.count++;
  
  // Check if over limit
  if (record.count > RATE_LIMIT_MAX) {
    return { limited: true, remaining: 0 };
  }
  
  return { limited: false, remaining: RATE_LIMIT_MAX - record.count };
}

// Clean up expired rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequests.entries()) {
    if (now > record.resetTime) {
      ipRequests.delete(ip);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

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

// Add structured logging helper
function logEvent(level: 'info' | 'warn' | 'error', message: string, data: Record<string, any> = {}) {
  const logData = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data
  };
  
  // In production, you might send this to a logging service
  console[level](JSON.stringify(logData));
}

// Track payment failures for monitoring
let paymentFailures = {
  count: 0,
  lastFailure: null as null | string,
  recentFailures: [] as Array<{time: string, reason: string, data: any}>
};

// Reset failure counts daily
setInterval(() => {
  const oldCount = paymentFailures.count;
  if (oldCount > 0) {
    logEvent('info', `Resetting payment failure count from ${oldCount} to 0`);
  }
  paymentFailures = {
    count: 0,
    lastFailure: null,
    recentFailures: []
  };
}, 24 * 60 * 60 * 1000);

serve(async (req) => {
  logEvent('info', "LemonSqueezy webhook received a request");
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const { limited, remaining } = checkRateLimit(clientIp);
    
    // Apply rate limiting
    if (limited) {
      logEvent('warn', `Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests' }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Date.now() + RATE_LIMIT_WINDOW).toString()
          } 
        }
      );
    }
    
    const signature = req.headers.get('X-Signature');
    if (!signature) {
      logEvent('error', 'Missing webhook signature');
      throw new Error('Missing webhook signature');
    }

    logEvent('info', "Received signature:", { signature });

    // Get the raw payload
    const payload = await req.text();
    logEvent('info', "Received payload:", { payload: payload.substring(0, 200) + "..." }); // Log first 200 chars for privacy
    
    // Verify the signature
    const secret = Deno.env.get('LEMON_WEBHOOK_SECRET');
    if (!secret) {
      logEvent('error', 'Missing webhook secret');
      throw new Error('Missing webhook secret');
    }
    logEvent('info', "Using webhook secret:", { secret: secret === "podclass" ? "Correct (podclass)" : "Incorrect" });

    const isValid = await verifySignature(payload, signature, secret);
    logEvent('info', "Signature verification result:", { isValid });
    
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    // Parse the payload
    const data = JSON.parse(payload);
    
    // Check if this is a test mode event
    const isTestMode = data.meta.test_mode === true;
    logEvent('info', `Processing ${isTestMode ? 'TEST' : 'PRODUCTION'} webhook event`, {
      eventName: data.meta.event_name,
      testMode: isTestMode
    });
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('DB_URL');
    const supabaseKey = Deno.env.get('DB_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      logEvent('error', 'Missing database credentials');
      throw new Error('Missing database credentials');
    }

    logEvent('info', "Connecting to Supabase:", { supabaseUrl });
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle different webhook events
    const eventName = data.meta.event_name;
    const customData = data.meta.custom_data || {};
    const { user_id, credits, plan } = customData;
    
    logEvent('info', `Processing event ${eventName}`, {
      userId: user_id,
      customData,
      testMode: isTestMode
    });

    // Monitor payment failures
    if (eventName === 'order_failed' || eventName === 'subscription_payment_failed') {
      paymentFailures.count++;
      paymentFailures.lastFailure = new Date().toISOString();
      
      // Keep only the 10 most recent failures
      if (paymentFailures.recentFailures.length >= 10) {
        paymentFailures.recentFailures.shift();
      }
      
      paymentFailures.recentFailures.push({
        time: new Date().toISOString(),
        reason: data.data?.attributes?.failure_reason || 'Unknown',
        data: {
          eventName,
          userId: user_id,
          testMode: isTestMode
        }
      });
      
      logEvent('warn', `Payment failure detected: ${eventName}`, {
        userId: user_id,
        reason: data.data?.attributes?.failure_reason || 'Unknown',
        failureCount: paymentFailures.count,
        testMode: isTestMode
      });
      
      // Alert if too many failures (in production you might send this to an alerting system)
      if (paymentFailures.count >= 5 && !isTestMode) {
        logEvent('error', 'ALERT: High payment failure rate detected', {
          count: paymentFailures.count,
          timespan: '24 hours',
          recentFailures: paymentFailures.recentFailures
        });
      }
    }

    switch (eventName) {
      case 'order_created':
        if (credits) {
          logEvent('info', `Adding ${credits} credits to user ${user_id}`);
          
          // First check if the user already has credits
          const { data: existingCredits, error: fetchError } = await supabase
            .from('user_credits')
            .select('credits')
            .eq('user_id', user_id)
            .single();
            
          if (fetchError && fetchError.code !== 'PGRST116') { // Not found is OK
            logEvent('error', "Error fetching existing credits:", { error: fetchError });
            throw new Error(`Failed to fetch existing credits: ${fetchError.message}`);
          }
          
          // Calculate new total (either add to existing or start fresh)
          const currentCredits = existingCredits?.credits || 0;
          const newTotal = currentCredits + Number(credits);
          
          logEvent('info', `Updating credits: ${currentCredits} + ${credits} = ${newTotal}`);
          
          // If the user record exists, update it
          if (existingCredits) {
            const { error: updateError } = await supabase
              .from('user_credits')
              .update({
                credits: newTotal,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user_id);
              
            if (updateError) {
              logEvent('error', "Error updating credits:", { error: updateError });
              throw new Error(`Failed to update user credits: ${updateError.message}`);
            }
          } else {
            // Otherwise, insert a new record
            const { error: insertError } = await supabase
              .from('user_credits')
              .insert({
                user_id,
                credits: newTotal,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              
            if (insertError) {
              logEvent('error', "Error inserting credits:", { error: insertError });
              throw new Error(`Failed to insert user credits: ${insertError.message}`);
            }
          }
          
          logEvent('info', `Successfully updated credits for user ${user_id}`);
        }
        break;

      case 'subscription_created':
      case 'subscription_updated':
        if (plan) {
          console.log(`Setting subscription plan ${plan} for user ${user_id}`);
          
          // First check if user already has a subscription
          const { data: existingSubscription, error: subFetchError } = await supabase
            .from('user_subscriptions')
            .select('id')
            .eq('user_id', user_id)
            .single();
            
          if (subFetchError && subFetchError.code !== 'PGRST116') { // Not found is OK
            console.error("Error fetching existing subscription:", subFetchError);
            throw new Error(`Failed to fetch existing subscription: ${subFetchError.message}`);
          }
          
          // If the user record exists, update it
          if (existingSubscription) {
            const { error: updateError } = await supabase
              .from('user_subscriptions')
              .update({
                plan,
                status: 'active',
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user_id);
              
            if (updateError) {
              console.error("Error updating subscription:", updateError);
              throw new Error(`Failed to update user subscription: ${updateError.message}`);
            }
          } else {
            // Otherwise, insert a new record
            const { error: insertError } = await supabase
              .from('user_subscriptions')
              .insert({
                user_id,
                plan,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              
            if (insertError) {
              console.error("Error inserting subscription:", insertError);
              throw new Error(`Failed to insert user subscription: ${insertError.message}`);
            }
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

    // Add rate limit headers to successful response
    return new Response(
      JSON.stringify({ 
        message: 'Webhook processed successfully',
        isTestMode,
        eventName
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Limit': RATE_LIMIT_MAX.toString()
        } 
      }
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