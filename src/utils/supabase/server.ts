import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  // في الإصدارات الحديثة من Next.js cookies() بقت async
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },

        // ⚠️ مهم:
        // في Server Components ماينفعش نعدل على الكوكيز
        // التعديل الحقيقي لازم يتم في Middleware
        set(name: string, value: string, options: any) {
          // intentionally empty
        },

        remove(name: string, options: any) {
          // intentionally empty
        },
      },
    }
  )
}
