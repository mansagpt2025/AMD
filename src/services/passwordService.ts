'use server';

import { supabase } from '../lib/supabaseClient';
import { revalidatePath } from 'next/cache';

export const passwordService = {
  async findUserByEmail(email: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, grade, section, role, created_at')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (error) throw error;
      if (!data) throw new Error('المستخدم غير موجود');
      
      return data;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('خطأ في البحث عن المستخدم');
    }
  },

  async findUserByPhone(phone: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, grade, section, role, created_at')
        .eq('phone', phone.trim())
        .single();

      if (error) throw error;
      if (!data) throw new Error('المستخدم غير موجود');
      
      return data;
    } catch (error) {
      console.error('Error finding user by phone:', error);
      throw new Error('خطأ في البحث عن المستخدم');
    }
  },

  async changeUserPassword(userId: string, newPassword: string) {
    try {
      // تنفيذ تغيير كلمة المرور في Supabase Auth
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (error) throw error;
      
      // تسجيل تغيير كلمة المرور
      await this.logPasswordChange(userId);
      
      // إعادة التحقق من الصفحة
      revalidatePath('/admin/passwords');
      
      return { success: true };
    } catch (error) {
      console.error('Error changing password:', error);
      throw new Error('خطأ في تغيير كلمة المرور');
    }
  },

  async logPasswordChange(userId: string) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const changed_by = userData.user?.id;

      const { error } = await supabase
        .from('password_changes')
        .insert({
          user_id: userId,
          changed_at: new Date().toISOString(),
          changed_by
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging password change:', error);
    }
  },

  validatePassword(password: string) {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('يجب أن تكون 8 أحرف على الأقل');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('يجب أن تحتوي على حرف كبير');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('يجب أن تحتوي على حرف صغير');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('يجب أن تحتوي على رقم');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('يجب أن تحتوي على رمز خاص');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};