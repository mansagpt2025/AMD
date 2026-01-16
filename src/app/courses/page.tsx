import { createSupabaseServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CoursesPage() {
  const supabase = await createSupabaseServerClient()

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .order('created_at')

  return (
    <main className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      {courses?.map(course => (
        <Link
          key={course.id}
          href={`/courses/${course.id}`}
          className="bg-gray-800 p-4 rounded-xl"
        >
          <h2 className="text-lg font-bold">{course.title}</h2>
          <p className="text-sm opacity-70">{course.description}</p>
        </Link>
      ))}
    </main>
  )
}
