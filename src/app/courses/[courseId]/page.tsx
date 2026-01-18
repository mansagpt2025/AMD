import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function CoursePage({ params }: any) {
  const supabase = await createSupabaseServerClient()

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id,title,is_active')
    .eq('course_id', params.courseId)
    .order('order_index')

  return (
    <div>
      <h1>محاضرات الكورس</h1>

      <ul>
        {lessons?.map(l => (
          <li key={l.id}>
            {l.is_active ? (
              <Link href={`/lessons/${l.id}`}>{l.title}</Link>
            ) : (
              <span>{l.title} (مغلقة)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
