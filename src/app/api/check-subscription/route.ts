import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isSubscriptionActive } from '@/lib/subscription'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    return NextResponse.json({ active: false })
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', data.user.id)
    .single()

  return NextResponse.json({
    active: isSubscriptionActive(sub),
    ends_at: sub?.ends_at ?? null,
  })
}
