import { createClient } from '@supabase/supabase-js';

// Ambil variable dengan aman, cek import.meta.env DULU, baru process.env
const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  // Fallback ke process.env (yang sudah di-define di vite.config.ts)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Cek apakah config valid
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey && supabaseUrl !== 'undefined';

// PENTING: Jangan biarkan createClient crash aplikasi jika url kosong.
// Gunakan fallback dummy URL jika kosong, nanti UI di App.tsx yang akan handle errornya.
const safeUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const safeKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder';

export const supabase = createClient(safeUrl, safeKey);
