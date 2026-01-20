import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import WelcomeCard from './components/WelcomeCard'
import StatsCards from './components/StatsCards'
import GradeCard from './components/GradeCard'
import Subscriptions from './components/Subscriptions'

export default async function DashboardPage() {
const supabase = await createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: wallet }, { data: subs }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('wallets').select('balance').eq('user_id', user.id).single(),
      supabase
        .from('subscriptions')
        .select(`
          id,
          packages (
            id,
            title,
            image_url,
            grade
          )
        `)
        .eq('user_id', user.id),
    ])

  return (
    <div className="space-y-6">
      <WelcomeCard profile={profile} wallet={wallet} />
      <StatsCards subsCount={subs?.length || 0} />
      <GradeCard grade={profile.grade} />
      <Subscriptions subs={subs || []} />
    </div>
  )
}
