// Script to check database tables in production
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with production credentials
const supabaseUrl = 'https://httiyebjgxxwtgggkpgw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0dGl5ZWJqZ3h4d3RnZ2drcGd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTAyMjI5OSwiZXhwIjoyMDU0NTk4Mjk5fQ.T6u28L-5M5VU87ONLz5jnuj-Jv5LvADcS6_DleBVVZI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductionTables() {
  console.log('🔍 Checking production database tables...');
  
  try {
    // Check if payment tables exist
    const paymentTables = [
      'user_credits', 
      'user_subscriptions', 
      'user_episode_usage'
    ];
    
    for (const table of paymentTables) {
      console.log(`\n📋 Checking table: ${table}`);
      
      // Try to get the first row to verify the table exists
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`❌ Error accessing table ${table}:`, error.message);
        continue;
      }
      
      console.log(`✅ Table ${table} exists with ${count} rows`);
      
      // Get table structure
      const { data: structureData, error: structureError } = await supabase
        .rpc('get_table_definition', { table_name: table })
        .single();
      
      if (structureError) {
        if (structureError.message.includes('function "get_table_definition" does not exist')) {
          console.log('ℹ️ Cannot get table definition (RPC function not available)');
        } else {
          console.error(`❌ Error getting table structure:`, structureError.message);
        }
      } else if (structureData) {
        console.log(`📊 Table structure:`, structureData);
      }
      
      // Check sample data (first 3 rows)
      const { data: sampleData, error: sampleError } = await supabase
        .from(table)
        .select('*')
        .limit(3);
      
      if (sampleError) {
        console.error(`❌ Error getting sample data:`, sampleError.message);
      } else if (sampleData && sampleData.length > 0) {
        console.log(`📝 Sample data (${sampleData.length} rows):`);
        console.table(sampleData);
      } else {
        console.log(`ℹ️ No data found in table ${table}`);
      }
    }
    
    // Check webhook configuration in Edge Functions
    console.log('\n🌐 Checking Edge Functions');
    
    // We can't directly check Edge Functions config, but we can verify they exist
    console.log('ℹ️ Edge Functions cannot be directly inspected via this API');
    console.log('✅ Webhook URL should be: https://httiyebjgxxwtgggkpgw.supabase.co/functions/v1/lemon-webhook');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function
checkProductionTables(); 