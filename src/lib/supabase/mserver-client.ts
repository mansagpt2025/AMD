import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type SupabaseClient } from '@supabase/supabase-js'

export async function createServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()

  const supabase: SupabaseClient = createSupabaseServerClient(
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
            // في حالة استدعاء من Server Component
          }
        },
        remove(name: string, options: CookieOptions): void {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // في حالة استدعاء من Server Component
          }
        },
      },
    }
  )

  return supabase
}