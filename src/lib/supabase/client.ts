import { createBrowserClient } from '@supabase/ssr'

// فحص متغيرات البيئة
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL غير موجود في .env.local');
}

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY غير موجود في .env.local');
}

// إنشاء العميل
export const createClient = () => {
  return createBrowserClient(
    supabaseUrl!,
    supabaseAnonKey!
  );
}

export const supabase = createClient();

// دالة مساعدة للتحقق من الاتصال
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count');
    
    if (error) {
      console.error('❌ خطأ في اتصال Supabase:', error);
      return { success: false, error };
    }
    
    console.log('✅ اتصال Supabase يعمل بنجاح');
    return { success: true, data };
  } catch (error) {
    console.error('❌ استثناء في اتصال Supabase:', error);
    return { success: false, error };
  }
};