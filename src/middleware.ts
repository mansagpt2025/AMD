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
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set({
              name,
              value,
              ...options,
            })
          })
        },
      },
    }
  )

  // الحصول على جلسة المستخدم
  const { data: { session } } = await supabase.auth.getSession()

  // الصفحات التي تتطلب تسجيل الدخول
  const protectedPaths = ['/dashboard', '/profile', '/wallet', '/packages', '/lectures']
  
  // الصفحات التي تتطلب أن يكون المستخدم غير مسجل دخول
  const authPaths = ['/login', '/register']
  
  const currentPath = request.nextUrl.pathname
  const isProtectedPath = protectedPaths.some(path => currentPath.startsWith(path))
  const isAuthPath = authPaths.includes(currentPath)

  if (isProtectedPath && !session) {
    // إعادة التوجيه إلى صفحة تسجيل الدخول إذا لم يكن مسجل دخول
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectedFrom', currentPath)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthPath && session) {
    // إعادة التوجيه إلى الداشبورد إذا كان مسجل دخول وحاول الوصول لصفحات التسجيل
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}