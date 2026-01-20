import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ خطأ: مفاتيح Supabase غير موجودة')
    throw new Error('Missing Supabase environment variables')
  }
  
  console.log('✅ تم تهيئة عميل Supabase بنجاح')
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createClient()