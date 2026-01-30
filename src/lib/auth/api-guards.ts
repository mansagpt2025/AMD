import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type SupabaseClient } from '@supabase/supabase-js'

// إنشاء عميل Supabase للـ API Routes مع دعم Next.js 15 (async cookies)
async function createAuthClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string): string | undefined {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions): void {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // يمكن أن يحدث في Server Components
          }
        },
        remove(name: string, options: CookieOptions): void {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // يمكن أن يحدث في Server Components
          }
        },
      },
    }
  )
}

interface AdminCheckResult {
  error: string | null
  status: number
  user: any | null
  supabase: SupabaseClient | null
}

interface PackageAccessResult {
  hasAccess: boolean
  error: string | null
  status: number
  userPackage?: any
}

/**
 * التحقق من صلاحيات الأدمن في API Routes
 */
export async function requireAdmin(): Promise<AdminCheckResult> {
  const supabase = await createAuthClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return { 
      error: 'Unauthorized', 
      status: 401, 
      user: null,
      supabase: null 
    }
  }
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()
    
  if (error || profile?.role !== 'admin') {
    return { 
      error: 'Forbidden - Admin access required', 
      status: 403, 
      user: null,
      supabase: null 
    }
  }
  
  return { 
    error: null, 
    status: 200, 
    user: session.user, 
    supabase 
  }
}

/**
 * التحقق من الاشتراك في باقة معينة
 */
export async function requirePackageAccess(packageId: string): Promise<PackageAccessResult> {
  const supabase = await createAuthClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return { 
      hasAccess: false,
      error: 'Unauthorized', 
      status: 401
    }
  }
  
  const { data: userPackage, error } = await supabase
    .from('user_packages')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('package_id', packageId)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
    
  if (error || !userPackage) {
    return { 
      hasAccess: false,
      error: 'No active subscription', 
      status: 403
    }
  }
  
  return { 
    hasAccess: true,
    error: null, 
    status: 200,
    userPackage
  }
}