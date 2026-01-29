'use server';

import { cookies as nextCookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// =========================
// Helpers
// =========================

async function getSupabaseServer() {
  const cookieStore = await nextCookies(); // ننتظر Promise

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

async function getServerUser() {
  const supabase = await getSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) throw new Error('غير مصرح');
  return { supabase, user };
}

// =========================
// Notifications
// =========================

export async function getUserNotifications(page = 1, limit = 15) {
  try {
    const { supabase, user } = await getServerUser();
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data: profile } = await supabase
      .from('profiles')
      .select('grade, section')
      .eq('id', user.id)
      .single();

    const queries: any[] = [
      supabase.from('notifications')
        .select('*')
        .or(`user_id.eq.${user.id},target_grade.is.null,target_section.is.null`)
    ];

    if (profile?.grade) {
      queries.push(
        supabase.from('notifications')
          .select('*')
          .eq('target_grade', profile.grade)
          .is('target_section', null)
      );
    }

    if (profile?.section) {
      queries.push(
        supabase.from('notifications')
          .select('*')
          .eq('target_section', profile.section)
      );
    }

    const results = await Promise.all(queries.map(q => q.order('created_at', { ascending: false })));

    const allNotifications = results.flatMap(r => r.data || []);
    const uniqueNotifications = allNotifications.filter(
      (n, i, arr) => i === arr.findIndex(x => x.id === n.id)
    );

    uniqueNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = uniqueNotifications.length;
    const totalPages = Math.ceil(total / limit);
    const pageData = uniqueNotifications.slice(start, end + 1);

    return { data: pageData, total, totalPages, error: null };
  } catch (err: any) {
    return { data: [], total: 0, totalPages: 1, error: err.message || 'حدث خطأ أثناء جلب الإشعارات' };
  }
}

export async function getUnreadCount() {
  try {
    const { supabase, user } = await getServerUser();

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .or(`user_id.eq.${user.id},target_grade.is.null,target_section.is.null`)
      .eq('is_read', false);

    if (error) throw error;
    return { count: count || 0, error: null };
  } catch (err: any) {
    return { count: 0, error: err.message || 'خطأ في جلب غير المقروء' };
  }
}

export async function markAsRead(notificationId: string) {
  try {
    const { supabase, user } = await getServerUser();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function markAllAsRead() {
  try {
    const { supabase, user } = await getServerUser();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    const { supabase, user } = await getServerUser();
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
