// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://httiyebjgxxwtgggkpgw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0dGl5ZWJqZ3h4d3RnZ2drcGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMjIyOTksImV4cCI6MjA1NDU5ODI5OX0.gS0k4orkiPl1OglKirBiLOqNC-f_flhJLB7iJ6KgxGg";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);