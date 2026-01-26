import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { code, packageId, userId, gradeSlug } = await request.json()

    // التحقق من وجود الكود في package_codes
    const { data: codeData, error: codeError } = await supabase
      .from('package_codes')
      .select(`
        *,
        packages (*)
      `)
      .eq('code', code.trim())
      .eq('is_used', false)
      .maybeSingle()

    if (codeError || !codeData) {
      return NextResponse.json(
        { message: 'الكود غير صالح أو غير موجود' },
        { status: 400 }
      )
    }

    // التحقق من صلاحية الكود
    if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
      return NextResponse.json(
        { message: 'هذا الكود منتهي الصلاحية' },
        { status: 400 }
      )
    }

    // التحقق إذا كان الكود مخصص للباقة الصحيحة
    if (codeData.package_id !== packageId) {
      return NextResponse.json(
        { message: 'هذا الكود غير مخصص لهذه الباقة' },
        { status: 400 }
      )
    }

    // التحقق إذا كان الكود مخصص للصف الصحيح
    if (codeData.grade !== gradeSlug) {
      return NextResponse.json(
        { message: 'هذا الكود غير مخصص لهذا الصف' },
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

    // التحقق من أن الباقة تنتمي للصف المطلوب
    if (codeData.packages?.grade !== gradeSlug) {
      return NextResponse.json(
        { message: 'هذا الكود غير مخصص لهذا الصف' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'الكود صالح للاستخدام',
      code: codeData
    })

  } catch (error: any) {
    console.error('Code validation error:', error)
    return NextResponse.json(
      { message: error.message || 'حدث خطأ أثناء التحقق من الكود' },
      { status: 500 }
    )
  }
}