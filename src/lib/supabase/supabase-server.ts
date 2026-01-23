import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },

        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
              path: '/', // ✅ مهم جداً
            })
          } catch (error) {
            // Server Component — ignore
            console.warn('Cookie set ignored:', name)
          }
        },

        remove(name: string, options: any) {
          try {
            cookieStore.set({
              name,
              value: '',
              ...options,
              path: '/', // ✅ مهم جداً
              maxAge: 0, // ✅ الحذف الصحيح
            })
          } catch (error) {
            // Server Component — ignore
            console.warn('Cookie remove ignored:', name)
          }
        },
      },
    }
  )
}
