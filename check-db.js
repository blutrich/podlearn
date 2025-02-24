// Script to check database records after test payment
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('Checking database for payment records...');
  
  try {
    // Check user_credits table
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (creditsError) {
      console.error('Error fetching credits:', creditsError);
    } else {
      console.log('Recent credits records:');
      console.table(credits);
    }
    
    // Check user_subscriptions table
    const { data: subscriptions, error: subsError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
    } else {
      console.log('Recent subscription records:');
      console.table(subscriptions);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
checkDatabase(); 