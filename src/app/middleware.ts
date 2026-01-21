// app/middleware.ts
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

  // مسارات عامة مسموح بها للجميع
  const publicPaths = ['/', '/login', '/register', '/forgot-password']
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path
  )

  // مسارات محمية
  const protectedPaths = ['/dashboard', '/grades', '/package']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // الحصول على حالة الجلسة
  const { data: { session } } = await supabase.auth.getSession()

  // إذا كان المستخدم غير مسجل ويحاول الوصول لمسار محمي
  if (!session && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // إذا كان المستخدم مسجل ويحاول الوصول لصفحات الدخول/التسجيل
  if (session && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register' || request.nextUrl.pathname === '/forgot-password')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}