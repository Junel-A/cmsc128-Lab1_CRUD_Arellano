import { createClient } from '@supabase/supabase-js'

// grab the secret keys from .env.local file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// creates actual connection tool that the app will use
export const supabase = createClient(supabaseUrl, supabaseAnonKey)