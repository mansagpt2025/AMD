'use server';

import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabase() {
  const cookieStore = await cookies();  // ✅ await هنا مهم

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
      },
    }
  );
}


async function getCurrentUser() {
  const supabase = await getSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('غير مصرح');
  return user;
}

export async function getUserNotifications(page: number = 1, limit: number = 15) {
  try {
    const user = await getCurrentUser();
    const supabase = await getSupabase();
    
    const start = (page - 1) * limit;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('grade, section')
      .eq('id', user.id)
      .single();

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('created_at', { ascending: false });

    if (profile?.grade) {
      query = query.or(`target_grade.eq.${profile.grade},target_grade.is.null`);
    }
    if (profile?.section) {
      query = query.or(`target_section.eq.${profile.section},target_section.is.null`);
    }

    const { data, error, count } = await query.range(start, start + limit - 1);
    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      error: null
    };
  } catch (error: any) {
    return { data: [], total: 0, totalPages: 0, error: error.message };
  }
}

export async function getUnreadCount() {
  try {
    const user = await getCurrentUser();
    const supabase = await getSupabase();
    
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
    return { count: count || 0, error: null };
  } catch (error: any) {
    return { count: 0, error: error.message };
  }
}

export async function markAsRead(notificationId: string) {
  try {
    const user = await getCurrentUser();
    const supabase = await getSupabase();
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) throw error;
    revalidatePath('/notifications');
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markAllAsRead() {
  try {
    const user = await getCurrentUser();
    const supabase = await getSupabase();
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
    revalidatePath('/notifications');
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    const user = await getCurrentUser();
    const supabase = await getSupabase();
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) throw error;
    revalidatePath('/notifications');
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}