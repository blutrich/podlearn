// Script to clear subscription for testing
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client - Update with your actual URL and key
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const supabase = createClient(supabaseUrl, supabaseKey);

// The user ID to clear subscription for - REPLACE WITH YOUR USER ID
const userId = 'd7bed83c-44a0-4a4f-925f-efc531f68b2c'; // Use your actual user ID from the screenshot

async function clearSubscription() {
  console.log(`Clearing subscription for user: ${userId}`);
  
  try {
    // Option 1: Change status to cancelled
    const { data, error } = await supabase
      .from('user_subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', userId);
      
    if (error) throw error;
    console.log('Subscription cancelled successfully');
    
    /* Uncomment to completely delete the subscription instead
    const { data, error } = await supabase
      .from('user_subscriptions')
      .delete()
      .eq('user_id', userId);
      
    if (error) throw error;
    console.log('Subscription deleted successfully');
    */
    
  } catch (error) {
    console.error('Error clearing subscription:', error);
  }
}

// Run the function
clearSubscription(); 