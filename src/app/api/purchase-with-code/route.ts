import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const { code, packageId, userId, gradeSlug, codeId } = await request.json()

    // التحقق من صحة البيانات
    if (!code || !packageId || !userId || !gradeSlug || !codeId) {
      return NextResponse.json(
        { message: 'بيانات غير كافية' },
        { status: 400 }
      )
    }

    // التحقق من الكود مرة أخرى
    const { data: codeData, error: codeError } = await supabase
      .from('package_codes')
      .select(`
        *,
        packages (*)
      `)
      .eq('id', codeId)
      .eq('code', code.trim())
      .eq('is_used', false)
      .maybeSingle()

    if (codeError || !codeData) {
      return NextResponse.json(
        { message: 'الكود غير صالح أو تم استخدامه' },
        { status: 400 }
      )
    }

    // التحقق من الصلاحية
    if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
      return NextResponse.json(
        { message: 'الكود منتهي الصلاحية' },
        { status: 400 }
      )
    }

    // التحقق من تطابق الباقة
    if (codeData.package_id !== packageId) {
      return NextResponse.json(
        { message: 'الكود غير مخصص لهذه الباقة' },
        { status: 400 }
      )
    }

    // التحقق من تطابق الصف
    if (codeData.grade !== gradeSlug) {
      return NextResponse.json(
        { message: 'الكود غير مخصص لهذا الصف' },
        { status: 400 }
      )
    }

    // التحقق من تطابق صف الباقة
    if (codeData.packages?.grade !== gradeSlug) {
      return NextResponse.json(
        { message: 'الباقة غير مخصصة لهذا الصف' },
        { status: 400 }
      )
    }

    // التحقق إذا كان المستخدم قد اشترى الباقة مسبقاً
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
    const { data: packageData } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single()

    if (!packageData) {
      return NextResponse.json(
        { message: 'الباقة غير موجودة' },
        { status: 404 }
      )
    }

    // 1. تحديث حالة الكود أولاً (جعلها مستخدمة)
    const { error: updateCodeError } = await supabase
      .from('package_codes')
      .update({
        is_used: true,
        used_by: userId,
        used_at: new Date().toISOString()
      })
      .eq('id', codeId)

    if (updateCodeError) {
      console.error('Update code error:', updateCodeError)
      return NextResponse.json(
        { message: 'فشل في تحديث حالة الكود' },
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
        source: 'code'
      })
      .select()
      .single()

    if (userPackageError) {
      console.error('User package error:', userPackageError)
      // Rollback: إعادة حالة الكود
      await supabase
        .from('package_codes')
        .update({
          is_used: false,
          used_by: null,
          used_at: null
        })
        .eq('id', codeId)
      
      return NextResponse.json(
        { message: 'فشل في إنشاء الباقة' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تم تفعيل الكود بنجاح',
      userPackage
    })

  } catch (error: any) {
    console.error('Purchase with code error:', error)
    return NextResponse.json(
      { message: error.message || 'حدث خطأ أثناء تفعيل الكود' },
      { status: 500 }
    )
  }
}