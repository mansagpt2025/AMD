// app/api/validate-code/route.ts
import { createClient } from '@/lib/supabase/sf-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { code, packageId, userId } = await request.json()
    const supabase = await createClient()

    // التحقق من الكود
    const { data: codeData, error: codeError } = await supabase
      .from('codes')
      .select('*')
      .eq('code', code)
      .single()

    if (codeError || !codeData) {
      return NextResponse.json({ 
        valid: false, 
        message: 'الكود غير صالح' 
      })
    }

    // التحقق إذا كان الكود مستخدم
    if (codeData.is_used) {
      return NextResponse.json({ 
        valid: false, 
        message: 'هذا الكود تم استخدامه مسبقاً' 
      })
    }

    // التحقق من مطابقة الباقة
    if (codeData.package_id !== packageId) {
      return NextResponse.json({ 
        valid: false, 
        message: 'هذا الكود ليس لهذه الباقة' 
      })
    }

    // التحقق إذا كان المستخدم اشترى الباقة مسبقاً
    const { data: existingPurchase } = await supabase
      .from('user_packages')
      .select('*')
      .eq('user_id', userId)
      .eq('package_id', packageId)
      .eq('is_active', true)

    if (existingPurchase && existingPurchase.length > 0) {
      return NextResponse.json({ 
        valid: false, 
        message: 'لقد قمت بشراء هذه الباقة مسبقاً' 
      })
    }

    return NextResponse.json({ 
      valid: true,
      code: codeData
    })

  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json({ 
      valid: false, 
      message: 'حدث خطأ في التحقق' 
    }, { status: 500 })
  }
}