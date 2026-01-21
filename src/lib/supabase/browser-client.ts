// استخدم createClient مباشرة من @supabase/supabase-js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// تصدير دالة مبسطة
export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}