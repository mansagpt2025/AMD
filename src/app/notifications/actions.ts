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

export async function getUserNotifications(userId: string, page: number = 1, limit: number = 15) {
  try {
    const supabase = await getSupabase();
    
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .or(`user_id.eq.${userId},target_grade.is.null,target_section.is.null`)
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    // جلب إشعارات الصف إذا كان المستخدم لديه صف
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('grade, section')
      .eq('id', userId)
      .single();

    if (userProfile?.grade) {
      const { data: gradeNotifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('target_grade', userProfile.grade)
        .is('target_section', null)
        .order('created_at', { ascending: false })
        .range(start, end);

      const { data: sectionNotifications } = userProfile?.section ? 
        await supabase
          .from('notifications')
          .select('*')
          .eq('target_section', userProfile.section)
          .order('created_at', { ascending: false })
          .range(start, end) : { data: null };

      const allNotifications = [
        ...(data || []),
        ...(gradeNotifications || []),
        ...(sectionNotifications || [])
      ];

      // إزالة التكرارات
      const uniqueNotifications = allNotifications.filter((notification, index, self) =>
        index === self.findIndex(n => n.id === notification.id)
      );

      // ترتيب حسب التاريخ
      uniqueNotifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return {
        data: uniqueNotifications.slice(start, end + 1),
        total: count || 0 + (gradeNotifications?.length || 0) + (sectionNotifications?.length || 0),
        totalPages: Math.ceil((count || 0 + (gradeNotifications?.length || 0) + (sectionNotifications?.length || 0)) / limit),
        error: null
      };
    }

    return {
      data: data || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      error: null
    };
  } catch (error: any) {
    console.error('Error in getUserNotifications:', error);
    return {
      data: null,
      total: 0,
      totalPages: 0,
      error: error.message || 'حدث خطأ أثناء جلب الإشعارات'
    };
  }
}

export async function getUnreadCount(userId: string) {
  try {
    const supabase = await getSupabase();
    
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .or(`user_id.eq.${userId},target_grade.is.null,target_section.is.null`)
      .eq('is_read', false);

    if (error) throw error;

    return { count: count || 0, error: null };
  } catch (error: any) {
    console.error('Error in getUnreadCount:', error);
    return { count: 0, error: error.message || 'حدث خطأ أثناء جلب عدد الإشعارات غير المقروءة' };
  }
}

export async function markAsRead(userId: string, notificationId: string) {
  try {
    const supabase = await getSupabase();
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;

    revalidatePath('/notifications');
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error in markAsRead:', error);
    return { success: false, error: error.message || 'حدث خطأ أثناء تحديث الإشعار' };
  }
}

export async function markAllAsRead(userId: string) {
  try {
    const supabase = await getSupabase();
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    revalidatePath('/notifications');
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error in markAllAsRead:', error);
    return { success: false, error: error.message || 'حدث خطأ أثناء تحديث جميع الإشعارات' };
  }
}

export async function deleteNotification(userId: string, notificationId: string) {
  try {
    const supabase = await getSupabase();
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;

    revalidatePath('/notifications');
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error in deleteNotification:', error);
    return { success: false, error: error.message || 'حدث خطأ أثناء حذف الإشعار' };
  }
}