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
        courses (
          title
        )
      )
    `)
    .eq('user_id', userId)

  return (
    <div>
      <h1>Dashboard الطالب</h1>

      <section>
        <h2>📚 التقدم في المحاضرات</h2>

        {progress?.map((p, i) => {
          const lesson = p.lessons?.[0]
          const course = lesson?.courses?.[0]

          return (
            <div key={i}>
              <strong>{lesson?.title}</strong>
              {course && <span> — {course.title}</span>}
              {' — '}
              {p.completed ? 'مكتملة ✅' : 'غير مكتملة ⏳'}
            </div>
          )
        })}
      </section>
    </div>
  )
}
