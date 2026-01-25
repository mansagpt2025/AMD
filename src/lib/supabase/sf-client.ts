import { createClient } from '@supabase/supabase-js'

export function createClientBrowser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('❌ Missing NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseKey) {
    throw new Error('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  console.log('✅ Supabase client created with URL:', supabaseUrl.substring(0, 20) + '...')

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
}