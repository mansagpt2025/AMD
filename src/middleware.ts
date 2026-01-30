import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string): string | undefined {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions): void {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions): void {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
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
  
  const { data: { session } } = await supabase.auth.getSession()
  const pathname: string = req.nextUrl.pathname

  // ───────────────────────────────────────────────
  // 1. حماية صفحات الأدمن (Admin Routes Protection)
  // ───────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!session) {
      // إرجاع 404 بدلاً من إعادة التوجيه
      return NextResponse.rewrite(new URL('/not-found', req.url))
    }
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    if (error || profile?.role !== 'admin') {
      // إرجاع 404 بدلاً من إعادة التوجيه
      return NextResponse.rewrite(new URL('/not-found', req.url))
    }
  }

  // ───────────────────────────────────────────────
  // 2. حماية صفحات الباقات (Package Routes Protection)
  // ───────────────────────────────────────────────
  const packagePattern: RegExp = /\/grades\/[^/]+\/packages\/([^/]+)/
  const match: RegExpMatchArray | null = pathname.match(packagePattern)
  
  if (match) {
    // إذا لم يكن مسجل دخول أو ليس مشتركاً، إرجاع 404
    if (!session) {
      return NextResponse.rewrite(new URL('/not-found', req.url))
    }
    
    const packageId: string = match[1]
    
    const { data: userPackage, error } = await supabase
      .from('user_packages')
      .select('id, expires_at')
      .eq('user_id', session.user.id)
      .eq('package_id', packageId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
    
    if (error || !userPackage) {
      // إرجاع 404 بدلاً من إعادة التوجيه
      return NextResponse.rewrite(new URL('/not-found', req.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/grades/:grade/packages/:packageId/:path*'
  ]
}