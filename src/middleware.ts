import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // إنشاء response
  const response = NextResponse.next()
  
  // الصفحات التي تتطلب تسجيل الدخول
  const protectedPaths = ['/dashboard', '/profile', '/wallet']
  
  // الصفحات التي تتطلب أن يكون المستخدم غير مسجل دخول
  const authPaths = ['/login', '/register']
  
  const currentPath = request.nextUrl.pathname
  
  try {
    // استيراد ديناميكي لتجنب مشاكل الـ SSR
    const { createClient } = await import('./lib/supabase/middleware-client')
    const { supabase } = createClient(request)
    
    // الحصول على جلسة المستخدم
    const { data: { session } } = await supabase.auth.getSession()
    
    const isProtectedPath = protectedPaths.some(path => currentPath.startsWith(path))
    const isAuthPath = authPaths.includes(currentPath)
    
    if (isProtectedPath && !session) {
      // إعادة التوجيه إلى صفحة تسجيل الدخول
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectedFrom', currentPath)
      return NextResponse.redirect(redirectUrl)
    }
    
    if (isAuthPath && session) {
      // إعادة التوجيه إلى الداشبورد
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
  } catch (error) {
    console.error('Middleware error:', error)
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