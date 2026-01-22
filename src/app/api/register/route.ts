import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const {
      email,
      password,
      full_name,
      phone,
      parent_phone,
      governorate,
      city,
      school,
      grade,
      section
    } = body

    // التحقق من البيانات المطلوبة
    if (!email || !password || !full_name) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'البريد الإلكتروني وكلمة المرور والاسم الكامل مطلوبة' 
        },
        { status: 400 }
      )
    }

    // إنشاء Supabase client بمفتاح الخدمة
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. إنشاء مستخدم جديد في Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // تأكيد البريد تلقائياً (للتطوير)
      user_metadata: {
        full_name,
        phone,
        grade,
        section
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { 
          success: false, 
          error: authError.message || 'فشل إنشاء حساب المصادقة' 
        },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // 2. إنشاء profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        full_name,
        grade,
        section,
        email,
        phone,
        parent_phone,
        governorate,
        city,
        school
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      
      // حذف مستخدم Auth إذا فشل إنشاء البروفايل
      await supabaseAdmin.auth.admin.deleteUser(userId)
      
      return NextResponse.json(
        { 
          success: false, 
          error: profileError.message || 'فشل إنشاء الملف الشخصي' 
        },
        { status: 500 }
      )
    }

    // 3. إنشاء wallet
    const { error: walletError } = await supabaseAdmin
      .from('wallets')
      .insert({
        user_id: userId,
        balance: 0
      })

    if (walletError) {
      console.warn('Wallet error (non-critical):', walletError)
      // لا نحذف المستخدم إذا فشلت المحفظة، يمكن إنشاؤها لاحقاً
    }

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      userId
    }, { status: 201 })

  } catch (error: any) {
    console.error('API Registration error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'حدث خطأ غير متوقع في التسجيل' 
      },
      { status: 500 }
    )
  }
}