'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const adminClient = createClient(supabaseUrl, supabaseServiceKey)

export async function getWalletBalance(userId: string) {
  try {
    const { data, error } = await adminClient
      .from('wallets')
      .select('balance, id')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function deductWalletBalance(userId: string, amount: number, packageId: string) {
  try {
    // التحقق من عدم وجود اشتراك مسبق
    const { data: existing, error: existingError } = await adminClient
      .from('user_packages')
      .select('id')
      .eq('user_id', userId)
      .eq('package_id', packageId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (existing) throw new Error('لديك اشتراك فعال بهذه الباقة بالفعل')

    // جلب المحفظة
    const { data: wallet, error: fetchError } = await adminClient
      .from('wallets')
      .select('id, balance')
      .eq('user_id', userId)
      .single()

    if (fetchError || !wallet) throw new Error('المحفظة غير موجودة')
    if (wallet.balance < amount) throw new Error(`رصيد غير كافٍ. رصيدك: ${wallet.balance} جنيه`)

    const newBalance = wallet.balance - amount

    // خصم الرصيد
    const { error: updateError } = await adminClient
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', wallet.id)

    if (updateError) throw new Error('فشل خصم المبلغ')

    // تسجيل العملية
    await adminClient.from('wallet_transactions').insert({
      user_id: userId,
      amount: -amount,
      type: 'purchase',
      description: `شراء باقة`,
      previous_balance: wallet.balance,
      new_balance: newBalance
    })

    return { success: true, newBalance }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function validateCode(code: string, grade: string, packageId: string) {
  try {
    const cleanCode = code.trim().toUpperCase()
    
    const { data: codeData, error } = await adminClient
      .from('codes')
      .select('*')
      .eq('code', cleanCode)
      .single()

    if (error || !codeData) throw new Error('الكود غير موجود')
    if (codeData.is_used) throw new Error('الكود مستخدم بالفعل')
    if (codeData.grade !== grade) throw new Error('الكود ليس لهذا الصف')
    if (codeData.package_id && codeData.package_id !== packageId) throw new Error('الكود لباقة أخرى')
    if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) throw new Error('الكود منتهي الصلاحية')

    return { success: true, data: codeData }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function markCodeAsUsed(codeId: string, userId: string) {
  try {
    const { error } = await adminClient
      .from('codes')
      .update({ 
        is_used: true, 
        used_by: userId, 
        used_at: new Date().toISOString() 
      })
      .eq('id', codeId)
      .eq('is_used', false)

    if (error) throw new Error('فشل في استخدام الكود')
    return { success: true }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function createUserPackage(
  userId: string, 
  packageId: string, 
  durationDays: number, 
  source: 'wallet' | 'code'
) {
  try {
    // التحقق مرة أخرى من عدم وجود اشتراك (للأمان)
    const { data: existing } = await adminClient
      .from('user_packages')
      .select('id')
      .eq('user_id', userId)
      .eq('package_id', packageId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (existing) throw new Error('لديك اشتراك فعال بهذه الباقة')

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (durationDays || 30))

    const { data, error } = await adminClient
      .from('user_packages')
      .insert({ 
        user_id: userId, 
        package_id: packageId, 
        expires_at: expiresAt.toISOString(), 
        is_active: true, 
        source 
      })
      .select()

    if (error) throw new Error('فشل في انشاء الاشتراك')
    
    return { success: true, data }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}