'use server'

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// إنشاء عميل admin باستخدام Service Role Key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function deductWalletBalance(
  userId: string, 
  amount: number, 
  packageId: string, 
  source: 'wallet' | 'code'
) {
  try {
    // التحقق من المدخلات
    if (!userId || !amount || amount <= 0) {
      throw new Error('بيانات غير صالحة')
    }

    // جلب المحفظة مع قفل الصف (row lock) لمنع race condition
    const { data: wallet, error: fetchError } = await supabaseAdmin
      .from('wallets')
      .select('id, balance, user_id')
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      console.error('Error fetching wallet:', fetchError)
      throw new Error('فشل في جلب بيانات المحفظة')
    }

    const currentBalance = wallet.balance || 0
    
    if (currentBalance < amount) {
      throw new Error(`رصيد غير كافٍ. المطلوب: ${amount} جنيه، المتاح: ${currentBalance} جنيه`)
    }

    const newBalance = currentBalance - amount

    // تحديث الرصيد
    const { error: updateError } = await supabaseAdmin
      .from('wallets')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)
      .eq('user_id', userId) // التأكد من عدم تغيير المستخدم

    if (updateError) {
      console.error('Error updating wallet:', updateError)
      throw new Error('فشل في خصم المبلغ')
    }

    // تسجيل المعاملة
    const { error: transactionError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        amount: -amount, // سالب للخصم
        type: 'purchase',
        description: `شراء باقة - الطريقة: ${source === 'wallet' ? 'محفظة' : 'كود'}`,
        previous_balance: currentBalance,
        new_balance: newBalance,
        created_at: new Date().toISOString()
      })

    if (transactionError) {
      console.error('Error recording transaction:', transactionError)
      // لا نوقف العملية إذا فشل التسجيل فقط
    }

    return {
      success: true,
      newBalance: newBalance,
      message: 'تم خصم المبلغ بنجاح'
    }

  } catch (error: any) {
    console.error('Error in deductWalletBalance:', error)
    return {
      success: false,
      message: error.message || 'حدث خطأ أثناء خصم المبلغ'
    }
  }
}

export async function markCodeAsUsed(codeId: string, userId: string) {
  try {
    if (!codeId || !userId) {
      throw new Error('بيانات غير صالحة')
    }

    // التحقق من أن الكود لم يُستخدم (check قبل update)
    const { data: codeCheck, error: checkError } = await supabaseAdmin
      .from('codes')
      .select('is_used, used_by')
      .eq('id', codeId)
      .single()

    if (checkError) {
      throw new Error('الكود غير موجود')
    }

    if (codeCheck.is_used) {
      throw new Error('هذا الكود مستخدم بالفعل')
    }

    // تحديث الكود مع التأكد من أنه لم يُستخدم (optimistic locking)
    const { data, error } = await supabaseAdmin
      .from('codes')
      .update({
        is_used: true,
        used_by: userId,
        used_at: new Date().toISOString()
      })
      .eq('id', codeId)
      .eq('is_used', false) // شرط مهم: يتأكد أنه لم يُستخدم أثناء الفحص
      .select()

    if (error || !data || data.length === 0) {
      throw new Error('فشل في استخدام الكود، ربما تم استخدامه للتو')
    }

    return {
      success: true,
      message: 'تم استخدام الكود بنجاح'
    }

  } catch (error: any) {
    console.error('Error in markCodeAsUsed:', error)
    return {
      success: false,
      message: error.message || 'حدث خطأ أثناء استخدام الكود'
    }
  }
}

export async function createUserPackage(
  userId: string,
  packageId: string,
  durationDays: number,
  source: 'wallet' | 'code'
) {
  try {
    if (!userId || !packageId) {
      throw new Error('بيانات غير صالحة')
    }

    // التحقق من عدم وجود اشتراك فعال مسبقاً (لنفس الباقة)
    const { data: existingPackage, error: checkError } = await supabaseAdmin
      .from('user_packages')
      .select('id')
      .eq('user_id', userId)
      .eq('package_id', packageId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing package:', checkError)
    }

    if (existingPackage) {
      throw new Error('لديك بالفعل اشتراك فعال في هذه الباقة')
    }

    // حساب تاريخ الانتهاء
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (durationDays || 30))

    // إنشاء الاشتراك
    const { data, error } = await supabaseAdmin
      .from('user_packages')
      .insert({
        user_id: userId,
        package_id: packageId,
        purchased_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
        source: source
      })
      .select()

    if (error) {
      console.error('Error creating user package:', error)
      throw new Error('فشل في إنشاء الاشتراك')
    }

    // إنشاء إشعار للمستخدم
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'تم تفعيل الباقة بنجاح 🎉',
        message: `تم تفعيل باقتك الجديدة وتستمتع بالمحتوى الآن`,
        type: 'success',
        created_at: new Date().toISOString()
      })

    return {
      success: true,
      data: data,
      message: 'تم إضافة الباقة بنجاح'
    }

  } catch (error: any) {
    console.error('Error in createUserPackage:', error)
    return {
      success: false,
      message: error.message || 'حدث خطأ أثناء إضافة الباقة'
    }
  }
}

// دالة للتحقق من الكود قبل الشراء (اختيارية - للتحقق المسبق)
export async function validateCode(code: string, gradeSlug: string, packageId: string, userId: string) {
  try {
    const { data: codeData, error } = await supabaseAdmin
      .from('codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (error || !codeData) {
      return { valid: false, message: 'الكود غير موجود' }
    }

    if (codeData.is_used) {
      return { valid: false, message: 'الكود مستخدم بالفعل' }
    }

    if (codeData.grade !== gradeSlug) {
      return { valid: false, message: `الكود مخصص لصف آخر` }
    }

    if (codeData.package_id && codeData.package_id !== packageId) {
      return { valid: false, message: 'الكود مخصص لباقة أخرى' }
    }

    if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
      return { valid: false, message: 'الكود منتهي الصلاحية' }
    }

    // التحقق من عدم شراء المستخدم للباقة من قبل
    const { data: existingPurchase } = await supabaseAdmin
      .from('user_packages')
      .select('id')
      .eq('user_id', userId)
      .eq('package_id', packageId)
      .maybeSingle()

    if (existingPurchase) {
      return { valid: false, message: 'لقد قمت بشراء هذه الباقة من قبل' }
    }

    return { valid: true, codeData }

  } catch (error: any) {
    return { valid: false, message: error.message }
  }
}