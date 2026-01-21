import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // التحقق من تسجيل الدخول
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // إذا كان المستخدم غير مسجل دخول ويحاول الوصول إلى صفحات محمية
  if (!session && 
      (request.nextUrl.pathname.startsWith('/dashboard') || 
       request.nextUrl.pathname.startsWith('/grades') ||
       request.nextUrl.pathname.startsWith('/package'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // إذا كان المستخدم مسجل دخول ويحاول الوصول إلى صفحات التسجيل/الدخول
  if (session && 
      (request.nextUrl.pathname === '/login' || 
       request.nextUrl.pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/grades/:path*',
    '/package/:path*',
    '/login',
    '/register'
  ],
}