import { createSupabaseServer } from '@/lib/supabase/server'

export async function requireSubscription() {
const supabase = await createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .gte('end_date', new Date().toISOString())
    .single()

  return data
}
