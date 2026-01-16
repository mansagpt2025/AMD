import { createSupabaseServerClient } from '@/lib/supabase/server'

export const getActiveSubscription = async () => {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('end_date', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null

  const today = new Date()
  const endDate = new Date(data.end_date)

  if (endDate < today) return null

  return data
}
