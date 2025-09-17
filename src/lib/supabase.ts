import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js/2.x'
    }
  }
});

// Enhanced connection check with retries
export async function checkSupabaseConnection(retries = 3, delay = 1000): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (!navigator.onLine) {
        console.warn('No internet connection detected');
        return false;
      }

      const { data, error } = await supabase
        .from('events')
        .select('count')
        .limit(1)
        .single();
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Supabase connection attempt ${attempt} failed:`, error);
      
      if (attempt === retries) {
        return false;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  return false;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });
  
  if (error) throw error;
  return data;
}

export async function signInWithLinkedIn() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'linkedin',
    options: {
      redirectTo: window.location.origin,
      scopes: 'r_liteprofile r_emailaddress'
    }
  });
  
  if (error) throw error;
  return data;
}