// Load environment variables for Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase client here with the above variables
// Your Supabase initialization code here...

export { supabaseUrl, supabaseAnonKey };