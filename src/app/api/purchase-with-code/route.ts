import { createClient } from '@/lib/supabase/nserver-client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { code, packageId, userId, gradeSlug, codeId } = await request.json()

    // 1. تحديث حالة الكود
    await supabase
      .from('codes')
      .update({
        is_used: true,
        used_by: userId,
        used_at: new Date().toISOString()
      })
      .eq('id', codeId)

    // 2. جلب بيانات الباقة
    const { data: packageData } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .single()

    // 3. حساب تاريخ الانتهاء
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + packageData.duration_days)

    // 4. إنشاء اشتراك جديد
    await supabase
      .from('user_packages')
      .insert({
        user_id: userId,
        package_id: packageId,
        purchased_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
        source: 'code'
      })

    // 5. إنشاء إشعار
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'تفعيل ناجح',
        message: `تم تفعيل باقة ${packageData.name} بنجاح باستخدام الكود`,
        type: 'success'
      })

    return NextResponse.json({
      success: true,
      message: 'تم التفعيل بنجاح'
    })

  } catch (error) {
    console.error('Code purchase error:', error)
    return NextResponse.json(
      { message: 'حدث خطأ في عملية التفعيل' },
      { status: 500 }
    )
  }
}