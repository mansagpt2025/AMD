import { createClient } from '@/lib/supabase/supabase-server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ✅ الطريقة الصحيحة في Next 15/16
  const cookieStore = await cookies()

  try {
    cookieStore.set('sb-access-token', '', { maxAge: 0, path: '/' })
    cookieStore.set('sb-refresh-token', '', { maxAge: 0, path: '/' })
  } catch (err) {
    console.error('Cookie delete error:', err)
  }

  // ✅ استخدم الدومين الحقيقي
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'https://mahmoud-eldeeb.com'))
}
