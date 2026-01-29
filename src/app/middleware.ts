import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // التحقق من وجود متغيرات البيئة
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Middleware: Missing Supabase environment variables');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Middleware session error:', sessionError.message);
    }

    // حماية جميع routes تحت /admin
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (!session) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // التحقق من صلاحية الأدمن
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Middleware profile fetch error:', profileError.message);
        // في حالة خطأ في جلب البيانات، نعتبره غير مصرح له للأمان
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      if (profile?.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    return response;
  } catch (error: any) {
    console.error('Middleware critical error:', error?.message || error);
    
    // في حالة حدوث خطأ عام في middleware، نحول للـ login إذا كان في /admin
    if (request.nextUrl.pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // للـ routes الأخرى، نسمح بالمرور لمنع تعطل الموقع بالكامل
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};