'use server'

import { adminClient } from '@/lib/supabase-admin'

export async function deductWalletBalance(userId: string, amount: number, packageId: string, source: 'wallet' | 'code') {
  try {
    console.log('Deducting wallet balance:', { userId, amount, packageId, source })

    const { data: wallet, error: fetchError } = await adminClient
      .from('wallets')
      .select('id, balance')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError) {
      throw new Error(`فشل جلب البيانات: ${fetchError.message}`)
    }

    if (!wallet) {
      throw new Error('لم يتم العثور على محفظة المستخدم')
    }

    const currentBalance = wallet.balance || 0
    
    if (currentBalance < amount) {
      throw new Error(`رصيد المحفظة غير كافٍ. المطلوب: ${amount} جنيه، رصيدك: ${currentBalance} جنيه`)
    }

    const newBalance = currentBalance - amount

    const { error: updateError } = await adminClient
      .from('wallets')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)

    if (updateError) {
      console.error('Error deducting from wallet:', updateError)
      throw new Error(`فشل خصم المبلغ: ${updateError.message}`)
    }

    const { error: transactionError } = await adminClient
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        amount: amount,
        type: 'purchase',
        description: `شراء باقة عن طريق ${source === 'wallet' ? 'المحفظة' : 'الكود'}`,
        previous_balance: currentBalance,
        new_balance: newBalance
      })

    if (transactionError) {
      console.error('Error recording transaction:', transactionError)
    }

    console.log('Wallet deduction successful:', { newBalance })

    return {
      success: true,
      newBalance: newBalance,
      message: 'تم خصم المبلغ بنجاح'
    }
  } catch (error) {
    console.error('Error in deductWalletBalance:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'حدث خطأ أثناء خصم المبلغ'
    }
  }
}

export async function markCodeAsUsed(codeId: string, userId: string) {
  try {
    console.log('Marking code as used:', { codeId, userId })

    const { error } = await adminClient
      .from('codes')
      .update({
        is_used: true,
        used_by: userId,
        used_at: new Date().toISOString()
      })
      .eq('id', codeId)
      .eq('is_used', false)

    if (error) {
      console.error('Error marking code as used:', error)
      throw new Error(`فشل في استخدام الكود: ${error.message}`)
    }

    console.log('Code marked as used successfully')

    return {
      success: true,
      message: 'تم استخدام الكود بنجاح'
    }
  } catch (error) {
    console.error('Error in markCodeAsUsed:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'حدث خطأ أثناء استخدام الكود'
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
    console.log('Creating user package:', { userId, packageId, durationDays, source })

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + durationDays)

    const { data, error } = await adminClient
      .from('user_packages')
      .insert({
        user_id: userId,
        package_id: packageId,
        purchased_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
        source: source
      })
      .select('*')

    if (error) {
      console.error('Error creating user package:', error)
      throw new Error(`فشل في إضافة الباقة: ${error.message}`)
    }

    console.log('User package created successfully:', data)

    return {
      success: true,
      data: data,
      message: 'تم إضافة الباقة بنجاح'
    }
  } catch (error) {
    console.error('Error in createUserPackage:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة الباقة'
    }
  }
}
