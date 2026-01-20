import { createSupabaseServer } from '@/lib/supabase/server'

export async function getUserSubscription(userId: string) {
const supabase = await createSupabaseServer()

  const { data } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('user_id', userId)
    .single()

  return data
}

export function isSubscriptionActive(sub: any) {
  if (!sub) return false
  const now = new Date()
  return new Date(sub.ends_at) > now
}
