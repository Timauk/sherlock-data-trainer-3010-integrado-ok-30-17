import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verifica se as variáveis de ambiente são válidas URLs
const isValidUrl = (urlString: string) => {
  try {
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
};

if (!supabaseUrl || !isValidUrl(supabaseUrl)) {
  throw new Error('VITE_SUPABASE_URL inválida ou não configurada');
}

if (!supabaseKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY não configurada');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);