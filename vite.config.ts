import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // Base harus '/' untuk Vercel
    base: '/',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    define: {
      // Polyfill process.env untuk library yang membutuhkannya
      // Kita masukkan API Key spesifik agar aman
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_GOOGLE_API_KEY || ''),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      // Fallback object kosong untuk mencegah crash "process is not defined"
      'process.env': {} 
    }
  };
});