import { createSupabaseServerClient } from '@/lib/supabase/server'
import StatsCards from '@/components/admin/StatsCards'
import LessonsCompletionChart from '@/components/admin/LessonsCompletionChart'
import ExamsDifficultyChart from '@/components/admin/ExamsDifficultyChart'

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient()

  const [{ count: users }, { count: subs }, { count: lessons }] =
    await Promise.all([
      supabase.from('auth.users').select('*', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }),
      supabase.from('lessons').select('*', { count: 'exact', head: true }),
    ])

  const { data: completion } = await supabase
    .from('lesson_progress')
    .select(`
      completed,
      lessons ( title )
    `)

  const { data: exams } = await supabase
    .from('exam_results')
    .select(`
      score,
      lessons ( title )
    `)

  return (
    <div>
      <h1>📊 لوحة تحكم الأدمن</h1>

      <StatsCards
        users={users || 0}
        subscriptions={subs || 0}
        lessons={lessons || 0}
      />

      <LessonsCompletionChart data={completion || []} />
      <ExamsDifficultyChart data={exams || []} />
    </div>
  )
}
