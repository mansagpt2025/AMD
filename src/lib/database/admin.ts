import { createClientServer } from '../supabase-server'

// أنواع البيانات
export interface User {
  id: string
  full_name: string
  email: string
  phone: string
  grade: string
  role: string
  created_at: string
}

export interface Wallet {
  id: string
  user_id: string
  balance: number
  created_at: string
  updated_at: string
}

export interface Package {
  id: string
  name: string
  description: string | null
  price: number
  grade: string
  type: string
  is_active: boolean
  created_at: string
}

export interface Code {
  id: string
  code: string
  package_id: string
  grade: string
  is_used: boolean
  used_by: string | null
  used_at: string | null
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  amount: number
  type: 'add' | 'deduct' | 'purchase'
  description: string | null
  previous_balance: number
  new_balance: number
  created_at: string
}

// الإحصائيات الحقيقية
export async function getDashboardStats() {
  const supabase = await createClientServer()

  try {
    // عدد الطلاب الكلي
    const { count: totalStudents, error: studentsError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student')

    if (studentsError) throw studentsError

    // عدد الباقات المبيعة
    const { count: totalPackages, error: packagesError } = await supabase
      .from('user_packages')
      .select('*', { count: 'exact', head: true })

    if (packagesError) throw packagesError

    // عدد الأكواد المستخدمة
    const { count: usedCodes, error: codesError } = await supabase
      .from('codes')
      .select('*', { count: 'exact', head: true })
      .eq('is_used', true)

    if (codesError) throw codesError

    // متوسط النتائج
    const { data: examResults, error: examError } = await supabase
      .from('exam_results')
      .select('score')
      .limit(100)

    if (examError) throw examError

    const averageScore = examResults && examResults.length > 0
      ? examResults.reduce((acc, curr) => acc + (curr.score || 0), 0) / examResults.length
      : 0

    // إجمالي الأموال في المحافظ
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('balance')

    if (walletsError) throw walletsError

    const totalWalletBalance = wallets?.reduce((acc, curr) => acc + (curr.balance || 0), 0) || 0

    // عدد المستخدمين الجدد هذا الشهر
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: newUsersThisMonth, error: newUsersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString())

    if (newUsersError) throw newUsersError

    return {
      totalStudents: totalStudents || 0,
      totalPackages: totalPackages || 0,
      usedCodes: usedCodes || 0,
      averageScore: Math.round(averageScore),
      totalWalletBalance,
      newUsersThisMonth: newUsersThisMonth || 0
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      totalStudents: 0,
      totalPackages: 0,
      usedCodes: 0,
      averageScore: 0,
      totalWalletBalance: 0,
      newUsersThisMonth: 0
    }
  }
}

// البحث عن مستخدم
export async function searchUser(identifier: string) {
  const supabase = await createClientServer()

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        *,
        wallets!inner (
          balance,
          updated_at
        )
      `)
      .or(`phone.eq.${identifier},email.eq.${identifier}`)
      .single()

    if (error) throw error

    return profiles
  } catch (error) {
    console.error('Error searching user:', error)
    return null
  }
}

// إضافة أموال للمحفظة
export async function addWalletFunds(userId: string, amount: number, description?: string) {
  const supabase = await createClientServer()

  try {
    // الحصول على الرصيد الحالي
    const { data: currentWallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (walletError) throw walletError

    const currentBalance = currentWallet?.balance || 0
    const newBalance = currentBalance + amount

    // تحديث الرصيد
    const { error: updateError } = await supabase
      .from('wallets')
      .upsert({
        user_id: userId,
        balance: newBalance,
        updated_at: new Date().toISOString()
      })

    if (updateError) throw updateError

    // تسجيل العملية (تأكد من وجود جدول wallet_transactions)
    const { error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        amount,
        type: 'add',
        description: description || 'إضافة أموال عن طريق المدير',
        previous_balance: currentBalance,
        new_balance: newBalance
      })

    if (transactionError) {
      console.error('Error logging transaction:', transactionError)
      // نستمر حتى لو فشل التسجيل
    }

    return {
      success: true,
      newBalance,
      message: `تم إضافة ${amount} جنيه إلى المحفظة بنجاح`
    }
  } catch (error) {
    console.error('Error adding wallet funds:', error)
    return {
      success: false,
      message: 'حدث خطأ أثناء إضافة الأموال'
    }
  }
}

// الحصول على جميع الطلاب
export async function getAllStudents(page = 1, limit = 20) {
  const supabase = await createClientServer()

  try {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, count, error } = await supabase
      .from('profiles')
      .select(`
        *,
        wallets!left (
          balance
        ),
        user_packages!left (
          packages!inner (
            name
          )
        )
      `, { count: 'exact' })
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      students: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: (count || 0) > to + 1
    }
  } catch (error) {
    console.error('Error fetching students:', error)
    return {
      students: [],
      total: 0,
      page: 1,
      totalPages: 0,
      hasMore: false
    }
  }
}

// تحديث بيانات الطالب
export async function updateStudent(studentId: string, updates: Partial<User>) {
  const supabase = await createClientServer()

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', studentId)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data,
      message: 'تم تحديث بيانات الطالب بنجاح'
    }
  } catch (error) {
    console.error('Error updating student:', error)
    return {
      success: false,
      message: 'حدث خطأ أثناء تحديث بيانات الطالب'
    }
  }
}

// الحصول على الباقات حسب الصف
export async function getPackagesByGrade(grade: string) {
  const supabase = await createClientServer()

  try {
    const { data, error } = await supabase
      .from('packages')
      .select(`
        *,
        lectures (*),
        codes!left (
          count
        )
      `)
      .eq('grade', grade)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching packages:', error)
    return []
  }
}

// الحصول على آخر العمليات
export async function getRecentTransactions(limit = 10) {
  const supabase = await createClientServer()

  try {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select(`
        *,
        profiles!inner (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return []
  }
}

// إنشاء أكواد جديدة
export async function createCodes(packageId: string, grade: string, count: number) {
  const supabase = await createClientServer()

  try {
    const codes = Array.from({ length: count }, () => ({
      code: generateCode(grade),
      package_id: packageId,
      grade,
      is_used: false,
      created_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('codes')
      .insert(codes)
      .select()

    if (error) throw error

    return {
      success: true,
      data,
      message: `تم إنشاء ${count} كود بنجاح`
    }
  } catch (error) {
    console.error('Error creating codes:', error)
    return {
      success: false,
      message: 'حدث خطأ أثناء إنشاء الأكواد'
    }
  }
}

// توليد كود فريد
function generateCode(grade: string) {
  const prefix = grade.toUpperCase().substring(0, 3)
  const random = Math.random().toString(36).substring(2, 10).toUpperCase()
  const timestamp = Date.now().toString().substring(8)
  return `${prefix}-${random}-${timestamp}`
}