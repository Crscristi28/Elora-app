// 🏗️ SUPABASE CLIENT - Cloudová databáze a storage
// Používá environment variables z Vercelu

import { createClient } from '@supabase/supabase-js'

// Get environment variables - Vite uses import.meta.env in browser
// These are replaced at build time by Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                   typeof process !== 'undefined' && process.env?.SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                       typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ [SUPABASE] Missing environment variables. Cloud sync disabled.')
  console.log('Available env:', import.meta.env)
}

// Vytvoření Supabase klienta
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Helper funkce pro kontrolu připojení
export const isSupabaseReady = () => {
  return supabase !== null
}

// Export jako default
export default supabase