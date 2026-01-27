import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// استخدام مفتاح الخدمة للإدارة الكاملة
export const adminClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// الإحصائيات
export async function getAdminStats() {
  // في حالة عدم وجود بيانات، نعيد قيم افتراضية
  const defaultStats = {
    totalStudents: 0,
    totalPackages: 0,
    usedCodes: 0,
    averageScore: 0
  };

  try {
    const [
      { count: totalStudents },
      { count: totalPackages },
      { count: usedCodes },
      { data: examResults }
    ] = await Promise.all([
      adminClient.from('profiles').select('*', { count: 'exact', head: true }),
      adminClient.from('user_packages').select('*', { count: 'exact', head: true }),
      adminClient.from('codes').select('*', { count: 'exact', head: true }).eq('is_used', true),
      adminClient.from('exam_results').select('score').limit(100)
    ]);

    const averageScore = examResults?.length 
      ? examResults.reduce((acc, curr) => acc + (curr.score || 0), 0) / examResults.length
      : 0;

    return {
      totalStudents: totalStudents || 0,
      totalPackages: totalPackages || 0,
      usedCodes: usedCodes || 0,
      averageScore: Math.round(averageScore)
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return defaultStats;
  }
}

// البحث عن مستخدم
export async function findUserByIdentifier(identifier: string) {
  try {
    // البحث برقم الهاتف أو البريد
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('*')
      .or(`email.eq.${identifier},phone.eq.${identifier}`)
      .single();

    if (!profiles) return null;

    // الحصول على رصيد المحفظة
    const { data: wallet } = await adminClient
      .from('wallets')
      .select('balance')
      .eq('user_id', profiles.id)
      .single();

    return {
      ...profiles,
      currentBalance: wallet?.balance || 0
    };
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

// إضافة أموال إلى المحفظة
export async function addToWallet(userId: string, amount: number, adminId: string) {
  try {
    // الحصول على الرصيد الحالي
    const { data: currentWallet } = await adminClient
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    const currentBalance = currentWallet?.balance || 0;
    const newBalance = currentBalance + amount;

    // تحديث الرصيد
    const { error: updateError } = await adminClient
      .from('wallets')
      .upsert({
        user_id: userId,
        balance: newBalance,
        updated_at: new Date().toISOString()
      });

    if (updateError) throw updateError;

    // تسجيل العملية في جدول منفصل (يمكنك إنشاؤه)
    const { error: logError } = await adminClient
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        amount,
        type: 'add',
        admin_id: adminId,
        previous_balance: currentBalance,
        new_balance: newBalance,
        created_at: new Date().toISOString()
      });

    if (logError) throw logError;

    return { success: true, newBalance };
  } catch (error) {
    console.error('Error adding to wallet:', error);
    throw error;
  }
}

// إدارة الأكواد
export async function generateCodes(packageId: string, grade: string, count: number) {
  try {
    const codes = [];
    
    for (let i = 0; i < count; i++) {
      const code = `CODE-${grade.toUpperCase()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      codes.push({
        code,
        package_id: packageId,
        grade,
        is_used: false,
        created_at: new Date().toISOString()
      });
    }

    const { data, error } = await adminClient
      .from('codes')
      .insert(codes)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error generating codes:', error);
    throw error;
  }
}

// الحصول على جميع الطلاب
export async function getStudents(page = 1, limit = 20) {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await adminClient
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      students: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    };
  } catch (error) {
    console.error('Error getting students:', error);
    throw error;
  }
}

// تحديث بيانات الطالب
export async function updateStudent(studentId: string, updates: any) {
  try {
    const { data, error } = await adminClient
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
}

// الحصول على الباقات حسب الصف
export async function getPackagesByGrade(grade: string) {
  try {
    const { data, error } = await adminClient
      .from('packages')
      .select(`
        *,
        lectures:lectures(*),
        codes:codes(*)
      `)
      .eq('grade', grade)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting packages by grade:', error);
    throw error;
  }
}