import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('UNAUTHORIZED')

  const userId = auth.user.id

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select(`
      completed,
      last_second,
      lessons (
        title,
        courses ( title )
      )
    `)
    .eq('user_id', userId)

  const { data: exams } = await supabase
    .from('exam_results')
    .select(`
      score,
      lessons ( title )
    `)
    .eq('user_id', userId)

  return (
    <div>
      <h1>Dashboard الطالب</h1>

      <section>
        <h2>📚 التقدم في المحاضرات</h2>
        {progress?.map((p, i) => (
          <div key={i}>
            <strong>{p.lessons?.title}</strong> –{' '}
            {p.completed ? 'مكتملة ✅' : 'غير مكتملة ⏳'}
          </div>
        ))}
      </section>

      <section>
        <h2>📝 الامتحانات</h2>
        {exams?.map((e, i) => (
          <div key={i}>
            {e.lessons?.title} — الدرجة: {e.score}
          </div>
        ))}
      </section>
    </div>
  )
}
