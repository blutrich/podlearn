// Script to check current subscription status
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseKey);

// The user ID to check
const userId = 'd7bed83c-44a0-4a4f-925f-efc531f68b2c'; // Use your actual user ID

async function checkSubscriptions() {
  console.log(`Checking subscriptions for user: ${userId}`);
  
  try {
    // Get subscription info
    const { data: subData, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId);
      
    if (subError) throw subError;
    
    if (subData && subData.length > 0) {
      console.log('Current subscriptions:');
      console.table(subData);
    } else {
      console.log('No subscriptions found for this user');
    }
    
    // Get credits info
    const { data: creditData, error: creditError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId);
      
    if (creditError) throw creditError;
    
    if (creditData && creditData.length > 0) {
      console.log('Current credits:');
      console.table(creditData);
    } else {
      console.log('No credits found for this user');
    }
    
  } catch (error) {
    console.error('Error checking subscription:', error);
  }
}

// Run the function
checkSubscriptions(); 