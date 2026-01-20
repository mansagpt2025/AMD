import { createSupabaseServer } from '@/lib/supabase/server'
import { isSubscriptionActive } from '@/lib/subscription'

export async function requireActiveSubscription(userId: string) {
const supabase = await createSupabaseServer()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!isSubscriptionActive(sub)) {
    throw new Error('NO_ACTIVE_SUBSCRIPTION')
  }
}
