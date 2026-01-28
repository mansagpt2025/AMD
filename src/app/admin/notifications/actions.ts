'use server';

import { revalidatePath } from 'next/cache';

// استيراد Supabase بشكل ديناميكي
async function getSupabase() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('بيانات الاتصال بـ Supabase غير متوفرة');
    }
    
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (error) {
    console.error('خطأ في إنشاء عميل Supabase:', error);
    throw error;
  }
}

export async function getUsers(grade?: string, section?: string) {
  try {
    const supabase = await getSupabase();
    
    let query = supabase
      .from('profiles')
      .select('id, full_name, email, phone, grade, section, role')
      .eq('role', 'student');

    if (grade) {
      query = query.eq('grade', grade);
    }

    if (section) {
      query = query.eq('section', section);
    }

    const { data, error } = await query.order('full_name');

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error in getUsers:', error);
    return { data: null, error: error.message || 'حدث خطأ أثناء جلب المستخدمين' };
  }
}

export async function getGrades() {
  try {
    const supabase = await getSupabase();
    
    const { data, error } = await supabase
      .from('grades')
      .select('id, name, slug')
      .order('name');

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error in getGrades:', error);
    return { data: null, error: error.message || 'حدث خطأ أثناء جلب الصفوف' };
  }
}

export async function getSections() {
  // الأقسام الثابتة في النظام
  const sections = [
    { value: 'general', label: 'عام' },
    { value: 'scientific', label: 'علمي علوم' },
    { value: 'literary', label: 'أدبي' },
    { value: 'science', label: 'علمي' },
    { value: 'math', label: 'رياضيات' },
  ];

  return { data: sections, error: null };
}

export async function getNotifications(page: number = 1, limit: number = 10) {
  try {
    const supabase = await getSupabase();
    
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      error: null
    };
  } catch (error: any) {
    console.error('Error in getNotifications:', error);
    return {
      data: null,
      total: 0,
      totalPages: 0,
      error: error.message || 'حدث خطأ أثناء جلب الإشعارات'
    };
  }
}

export async function sendNotification(formData: {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  targetType: 'all' | 'user' | 'grade' | 'section';
  targetUserId?: string;
  targetGrade?: string;
  targetSection?: string;
}) {
  try {
    const supabase = await getSupabase();
    
    let users: any[] = [];

    // تحديد المستخدمين المستهدفين
    switch (formData.targetType) {
      case 'all':
        // جلب جميع المستخدمين (طلاب فقط)
        const { data: allUsers, error: allError } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'student');
        
        if (allError) throw allError;
        users = allUsers || [];
        break;

      case 'user':
        // مستخدم واحد محدد
        if (formData.targetUserId) {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', formData.targetUserId)
            .single();
          
          if (userError) throw userError;
          users = [userData];
        }
        break;

      case 'grade':
        // جميع طلاب صف معين
        if (formData.targetGrade) {
          const { data: gradeUsers, error: gradeError } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'student')
            .eq('grade', formData.targetGrade);
          
          if (gradeError) throw gradeError;
          users = gradeUsers || [];
        }
        break;

      case 'section':
        // جميع طلاب قسم معين
        if (formData.targetSection) {
          const { data: sectionUsers, error: sectionError } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'student')
            .eq('section', formData.targetSection);
          
          if (sectionError) throw sectionError;
          users = sectionUsers || [];
        }
        break;
    }

    if (users.length === 0) {
      throw new Error('لم يتم العثور على مستخدمين مستهدفين');
    }

    // إرسال الإشعار لكل مستخدم
    const notifications = users.map(user => ({
      user_id: user.id,
      title: formData.title,
      message: formData.message,
      type: formData.type,
      is_read: false,
      target_grade: formData.targetGrade || null,
      target_section: formData.targetSection || null,
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(notifications);

    if (error) throw error;

    revalidatePath('/admin/notifications');
    return { 
      success: true, 
      message: `تم إرسال الإشعار إلى ${users.length} مستخدم`,
      error: null 
    };
  } catch (error: any) {
    console.error('Error in sendNotification:', error);
    return { 
      success: false, 
      message: null,
      error: error.message || 'حدث خطأ أثناء إرسال الإشعار' 
    };
  }
}

export async function deleteNotification(id: string) {
  try {
    const supabase = await getSupabase();
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/admin/notifications');
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error in deleteNotification:', error);
    return { success: false, error: error.message || 'حدث خطأ أثناء حذف الإشعار' };
  }
}

export async function markAsRead(id: string) {
  try {
    const supabase = await getSupabase();
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/admin/notifications');
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error in markAsRead:', error);
    return { success: false, error: error.message || 'حدث خطأ أثناء تحديث الإشعار' };
  }
}

export async function getNotificationStats() {
  try {
    const supabase = await getSupabase();
    
    const { data, error } = await supabase
      .from('notifications')
      .select('type, is_read');

    if (error) throw error;

    const total = data?.length || 0;
    const read = data?.filter(n => n.is_read).length || 0;
    const unread = total - read;
    
    const typeStats = {
      info: data?.filter(n => n.type === 'info').length || 0,
      success: data?.filter(n => n.type === 'success').length || 0,
      warning: data?.filter(n => n.type === 'warning').length || 0,
    };

    return {
      data: {
        total,
        read,
        unread,
        typeStats
      },
      error: null
    };
  } catch (error: any) {
    console.error('Error in getNotificationStats:', error);
    return { data: null, error: error.message || 'حدث خطأ أثناء جلب إحصائيات الإشعارات' };
  }
}