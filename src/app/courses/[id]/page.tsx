import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireSubscription } from '@/lib/subscription/guards'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function CoursePage({ params }: any) {
  const subscription = await requireSubscription()
  if (!subscription) redirect('/activate-code')

  const supabase = await createSupabaseServerClient()

  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', params.id)
    .eq('is_active', true)
    .order('order_number')

  return (
    <main className="p-8 space-y-4">
      {lessons?.map(lesson => (
        <Link
          key={lesson.id}
          href={`/lessons/${lesson.id}`}
          className="block bg-gray-800 p-3 rounded"
        >
          {lesson.title}
        </Link>
      ))}
    </main>
  )
}
