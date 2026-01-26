import { createClient } from '@/lib/supabase/nserver-client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { code, packageId, userId, gradeSlug } = await request.json()

    // 1. البحث عن الكود
    const { data: codeData, error: codeError } = await supabase
      .from('codes')
      .select('*')
      .eq('code', code)
      .eq('grade', gradeSlug)
      .eq('package_id', packageId)
      .single()

    if (codeError || !codeData) {
      return NextResponse.json(
        { message: 'الكود غير صالح أو غير موجود' },
        { status: 404 }
      )
    }

    // 2. التحقق من استخدام الكود
    if (codeData.is_used) {
      return NextResponse.json(
        { message: 'هذا الكود تم استخدامه مسبقاً' },
        { status: 400 }
      )
    }

    // 3. التحقق من صلاحية الكود
    const now = new Date()
    const expiresAt = new Date(codeData.expires_at)
    if (now > expiresAt) {
      return NextResponse.json(
        { message: 'هذا الكود منتهي الصلاحية' },
        { status: 400 }
      )
    }

    // 4. التحقق من أن المستخدم لم يشترِ الباقة مسبقاً
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

    return NextResponse.json({
      success: true,
      message: 'الكود صالح',
      code: codeData
    })

  } catch (error) {
    console.error('Code validation error:', error)
    return NextResponse.json(
      { message: 'حدث خطأ في التحقق من الكود' },
      { status: 500 }
    )
  }
}