import { createClient, SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | null = null

export function createClientBrowser(): SupabaseClient {
  // لو العميل موجود لا雪儿 تهيئته من الأول
  if (browserClient) {
    return browserClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('❌ Missing Supabase env variables')
  }

  browserClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })

  return browserClient
}