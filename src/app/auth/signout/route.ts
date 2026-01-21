// app/auth/signout/route.ts
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // حذف الكوكيز
  const cookieStore = await cookies()
  cookieStore.delete('sb-access-token')
  cookieStore.delete('sb-refresh-token')

  return NextResponse.redirect(new URL('/login', 'http://localhost'))
}
