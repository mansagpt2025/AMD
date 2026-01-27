// lib/supabase/.ts
import { createBrowserClient } from '@supabase/ssr'

// تخزين العميل في متغير عام لمنع التكرار
let supabaseBrowserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClientBrowser() {
  // إذا كان العميل موجوداً بالفعل، أرجع نفس النسخة
  if (supabaseBrowserClient) {
    return supabaseBrowserClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  supabaseBrowserClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  })

  return supabaseBrowserClient
}