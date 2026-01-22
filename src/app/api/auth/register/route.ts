// app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// تعطيل الـ Static Generation لهذا المسار
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  console.log('🚀 API Route called')
  
  try {
    // التحقق من الـ Content-Type
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'يجب أن يكون Content-Type: application/json' 
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log('📦 Request body received')
    
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

    // التحقق من المتغيرات البيئية
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('❌ NEXT_PUBLIC_SUPABASE_URL is missing')
      return NextResponse.json(
        { success: false, error: 'إعدادات السيرفر غير مكتملة' },
        { status: 500 }
      )
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing')
      return NextResponse.json(
        { success: false, error: 'إعدادات السيرفر غير مكتملة' },
        { status: 500 }
      )
    }

    // التحقق من البيانات المطلوبة
    if (!email || !password || !full_name || !phone) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'البريد الإلكتروني وكلمة المرور والاسم الكامل ورقم الهاتف مطلوبة' 
        },
        { status: 400 }
      )
    }

    // إنشاء Supabase client بمفتاح الخدمة
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🔐 Creating auth user...')
    
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
      console.error('❌ Auth error:', authError)
      return NextResponse.json(
        { 
          success: false, 
          error: authError.message.includes('already registered') 
            ? 'البريد الإلكتروني مسجل بالفعل' 
            : 'فشل إنشاء حساب المصادقة: ' + authError.message 
        },
        { status: 400 }
      )
    }

    console.log('✅ Auth user created:', authData.user.id)

    const userId = authData.user.id

    // 2. إنشاء profile
    console.log('👤 Creating profile...')
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        full_name,
        grade: grade || 'first', // قيمة افتراضية
        section: section || 'general',
        email,
        phone,
        parent_phone: parent_phone || phone, // إذا لم يتم تقديمه
        governorate: governorate || 'القاهرة',
        city: city || 'غير محدد',
        school: school || 'غير محدد'
      })

    if (profileError) {
      console.error('❌ Profile error:', profileError)
      
      // حذف مستخدم Auth إذا فشل إنشاء البروفايل
      await supabaseAdmin.auth.admin.deleteUser(userId)
      
      return NextResponse.json(
        { 
          success: false, 
          error: profileError.message.includes('duplicate key')
            ? 'البريد الإلكتروني أو رقم الهاتف مسجل بالفعل'
            : 'فشل إنشاء الملف الشخصي: ' + profileError.message 
        },
        { status: 500 }
      )
    }

    console.log('✅ Profile created')

    // 3. إنشاء wallet
    console.log('💰 Creating wallet...')
    const { error: walletError } = await supabaseAdmin
      .from('wallets')
      .insert({
        user_id: userId,
        balance: 0
      })

    if (walletError) {
      console.warn('⚠️ Wallet error (non-critical):', walletError)
      // لا نحذف المستخدم إذا فشلت المحفظة
    } else {
      console.log('✅ Wallet created')
    }

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      userId,
      email,
      full_name
    }, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    })

  } catch (error: any) {
    console.error('❌ API Registration error:', error)
    
    // تحديد نوع الخطأ
    let errorMessage = 'حدث خطأ غير متوقع في التسجيل'
    let statusCode = 500
    
    if (error.name === 'SyntaxError') {
      errorMessage = 'بيانات الطلب غير صالحة'
      statusCode = 400
    } else if (error.message.includes('fetch')) {
      errorMessage = 'تعذر الاتصال بالخادم'
      statusCode = 503
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { 
        status: statusCode,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

// إضافة GET method للتحقق من أن الـ route يعمل
export async function GET() {
  return NextResponse.json(
    { 
      message: 'API route for user registration',
      methods: ['POST'],
      status: 'active'
    },
    { status: 200 }
  )
}