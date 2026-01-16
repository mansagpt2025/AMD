import { getUserSubscription } from '@/lib/subscription'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const subscription = await getUserSubscription()

  if (!subscription) {
    redirect('/no-subscription')
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
    </main>
  )
}
