import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getActiveSubscription } from '@/lib/subscription/server'
import LogoutButton from '@/components/layout/LogoutButton'

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const subscription = await getActiveSubscription()

  if (!subscription) {
    redirect('/no-subscription')
  }

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Student Dashboard</h1>

      <div className="bg-gray-900 p-4 rounded-lg">
        <p>الاشتراك فعّال حتى:</p>
        <p className="font-bold">{subscription.end_date}</p>
      </div>

      <LogoutButton />
    </main>
  )
}
