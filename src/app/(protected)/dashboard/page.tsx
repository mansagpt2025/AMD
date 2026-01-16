import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getActiveSubscription } from '@/lib/subscription/server'
import LogoutButton from '@/components/layout/LogoutButton'
import Link from 'next/link'

export default async function DashboardPage() {
const supabase = await createSupabaseServerClient()

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
<Link
  href="/activate-code"
  className="bg-indigo-600 px-4 py-2 rounded-lg"
>
  تفعيل كود
</Link>

      <LogoutButton />
    </main>
  )
}
