// app/api/redeem-code/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/supabase-server'

export async function POST(req: Request) {
  try {
    const { code } = await req.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'كود غير صالح' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    // Profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, grade')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.grade) {
      return NextResponse.json(
        { error: 'الملف الشخصي غير مكتمل' },
        { status: 400 }
      )
    }

    // Get code
    const { data: codeRow, error: codeError } = await supabase
      .from('package_codes')
      .select('*')
      .eq('code', code)
      .single()

    if (codeError || !codeRow) {
      return NextResponse.json(
        { error: 'الكود غير صحيح' },
        { status: 404 }
      )
    }

    // Checks
    if (codeRow.is_used) {
      return NextResponse.json(
        { error: 'هذا الكود تم استخدامه من قبل' },
        { status: 400 }
      )
    }

    if (codeRow.grade !== profile.grade) {
      return NextResponse.json(
        { error: 'هذا الكود غير مخصص لصفك الدراسي' },
        { status: 400 }
      )
    }

    // Check if user already owns package
    const { data: existingPackage } = await supabase
      .from('user_packages')
      .select('id')
      .eq('user_id', user.id)
      .eq('package_id', codeRow.package_id)
      .single()

    if (existingPackage) {
      return NextResponse.json(
        { error: 'أنت مشترك في هذه الباقة بالفعل' },
        { status: 400 }
      )
    }

    // Mark code as used
    const { error: updateCodeError } = await supabase
      .from('package_codes')
      .update({
        is_used: true,
        used_by: user.id,
        used_at: new Date().toISOString(),
      })
      .eq('id', codeRow.id)

    if (updateCodeError) {
      console.error('UPDATE CODE ERROR:', updateCodeError)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء استخدام الكود' },
        { status: 500 }
      )
    }

    // Grant package to user
    const { error: insertUserPackageError } = await supabase
      .from('user_packages')
      .insert({
        user_id: user.id,
        package_id: codeRow.package_id,
        is_active: true,
        source: 'code',
      })

    if (insertUserPackageError) {
      console.error('INSERT USER_PACKAGE ERROR:', insertUserPackageError)

      // ⚠️ Rollback: حاول ترجع الكود unused
      await supabase
        .from('package_codes')
        .update({
          is_used: false,
          used_by: null,
          used_at: null,
        })
        .eq('id', codeRow.id)

      return NextResponse.json(
        { error: 'فشل تفعيل الباقة، حاول مرة أخرى' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تم تفعيل الباقة بنجاح 🎉',
      package_id: codeRow.package_id,
    })

  } catch (error) {
    console.error('REDEEM CODE API ERROR:', error)
    return NextResponse.json(
      { error: 'خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
