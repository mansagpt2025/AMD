'use server'

import { adminClient } from '@/lib/supabase-admin'

export async function deductWalletBalance(userId: string, amount: number, packageId: string) {
  try {
    const { data: wallet, error: fetchError } = await adminClient
      .from('wallets')
      .select('id, balance')
      .eq('user_id', userId)
      .single() as { data: { id: string; balance: number } | null, error: any }

    if (fetchError || !wallet) throw new Error('المحفظة غير موجودة')
    if (wallet.balance < amount) throw new Error(`رصيد غير كافٍ. رصيدك: ${wallet.balance} جنيه`)

    const newBalance = wallet.balance - amount

    const { error: updateError } = await adminClient
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', wallet.id)

    if (updateError) throw new Error('فشل خصم المبلغ')

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

export async function markCodeAsUsed(codeId: string, userId: string) {
  try {
    const { error } = await adminClient
      .from('codes')
      .update({ is_used: true, used_by: userId, used_at: new Date().toISOString() })
      .eq('id', codeId)
      .eq('is_used', false)

    if (error) throw new Error('فشل في استخدام الكود')
    return { success: true }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export async function createUserPackage(userId: string, packageId: string, durationDays: number, source: 'wallet' | 'code') {
  try {
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
      .insert({ user_id: userId, package_id: packageId, expires_at: expiresAt.toISOString(), is_active: true, source })
      .select()

    if (error) throw new Error('فشل في انشاء الاشتراك')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}