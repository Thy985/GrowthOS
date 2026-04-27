import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase configuration missing. Using placeholders.');
  console.warn('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
