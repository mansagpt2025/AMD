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

// جلب سجل مشاهدة الفيديو - نسخة مبسطة
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

    // جلب بيانات مشاهدة الفيديو أولاً
    let query = supabase
      .from('video_views')
      .select('*', { count: 'exact' });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: videoData, error, count } = await query
      .order('last_watched_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    // إذا لم يكن هناك بيانات
    if (!videoData || videoData.length === 0) {
      return {
        data: [],
        total: 0,
        totalPages: 0,
        error: null
      };
    }

    // جلب بيانات المستخدمين والمحتوى بشكل منفصل
    const userIds = [...new Set(videoData.map(v => v.user_id).filter(Boolean))];
    const contentIds = [...new Set(videoData.map(v => v.content_id).filter(Boolean))];

    const [usersResult, contentResult] = await Promise.all([
      userIds.length > 0 ? supabase
        .from('profiles')
        .select('id, full_name, email, grade')
        .in('id', userIds) : Promise.resolve({ data: [] }),
      
      contentIds.length > 0 ? supabase
        .from('lecture_contents')
        .select('id, title, type')
        .in('id', contentIds) : Promise.resolve({ data: [] })
    ]);

    const usersMap = new Map();
    const contentMap = new Map();

    if (usersResult.data) {
      usersResult.data.forEach(user => usersMap.set(user.id, user));
    }

    if (contentResult.data) {
      contentResult.data.forEach(content => contentMap.set(content.id, content));
    }

    // دمج البيانات
    const mergedData = videoData.map(video => ({
      ...video,
      profiles: usersMap.get(video.user_id) || null,
      lecture_contents: contentMap.get(video.content_id) || null
    }));

    // إذا كان هناك تصفية بالصف
    if (grade) {
      const filteredData = mergedData.filter(item => 
        item.profiles && item.profiles.grade === grade
      );
      
      return {
        data: filteredData,
        total: filteredData.length,
        totalPages: Math.ceil(filteredData.length / limit),
        error: null
      };
    }

    return {
      data: mergedData,
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

// جلب سجل درجات الامتحان - نسخة مبسطة
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
      .select('*', { count: 'exact' });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: examData, error, count } = await query
      .order('completed_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    if (!examData || examData.length === 0) {
      return {
        data: [],
        total: 0,
        totalPages: 0,
        error: null
      };
    }

    // جلب البيانات المرتبطة
    const userIds = [...new Set(examData.map(e => e.user_id).filter(Boolean))];
    const contentIds = [...new Set(examData.map(e => e.content_id).filter(Boolean))];

    const [usersResult, contentResult] = await Promise.all([
      userIds.length > 0 ? supabase
        .from('profiles')
        .select('id, full_name, email, grade')
        .in('id', userIds) : Promise.resolve({ data: [] }),
      
      contentIds.length > 0 ? supabase
        .from('lecture_contents')
        .select('id, title, type, pass_score')
        .in('id', contentIds) : Promise.resolve({ data: [] })
    ]);

    const usersMap = new Map();
    const contentMap = new Map();

    if (usersResult.data) {
      usersResult.data.forEach(user => usersMap.set(user.id, user));
    }

    if (contentResult.data) {
      contentResult.data.forEach(content => contentMap.set(content.id, content));
    }

    // دمج البيانات
    const mergedData = examData.map(exam => ({
      ...exam,
      profiles: usersMap.get(exam.user_id) || null,
      lecture_contents: contentMap.get(exam.content_id) || null
    }));

    // تصفية بالصف إذا كان مطلوبًا
    if (grade) {
      const filteredData = mergedData.filter(item => 
        item.profiles && item.profiles.grade === grade
      );
      
      return {
        data: filteredData,
        total: filteredData.length,
        totalPages: Math.ceil(filteredData.length / limit),
        error: null
      };
    }

    return {
      data: mergedData,
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

// جلب سجل تسجيل الدخول - نسخة مبسطة
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

    let query = supabase
      .from('profiles')
      .select('id, full_name, email, grade, created_at, updated_at', { count: 'exact' })
      .eq('role', 'student');

    if (userId) {
      query = query.eq('id', userId);
    }

    if (grade) {
      query = query.eq('grade', grade);
    }

    const { data, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    // استخدام updated_at كتاريخ آخر نشاط
    const formattedData = (data || []).map((profile: any) => ({
      ...profile,
      last_sign_in_at: profile.updated_at || profile.created_at
    }));

    return {
      data: formattedData,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
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

// جلب سجل شراء المحاضرات - نسخة مبسطة
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
      .select('*', { count: 'exact' });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: purchasesData, error, count } = await query
      .order('purchased_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    if (!purchasesData || purchasesData.length === 0) {
      return {
        data: [],
        total: 0,
        totalPages: 0,
        error: null
      };
    }

    // جلب البيانات المرتبطة
    const userIds = [...new Set(purchasesData.map(p => p.user_id).filter(Boolean))];
    const packageIds = [...new Set(purchasesData.map(p => p.package_id).filter(Boolean))];

    const [usersResult, packagesResult] = await Promise.all([
      userIds.length > 0 ? supabase
        .from('profiles')
        .select('id, full_name, email, grade')
        .in('id', userIds) : Promise.resolve({ data: [] }),
      
      packageIds.length > 0 ? supabase
        .from('packages')
        .select('id, name, type, price')
        .in('id', packageIds) : Promise.resolve({ data: [] })
    ]);

    const usersMap = new Map();
    const packagesMap = new Map();

    if (usersResult.data) {
      usersResult.data.forEach(user => usersMap.set(user.id, user));
    }

    if (packagesResult.data) {
      packagesResult.data.forEach(pkg => packagesMap.set(pkg.id, pkg));
    }

    // دمج البيانات
    const mergedData = purchasesData.map(purchase => ({
      ...purchase,
      profiles: usersMap.get(purchase.user_id) || null,
      packages: packagesMap.get(purchase.package_id) || null
    }));

    // تصفية بالصف إذا كان مطلوبًا
    if (grade) {
      const filteredData = mergedData.filter(item => 
        item.profiles && item.profiles.grade === grade
      );
      
      return {
        data: filteredData,
        total: filteredData.length,
        totalPages: Math.ceil(filteredData.length / limit),
        error: null
      };
    }

    return {
      data: mergedData,
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

// جلب سجل استخدام الأكواد - نسخة مبسطة
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
      .select('*', { count: 'exact' })
      .eq('is_used', true);

    if (userId) {
      query = query.eq('used_by', userId);
    }

    const { data: codesData, error, count } = await query
      .order('used_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    if (!codesData || codesData.length === 0) {
      return {
        data: [],
        total: 0,
        totalPages: 0,
        error: null
      };
    }

    // جلب البيانات المرتبطة
    const userIds = [...new Set(codesData.map(c => c.used_by).filter(Boolean))];
    const packageIds = [...new Set(codesData.map(c => c.package_id).filter(Boolean))];

    const [usersResult, packagesResult] = await Promise.all([
      userIds.length > 0 ? supabase
        .from('profiles')
        .select('id, full_name, email, grade')
        .in('id', userIds) : Promise.resolve({ data: [] }),
      
      packageIds.length > 0 ? supabase
        .from('packages')
        .select('id, name, type')
        .in('id', packageIds) : Promise.resolve({ data: [] })
    ]);

    const usersMap = new Map();
    const packagesMap = new Map();

    if (usersResult.data) {
      usersResult.data.forEach(user => usersMap.set(user.id, user));
    }

    if (packagesResult.data) {
      packagesResult.data.forEach(pkg => packagesMap.set(pkg.id, pkg));
    }

    // دمج البيانات
    const mergedData = codesData.map(code => ({
      ...code,
      profiles: code.used_by ? usersMap.get(code.used_by) || null : null,
      packages: packagesMap.get(code.package_id) || null
    }));

    // تصفية بالصف إذا كان مطلوبًا
    if (grade) {
      const filteredData = mergedData.filter(item => 
        item.profiles && item.profiles.grade === grade
      );
      
      return {
        data: filteredData,
        total: filteredData.length,
        totalPages: Math.ceil(filteredData.length / limit),
        error: null
      };
    }

    return {
      data: mergedData,
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