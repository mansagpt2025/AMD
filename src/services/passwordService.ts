import { supabase } from '../lib/supabaseClient';

export const passwordService = {
  // البحث عن المستخدم بالبريد الإلكتروني
  async findUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, grade, section, role')
      .eq('email', email.toLowerCase())
      .single();

    if (error) throw new Error('المستخدم غير موجود');
    return data;
  },

  // البحث عن المستخدم برقم الهاتف
  async findUserByPhone(phone: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, grade, section, role')
      .eq('phone', phone)
      .single();

    if (error) throw new Error('المستخدم غير موجود');
    return data;
  },

  // تغيير كلمة المرور عبر Admin API
  async changeUserPassword(userId: string, newPassword: string) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) throw new Error(error.message);

    // تسجيل العملية في جدول السجلات
    await this.logPasswordChange(userId, newPassword);

    return { success: true };
  },

  // تسجيل تغيير كلمة المرور
  async logPasswordChange(userId: string, newPassword: string) {
    const adminId = (await supabase.auth.getUser()).data.user?.id;

    // يمكنك إنشاء جدول admin_logs لتسجيل العمليات
    await supabase
      .from('admin_logs')
      .insert([
        {
          admin_id: adminId,
          user_id: userId,
          action: 'change_password',
          details: `تم تغيير كلمة المرور`,
          created_at: new Date().toISOString(),
        },
      ])
      .catch(() => {
        // إذا كان الجدول غير موجود، تجاهل الخطأ
      });
  },

  // الحصول على سجل تغييرات كلمات المرور
  async getPasswordChangeHistory(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('admin_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('action', 'change_password')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return data || [];
  },

  // التحقق من قوة كلمة المرور
  validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('يجب أن تكون كلمة المرور على الأقل 8 أحرف');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('يجب أن تحتوي على حرف صغير واحد على الأقل');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('يجب أن تحتوي على رقم واحد على الأقل');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};
