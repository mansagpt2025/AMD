// app/middleware.ts - الملف المعدل
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // استثني ملفات static وmanifest من middleware
  const path = request.nextUrl.pathname
  
  // قائمة المسارات المستثناة
  const excludedPaths = [
    '/_next/static',
    '/_next/image', 
    '/favicon.ico',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    '/icon.png',
    '/public',
    '/api'
  ]

  // إذا كان المسار مستثنى، اتركه يمر
  if (excludedPaths.some(p => path.startsWith(p))) {
    return NextResponse.next()
  }

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

  // الحصول على حالة المستخدم
  const { data: { user } } = await supabase.auth.getUser()

  // مسارات عامة مسموح بها للجميع
  const publicPaths = ['/', '/login', '/register', '/contact', '/forgot-password', '/about']
  const isPublicPath = publicPaths.includes(path)

  // مسارات محمية
  const protectedPaths = ['/dashboard', '/grades', '/package', '/profile']
  const isProtectedPath = protectedPaths.some(protectedPath => 
    path.startsWith(protectedPath)
  )

  // إذا كان المستخدم غير مسجل ويحاول الوصول لمسار محمي
  if (!user && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // إذا كان المستخدم مسجل ويحاول الوصول لصفحات الدخول/التسجيل
  if (user && ['/login', '/register', '/forgot-password'].includes(path)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    // تطبيق على كل المسارات ما عدا المستثناة
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png|public|api).*)',
  ],
}