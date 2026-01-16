export const isSubscriptionValid = (sub: any) => {
  const today = new Date()
  const end = new Date(sub.end_date)

  return sub.is_active && end >= today
}
