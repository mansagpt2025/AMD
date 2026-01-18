import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function AdminExamsPage() {
  const supabase = await createSupabaseServerClient()

  const { data } = await supabase
    .from('exams')
    .select(`
      id,
      title,
      lessons (
        title
      )
    `)

  return (
    <div>
      <h1>الامتحانات</h1>

      <ul>
        {data?.map(e => {
          const lesson = e.lessons?.[0]

          return (
            <li key={e.id}>
              {e.title}
              {lesson && ` – ${lesson.title}`}

              <Link href={`/admin/exams/${e.id}`}> ✏️</Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
