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

// جلب جميع الطلاب مع إحصائيات
export async function getStudents(search?: string, grade?: string) {
  try {
    const supabase = await getSupabase();
    
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student');

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    if (grade) {
      query = query.eq('grade', grade);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // جلب إحصائيات لكل طالب
    const studentsWithStats = await Promise.all(
      (data || []).map(async (student) => {
        const [
          videoViews,
          examResults,
          userPackages,
          usedCodes
        ] = await Promise.all([
          // عدد مشاهدات الفيديو
          supabase
            .from('video_views')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', student.id),
          
          // نتائج الامتحانات
          supabase
            .from('exam_results')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', student.id),
          
          // الباقات المشتراة
          supabase
            .from('user_packages')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', student.id),
          
          // الأكواد المستخدمة
          supabase
            .from('codes')
            .select('id', { count: 'exact', head: true })
            .eq('used_by', student.id)
            .eq('is_used', true)
        ]);

        return {
          ...student,
          stats: {
            videoViews: videoViews.count || 0,
            examResults: examResults.count || 0,
            userPackages: userPackages.count || 0,
            usedCodes: usedCodes.count || 0
          }
        };
      })
    );

    return { data: studentsWithStats, error: null };
  } catch (error: any) {
    console.error('Error in getStudents:', error);
    return { data: null, error: error.message || 'حدث خطأ أثناء جلب الطلاب' };
  }
}

// جلب سجل مشاهدة الفيديو
export async function getVideoViews(
  userId?: string, 
  grade?: string,
  page: number = 1,
  limit: number = 10
) {
  try {
    const supabase = await getSupabase();
    
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from('video_views')
      .select(`
        *,
        profiles!video_views_user_id_fkey (
          full_name,
          email,
          grade
        ),
        lecture_contents!video_views_content_id_fkey (
          title,
          type
        )
      `, { count: 'exact' });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (grade) {
      query = query.eq('profiles.grade', grade);
    }

    const { data, error, count } = await query
      .order('last_watched_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      error: null
    };
  } catch (error: any) {
    console.error('Error in getVideoViews:', error);
    return {
      data: null,
      total: 0,
      totalPages: 0,
      error: error.message || 'حدث خطأ أثناء جلب سجل المشاهدة'
    };
  }
}

// جلب سجل درجات الامتحان
export async function getExamResults(
  userId?: string,
  grade?: string,
  page: number = 1,
  limit: number = 10
) {
  try {
    const supabase = await getSupabase();
    
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from('exam_results')
      .select(`
        *,
        profiles!exam_results_user_id_fkey (
          full_name,
          email,
          grade
        ),
        lecture_contents!exam_results_content_id_fkey (
          title,
          type,
          pass_score
        )
      `, { count: 'exact' });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (grade) {
      query = query.eq('profiles.grade', grade);
    }

    const { data, error, count } = await query
      .order('completed_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      error: null
    };
  } catch (error: any) {
    console.error('Error in getExamResults:', error);
    return {
      data: null,
      total: 0,
      totalPages: 0,
      error: error.message || 'حدث خطأ أثناء جلب سجل الامتحانات'
    };
  }
}

// جلب سجل تسجيل الدخول (من خلال auth.users)
export async function getLoginHistory(
  userId?: string,
  grade?: string,
  page: number = 1,
  limit: number = 10
) {
  try {
    const supabase = await getSupabase();
    
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    // أولاً نجلب الطلاب المطلوبين
    let profilesQuery = supabase
      .from('profiles')
      .select('id, full_name, email, grade, last_sign_in_at')
      .eq('role', 'student');

    if (userId) {
      profilesQuery = profilesQuery.eq('id', userId);
    }

    if (grade) {
      profilesQuery = profilesQuery.eq('grade', grade);
    }

    const { data: profiles, error: profilesError } = await profilesQuery
      .order('last_sign_in_at', { ascending: false })
      .range(start, end);

    if (profilesError) throw profilesError;

    return {
      data: profiles || [],
      total: 50, // تقديري - يمكن تعديله حسب احتياجاتك
      totalPages: Math.ceil(50 / limit),
      error: null
    };
  } catch (error: any) {
    console.error('Error in getLoginHistory:', error);
    return {
      data: null,
      total: 0,
      totalPages: 0,
      error: error.message || 'حدث خطأ أثناء جلب سجل تسجيل الدخول'
    };
  }
}

// جلب سجل شراء المحاضرات
export async function getPurchases(
  userId?: string,
  grade?: string,
  page: number = 1,
  limit: number = 10
) {
  try {
    const supabase = await getSupabase();
    
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from('user_packages')
      .select(`
        *,
        profiles!user_packages_user_id_fkey (
          full_name,
          email,
          grade
        ),
        packages!user_packages_package_id_fkey (
          name,
          type,
          price
        )
      `, { count: 'exact' });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (grade) {
      query = query.eq('profiles.grade', grade);
    }

    const { data, error, count } = await query
      .order('purchased_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      error: null
    };
  } catch (error: any) {
    console.error('Error in getPurchases:', error);
    return {
      data: null,
      total: 0,
      totalPages: 0,
      error: error.message || 'حدث خطأ أثناء جلب سجل المشتريات'
    };
  }
}

// جلب سجل استخدام الأكواد
export async function getCodeUsage(
  userId?: string,
  grade?: string,
  page: number = 1,
  limit: number = 10
) {
  try {
    const supabase = await getSupabase();
    
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from('codes')
      .select(`
        *,
        profiles!codes_used_by_fkey (
          full_name,
          email,
          grade
        ),
        packages!codes_package_id_fkey (
          name,
          type
        )
      `, { count: 'exact' })
      .eq('is_used', true);

    if (userId) {
      query = query.eq('used_by', userId);
    }

    if (grade) {
      query = query.eq('profiles.grade', grade);
    }

    const { data, error, count } = await query
      .order('used_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      error: null
    };
  } catch (error: any) {
    console.error('Error in getCodeUsage:', error);
    return {
      data: null,
      total: 0,
      totalPages: 0,
      error: error.message || 'حدث خطأ أثناء جلب سجل استخدام الأكواد'
    };
  }
}

// جلب الصفوف
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

// جلب إحصائيات عامة
export async function getOverallStats() {
  try {
    const supabase = await getSupabase();
    
    const [
      { count: totalStudents },
      { count: totalVideoViews },
      { count: totalExams },
      { count: totalPurchases },
      { count: totalCodesUsed }
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student'),
      
      supabase
        .from('video_views')
        .select('id', { count: 'exact', head: true }),
      
      supabase
        .from('exam_results')
        .select('id', { count: 'exact', head: true }),
      
      supabase
        .from('user_packages')
        .select('id', { count: 'exact', head: true }),
      
      supabase
        .from('codes')
        .select('id', { count: 'exact', head: true })
        .eq('is_used', true)
    ]);

    return {
      data: {
        totalStudents: totalStudents || 0,
        totalVideoViews: totalVideoViews || 0,
        totalExams: totalExams || 0,
        totalPurchases: totalPurchases || 0,
        totalCodesUsed: totalCodesUsed || 0
      },
      error: null
    };
  } catch (error: any) {
    console.error('Error in getOverallStats:', error);
    return { data: null, error: error.message || 'حدث خطأ أثناء جلب الإحصائيات' };
  }
}