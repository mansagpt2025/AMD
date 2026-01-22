// app/middleware.ts - الملف المعدل
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // لم تعد بحاجة لمعالجة الكوكيز هنا
          // ستتعامل معها supabase تلقائياً
          response.cookies.set({
            name,
            value,
            ...options,
            path: '/',
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            path: '/',
          })
        },
      },
    }
  )

  // تحديث الجلسة
  await supabase.auth.getSession()

  // الحصول على حالة المستخدم (بدلاً من الجلسة)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // مسارات عامة مسموح بها للجميع
  const publicPaths = ['/', '/login', '/register', '/contact', '/forgot-password']
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path
  )

  // مسارات محمية
  const protectedPaths = ['/dashboard', '/grades', '/package']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // إذا كان المستخدم غير مسجل ويحاول الوصول لمسار محمي
  if (!user && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // إذا كان المستخدم مسجل ويحاول الوصول لصفحات الدخول/التسجيل
  if (user && ['/login', '/register', '/forgot-password'].includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    // استثني ملفات الستاتيك وAPI routes
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}