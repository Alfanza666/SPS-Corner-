
import { createClient } from '@supabase/supabase-js';

/**
 * Access environment variables with fallbacks.
 * The 'Error: supabaseUrl is required' occurs because createClient 
 * cannot accept an empty string. We use a valid-format placeholder 
 * to allow the app to boot even if keys aren't set yet.
 */
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error(
    "MISSING CONFIGURATION: SUPABASE_URL or SUPABASE_ANON_KEY is not defined. " +
    "Please add these to your environment variables in Vercel settings."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
