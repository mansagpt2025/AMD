import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('exams')
    .select('id,title,lessons(title)')

  return (
    <>
      <Link href="/admin/exams/new">➕ Exam</Link>
      <ul>
        {data?.map(e => (
          <li key={e.id}>
            {e.title} – {e.lessons?.title}
            <Link href={`/admin/exams/${e.id}`}> ✏️</Link>
          </li>
        ))}
      </ul>
    </>
  )
}
