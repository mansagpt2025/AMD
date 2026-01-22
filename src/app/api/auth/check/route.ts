import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // ✅ لازم await
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json(
        {
          isAuthenticated: false,
          error: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      isAuthenticated: !!session,
      user: session?.user ?? null,
      session,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        isAuthenticated: false,
        error: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
