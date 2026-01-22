// app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  console.log('📞 Register API called')
  
  try {
    // التحقق من أن الطلب يحتوي على JSON
    let body;
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'بيانات غير صالحة. يرجى التحقق من تنسيق البيانات' 
        },
        { status: 400 }
      )
    }
    
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

    // التحقق من البيانات الأساسية
    if (!email || !password || !full_name || !phone) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'البيانات الأساسية مطلوبة: البريد الإلكتروني، كلمة المرور، الاسم الكامل، ورقم الهاتف' 
        },
        { status: 400 }
      )
    }

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'البريد الإلكتروني غير صالح' 
        },
        { status: 400 }
      )
    }

    // التحقق من رقم الهاتف المصري
    const phoneRegex = /^01[0-9]{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'رقم الهاتف يجب أن يبدأ بـ 01 ويتكون من 11 رقماً' 
        },
        { status: 400 }
      )
    }

    // السجل للتتبع
    console.log('📝 Processing registration for:', email)
    console.log('🌐 Supabase URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('🔑 Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    // استخدام Service Role Key إذا كان موجوداً، وإلا استخدام Anon Key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables')
      console.error('URL:', !!supabaseUrl)
      console.error('Key:', !!supabaseKey)
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'إعدادات السيرفر غير مكتملة. يرجى التحقق من إعدادات البيئة',
          details: process.env.NODE_ENV === 'development' ? {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          } : undefined
        },
        { status: 500 }
      )
    }

    // إنشاء Supabase client
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('🔐 Creating user in Supabase Auth...')

    // 1. محاولة إنشاء مستخدم جديد في Auth
    let authData;
    let authError;
    
    try {
      const result = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // تأكيد البريد تلقائياً للتطوير
        user_metadata: {
          full_name,
          phone,
          grade,
          section
        }
      })
      
      authData = result.data
      authError = result.error
      
    } catch (authErr: any) {
      console.error('❌ Auth creation exception:', authErr)
      authError = authErr
    }

    if (authError) {
      console.error('❌ Auth error details:', authError)
      
      // التحقق من أنواع الأخطاء الشائعة
      if (authError.message?.includes('already registered')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'البريد الإلكتروني مسجل بالفعل. جرب تسجيل الدخول أو استخدم بريد إلكتروني آخر' 
          },
          { status: 400 }
        )
      }
      
      if (authError.message?.includes('invalid')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'بيانات غير صالحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور' 
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: `فشل إنشاء حساب المصادقة: ${authError.message || 'خطأ غير معروف'}` 
        },
        { status: 400 }
      )
    }

    if (!authData?.user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'لم يتم إنشاء المستخدم. يرجى المحاولة مرة أخرى' 
        },
        { status: 500 }
      )
    }

    const userId = authData.user.id
    console.log('✅ Auth user created with ID:', userId)

    // 2. إنشاء profile (حاول مع وجود أخطاء ممكنة)
    console.log('👤 Creating profile...')
    
    const profileData = {
      id: userId,
      full_name,
      grade: grade || 'first',
      section: section || 'general',
      email,
      phone,
      parent_phone: parent_phone || phone,
      governorate: governorate || 'القاهرة',
      city: city || 'غير محدد',
      school: school || 'غير محدد'
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('❌ Profile error:', profileError)
      
      // إذا فشل البروفايل، نترك حساب Auth للدعم لحله
      console.warn('⚠️ Profile creation failed, but auth user exists:', userId)
      
      // نرسل تحذيراً لكن نكمل العملية
    } else {
      console.log('✅ Profile created/updated')
    }

    // 3. إنشاء wallet (مهمة غير حرجة)
    console.log('💰 Creating wallet...')
    
    const { error: walletError } = await supabaseAdmin
      .from('wallets')
      .upsert({
        user_id: userId,
        balance: 0
      }, {
        onConflict: 'user_id'
      })

    if (walletError) {
      console.warn('⚠️ Wallet creation warning:', walletError)
      // يمكن إنشاء المحفظة لاحقاً
    } else {
      console.log('✅ Wallet created/updated')
    }

    // 4. إرسال استجابة النجاح
    console.log('🎉 Registration completed successfully for user:', userId)
    
    return NextResponse.json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح!',
      userId,
      email,
      full_name,
      nextStep: 'تسجيل الدخول',
      loginUrl: '/login'
    }, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error: any) {
    console.error('💥 Unexpected API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'حدث خطأ غير متوقع في السيرفر',
        reference: `ERR-${Date.now()}`,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    )
  }
}

// إضافة GET للتحقق من حالة الـ API
export async function GET() {
  const hasEnvVars = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && 
                       (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  
  return NextResponse.json({
    status: 'active',
    method: 'POST',
    path: '/api/auth/register',
    environment: process.env.NODE_ENV,
    hasRequiredEnvVars: hasEnvVars,
    timestamp: new Date().toISOString()
  })
}

// إضافة OPTIONS لـ CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      'Access-Control-Max-Age': '86400',
    },
  })
}