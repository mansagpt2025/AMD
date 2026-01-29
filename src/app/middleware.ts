// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// إنشاء Supabase client للميدلوير
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
})

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // الحصول على الجلسة من cookies
  const session = request.cookies.get('sb-auth-token')?.value
  
  // إذا كان المستخدم يحاول الوصول إلى صفحات محمية وليس لديه جلسة
  if (request.nextUrl.pathname.startsWith('/grades')) {
    if (!session) {
      // التحقق من وجود جلسة صالحة في Supabase
      try {
        const { data: { session: supabaseSession } } = await supabase.auth.getSession()
        
        if (!supabaseSession) {
          console.log('No session found, redirecting to login')
          const redirectUrl = new URL('/login', request.url)
          redirectUrl.searchParams.set('returnUrl', request.nextUrl.pathname)
          return NextResponse.redirect(redirectUrl)
        }
        
        // إذا كانت هناك جلسة صالحة، تحديث cookie
        response.cookies.set('sb-auth-token', JSON.stringify(supabaseSession), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // أسبوع واحد
          path: '/',
        })
      } catch (error) {
        console.error('Middleware auth error:', error)
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('returnUrl', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }
  }
  
  return response
}

export const config = {
  matcher: [
    '/grades/:path*',
    '/api/protected/:path*',
  ],
}