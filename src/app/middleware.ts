// app/middleware.ts

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: any) {
          response.cookies.set(name, '', options)
        },
      },
    }
  )

  // تحديث الجلسة
  await supabase.auth.getSession()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // مسارات عامة
  const publicPaths = [
    '/',
    '/login',
    '/register',
    '/contact',
    '/forgot-password',
  ]

  const isPublicPath = publicPaths.includes(pathname)

  // مسارات محمية
  const protectedPaths = ['/dashboard', '/grades', '/package']
  const isProtectedPath = protectedPaths.some(path =>
    pathname.startsWith(path)
  )

  // لو مش مسجل وداخل مسار محمي
  if (!user && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // لو مسجل وداخل صفحات auth
  if (
    user &&
    ['/login', '/register', '/forgot-password'].includes(pathname)
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * شغل الميدلوير على كل الصفحات
     * واستثني فقط:
     * - ملفات next
     * - الصور
     * - api
     */
    '/((?!_next|favicon.ico|api).*)',
  ],
}
