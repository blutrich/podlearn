import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables from .env file
dotenv.config();

// Try to load from supabase/functions/.env if main .env doesn't exist
if (!process.env.DB_URL) {
  try {
    const envFile = fs.readFileSync('supabase/functions/.env', 'utf8');
    envFile.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  } catch (e) {
    console.error('Error loading .env file:', e);
  }
}

// Initialize Supabase client
const supabaseUrl = process.env.DB_URL;
const supabaseKey = process.env.DB_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing database credentials');
  process.exit(1);
}

console.log('Creating Supabase client with URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

// Get an existing user ID to work with
const USER_ID = '07550722-a0aa-4705-b225-bf86f0c62a3a';

async function main() {
  try {
    console.log('Testing database operations...');
    
    // First, let's check the constraints on the user_credits table
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type, table_name')
      .eq('table_name', 'user_credits');
    
    if (constraintsError) {
      console.error('Error fetching constraints:', constraintsError);
    } else {
      console.log('Constraints for user_credits table:', constraints);
    }
    
    // Try to use pg_dump format
    console.log('\nTrying SQL query to get table definition...');
    const { data: tableDefinition, error: tableDefError } = await supabase.rpc('get_table_definition', {
      table_name: 'user_credits'
    });
    
    if (tableDefError) {
      console.error('Error getting table definition:', tableDefError);
    } else {
      console.log('Table definition:', tableDefinition);
    }
    
    // Try a direct upsert without specifying onConflict
    console.log('\nTrying direct upsert with UPDATE instead...');
    
    // First fetch the existing record
    const { data: existingData, error: fetchError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', USER_ID)
      .single();
    
    if (fetchError) {
      console.error('Error fetching data:', fetchError);
    } else {
      console.log('Existing data:', existingData);
      
      // Then update it
      const { data: updateData, error: updateError } = await supabase
        .from('user_credits')
        .update({
          credits: (existingData?.credits || 0) + 5,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', USER_ID);
      
      if (updateError) {
        console.error('Update error:', updateError);
      } else {
        console.log('Update successful:', updateData);
      }
    }
    
    // Verify the result again
    const { data: finalData, error: finalError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', USER_ID);
    
    if (finalError) {
      console.error('Error fetching final data:', finalError);
    } else {
      console.log('Final user data after update:', finalData);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main(); 