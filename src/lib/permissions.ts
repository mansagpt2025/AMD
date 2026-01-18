import { getUserSubscription, isSubscriptionActive } from './subscription'

export async function requireActiveSubscription(userId: string) {
  const sub = await getUserSubscription(userId)
  if (!isSubscriptionActive(sub)) {
    throw new Error('NO_SUBSCRIPTION')
  }
}
