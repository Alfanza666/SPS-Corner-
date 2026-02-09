import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      target: 'esnext',
    },
    define: {
      // Injects the API_KEY if available at build time (e.g. from Vercel env vars)
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY),
      // Polyfill process.env to prevent "process is not defined" error in browser
      'process.env': {}
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'recharts', 'lucide-react', '@supabase/supabase-js', '@google/genai']
    }
  };
});