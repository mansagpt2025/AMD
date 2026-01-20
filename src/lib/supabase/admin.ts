import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// حل مؤقت: إذا لم يكن Service Role Key متاحاً، نستخدم Anon Key
let supabaseAdmin

if (supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
} else {
  console.warn('SUPABASE_SERVICE_ROLE_KEY not found. Using regular client for admin operations.')
  // سنتعامل مع هذا لاحقاً
}

export { supabaseAdmin }