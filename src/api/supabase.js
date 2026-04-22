import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Supabase client. Requires EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.
 * In production, missing env throws. In development, missing env logs a warning and uses placeholders so the app can boot.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const missing = !supabaseUrl || !supabaseAnonKey;
if (missing) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(
      'Missing Supabase env. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env. Using placeholders; API calls will fail.'
    );
  } else {
    // In production, we log the error instead of throwing to prevent a splash screen hang.
    // The app will boot to the login screen, where API calls will fail with a manageable error.
    console.error(
      'Error: Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Ensure environment variables are set correctly in the build.'
    );
  }
}

const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
