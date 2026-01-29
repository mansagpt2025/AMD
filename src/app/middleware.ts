// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // فقط للصفحات المحمية (grades)
  if (request.nextUrl.pathname.startsWith('/grades')) {
    // التحقق من وجود جلسة في cookies
    const sessionToken = request.cookies.get('sb-auth-token')?.value
    
    if (!sessionToken) {
      // توجيه إلى صفحة تسجيل الدخول
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('returnUrl', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/grades/:path*'],
}