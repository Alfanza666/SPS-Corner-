
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.39.7';

/**
 * Helper to safely access environment variables in various environments (Vite, CRA, Node).
 * Prevents "ReferenceError: process is not defined" in pure browser builds.
 */
const getEnv = (key: string): string => {
  // 1. Try standard process.env (Node/CRA/Next.js)
  if (typeof process !== 'undefined' && process.env) {
    const val = process.env[key] || process.env[`REACT_APP_${key}`] || process.env[`NEXT_PUBLIC_${key}`];
    if (val) return val;
  }

  // 2. Try Vite import.meta.env
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      const val = import.meta.env[key] || import.meta.env[`VITE_${key}`];
      if (val) return val;
    }
  } catch (e) {
    // Ignore errors if import.meta is not supported
  }

  return '';
};

// Use safe getters
const supabaseUrl = getEnv('SUPABASE_URL') || 'https://placeholder.supabase.co';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || 'placeholder-key';

// Log warning only in development/console, don't crash the app
if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn("⚠️ Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your Vercel Project Settings.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
