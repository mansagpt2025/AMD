'use server';

import { revalidatePath } from 'next/cache';

// توليد كود عشوائي
function generateCode(length: number = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

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

export async function getPackages(grade?: string) {
  try {
    const supabase = await getSupabase();
    
    let query = supabase
      .from('packages')
      .select('id, name, description, grade, type, price, duration_days, lecture_count')
      .eq('is_active', true)
      .order('name');

    if (grade) {
      query = query.eq('grade', grade);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error in getPackages:', error);
    return { data: null, error: error.message || 'حدث خطأ أثناء جلب الباقات' };
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

export async function createCode(formData: {
  package_id: string;
  grade: string;
  expires_at?: string;
}) {
  try {
    const supabase = await getSupabase();
    
    // التحقق من وجود الباقة
    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('id, grade')
      .eq('id', formData.package_id)
      .single();

    if (packageError) throw new Error('الباقة غير موجودة');
    
    // التحقق من تطابق الصف
    if (packageData.grade !== formData.grade) {
      throw new Error('الصف المحدد لا يتطابق مع صف الباقة');
    }

    // توليد كود فريد
    const code = `EDU-${generateCode(6)}-${generateCode(4)}`;

    // إدخال الكود في قاعدة البيانات
    const { data, error } = await supabase
      .from('codes')
      .insert({
        code,
        package_id: formData.package_id,
        grade: formData.grade,
        is_used: false,
        expires_at: formData.expires_at || null,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/admin/codes');
    return { data, error: null };
  } catch (error: any) {
    console.error('Error in createCode:', error);
    return { data: null, error: error.message || 'حدث خطأ أثناء إنشاء الكود' };
  }
}

export async function getCodes(page: number = 1, limit: number = 10) {
  try {
    const supabase = await getSupabase();
    
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    // جلب الأكواد
    const { data: codesData, error, count } = await supabase
      .from('codes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    // جلب معلومات الباقات والمستخدمين بشكل منفصل
    let codesWithDetails: any[] = [];
    
    if (codesData && codesData.length > 0) {
      // جلب معلومات الباقات
      const packageIds = codesData.map((code: any) => code.package_id).filter(Boolean);
      let packagesMap = new Map();
      
      if (packageIds.length > 0) {
        const { data: packagesData } = await supabase
          .from('packages')
          .select('id, name, grade, type')
          .in('id', packageIds);
        
        if (packagesData) {
          packagesData.forEach((pkg: any) => {
            packagesMap.set(pkg.id, pkg);
          });
        }
      }

      // جلب معلومات المستخدمين
      const userIds = codesData.map((code: any) => code.used_by).filter(Boolean);
      let usersMap = new Map();
      
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        if (usersData) {
          usersData.forEach((user: any) => {
            usersMap.set(user.id, user);
          });
        }
      }

      // دمج البيانات
      codesWithDetails = codesData.map((code: any) => ({
        ...code,
        packages: packagesMap.get(code.package_id) || null,
        profiles: code.used_by ? usersMap.get(code.used_by) || null : null
      }));
    }

    return {
      data: codesWithDetails,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      error: null
    };
  } catch (error: any) {
    console.error('Error in getCodes:', error);
    return {
      data: null,
      total: 0,
      totalPages: 0,
      error: error.message || 'حدث خطأ أثناء جلب الأكواد'
    };
  }
}

export async function deleteCode(id: string) {
  try {
    const supabase = await getSupabase();
    
    const { error } = await supabase
      .from('codes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/admin/codes');
    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error in deleteCode:', error);
    return { success: false, error: error.message || 'حدث خطأ أثناء حذف الكود' };
  }
}