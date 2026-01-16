import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function CoursesAdmin() {
  const supabase = await createSupabaseServerClient()

  const { data: courses } = await supabase
    .from('courses')
    .select('*')

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">الكورسات</h1>

      {courses?.map(course => (
        <div key={course.id} className="bg-gray-800 p-3 rounded mb-2">
          {course.title}
        </div>
      ))}
    </div>
  )
}
