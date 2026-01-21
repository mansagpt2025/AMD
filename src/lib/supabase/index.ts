// ملف رئيسي يجمع كل الـ clients
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// تصدير عميل واحد بسيط
export const supabase = createClient(supabaseUrl, supabaseAnonKey)