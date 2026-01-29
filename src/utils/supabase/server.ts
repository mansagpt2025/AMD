import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ⚠️ مهم: خليها async
export async function createClient() {
  const cookieStore = await cookies() // ← حط await هنا

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // فارغة عمداً - التعديل في Middleware بس
        },
        remove(name: string, options: any) {
          // فارغة عمداً - التعديل في Middleware بس
        },
      },
    }
  )
}