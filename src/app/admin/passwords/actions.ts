'use server';

import { createServerClient } from '@/lib/2supabase';
import { revalidatePath } from 'next/cache';

// ❌ احذف bcryptjs (مش محتاجه مع Supabase Auth)
// Supabase بيهش الباسورد داخليًا

export async function changePassword(formData: {
  identifier: string;
  newPassword: string;
}) {
  try {
    const { identifier, newPassword } = formData;

    // ⬅️ إنشاء Supabase client
    const supabase = createServerClient();

    // البحث عن المستخدم بالبريد أو الهاتف
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, phone')
      .or(`email.eq.${identifier},phone.eq.${identifier}`)
      .single();

    if (profileError || !profile) {
      throw new Error('المستخدم غير موجود');
    }

    // تحديث كلمة المرور عبر Admin API
    const { error: authError } = await supabase.auth.admin.updateUserById(
      profile.id,
      { password: newPassword }
    );

    if (authError) throw authError;

    // (اختياري) تسجيل تغيير كلمة المرور
    const { error: logError } = await supabase
      .from('password_changes')
      .insert({
        user_id: profile.id,
        changed_at: new Date().toISOString(),
        changed_by: 'admin',
      });

    if (logError) {
      console.error('Error logging password change:', logError);
    }

    revalidatePath('/admin/passwords');
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function searchUser(identifier: string) {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, grade, role')
      .or(
        `email.ilike.%${identifier}%,phone.ilike.%${identifier}%,full_name.ilike.%${identifier}%`
      )
      .limit(5);

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}
