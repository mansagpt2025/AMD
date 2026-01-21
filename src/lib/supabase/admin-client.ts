import { createClient } from '@supabase/supabase-js'

// عميل للمهام الإدارية فقط
export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!  // استخدم Service Key
  )
}