import { supabase } from '@/lib/supabase/client'
import { isSubscriptionValid } from './utils'

export const getUserSubscription = async () => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('end_date', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  if (!isSubscriptionValid(data)) return null

  return data
}
