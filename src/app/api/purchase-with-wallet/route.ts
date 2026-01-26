import { createClient } from '@/lib/supabase/nserver-client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { packageId, userId, price, gradeSlug } = await request.json()

    // 1. التحقق من رصيد المحفظة
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (!wallet || wallet.balance < price) {
      return NextResponse.json(
        { message: 'رصيد المحفظة غير كافٍ' },
        { status: 400 }
      )
    }

    // 2. خصم المبلغ من المحفظة
    const newBalance = wallet.balance - price
    await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', userId)

    // 3. جلب بيانات الباقة
    const { data: packageData } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single()

    // 4. حساب تاريخ الانتهاء
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + packageData.duration_days)

    // 5. إنشاء اشتراك جديد
    await supabase
      .from('user_packages')
      .insert({
        user_id: userId,
        package_id: packageId,
        purchased_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
        source: 'wallet'
      })

    // 6. إنشاء إشعار
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'شراء ناجح',
        message: `تم شراء باقة ${packageData.name} بنجاح`,
        type: 'success'
      })

    return NextResponse.json({
      success: true,
      message: 'تم الشراء بنجاح',
      newBalance
    })

  } catch (error) {
    console.error('Purchase error:', error)
    return NextResponse.json(
      { message: 'حدث خطأ في عملية الشراء' },
      { status: 500 }
    )
  }
}