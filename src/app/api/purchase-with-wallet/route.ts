import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const { packageId, userId, price, gradeSlug } = await request.json()

    // التحقق من البيانات
    if (!packageId || !userId || !price || !gradeSlug) {
      return NextResponse.json(
        { message: 'بيانات غير كافية' },
        { status: 400 }
      )
    }

    // التحقق من رصيد المحفظة
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (walletError) {
      console.error('Wallet error:', walletError)
      return NextResponse.json(
        { message: 'المحفظة غير موجودة' },
        { status: 400 }
      )
    }

    if (!wallet || wallet.balance < price) {
      return NextResponse.json(
        { 
          message: `رصيد المحفظة غير كافٍ. الرصيد المطلوب: ${price} جنيه، رصيدك الحالي: ${wallet?.balance || 0} جنيه` 
        },
        { status: 400 }
      )
    }

    // التحقق إذا كانت الباقة مشتراة مسبقاً
    const { data: existingPurchase } = await supabase
      .from('user_packages')
      .select('*')
      .eq('user_id', userId)
      .eq('package_id', packageId)
      .eq('is_active', true)
      .maybeSingle()

    if (existingPurchase) {
      return NextResponse.json(
        { message: 'لقد قمت بشراء هذه الباقة مسبقاً' },
        { status: 400 }
      )
    }

    // الحصول على بيانات الباقة
    const { data: packageData, error: packageError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single()

    if (packageError || !packageData) {
      return NextResponse.json(
        { message: 'الباقة غير موجودة' },
        { status: 404 }
      )
    }

    // التحقق من تطابق الصف
    if (packageData.grade !== gradeSlug) {
      return NextResponse.json(
        { message: 'الباقة غير مخصصة لهذا الصف' },
        { status: 400 }
      )
    }

    // بدء transaction يدوياً (بما أن supabase لا يدعم transactions في REST API)
    // 1. خصم المبلغ من المحفظة أولاً
    const newBalance = wallet.balance - price
    const { error: updateWalletError } = await supabase
      .from('wallets')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateWalletError) {
      console.error('Update wallet error:', updateWalletError)
      return NextResponse.json(
        { message: 'فشل في خصم المبلغ من المحفظة' },
        { status: 500 }
      )
    }

    // 2. إنشاء user_package
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + packageData.duration_days)

    const { data: userPackage, error: userPackageError } = await supabase
      .from('user_packages')
      .insert({
        user_id: userId,
        package_id: packageId,
        purchased_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
        source: 'wallet'
      })
      .select()
      .single()

    if (userPackageError) {
      console.error('User package error:', userPackageError)
      // Rollback: إعادة المبلغ للمحفظة
      await supabase
        .from('wallets')
        .update({
          balance: wallet.balance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
      
      return NextResponse.json(
        { message: 'فشل في إنشاء الباقة' },
        { status: 500 }
      )
    }

    // 3. تسجيل المعاملة (يمكنك إنشاء جدول wallet_transactions إذا أردت)
    // حالياً سنكتفي بالتحديث السابق

    return NextResponse.json({
      success: true,
      message: 'تم الشراء بنجاح',
      userPackage,
      newBalance
    })

  } catch (error: any) {
    console.error('Purchase with wallet error:', error)
    return NextResponse.json(
      { message: error.message || 'حدث خطأ أثناء عملية الشراء' },
      { status: 500 }
    )
  }
}