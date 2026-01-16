import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function LessonsAdmin() {
  const supabase = await createSupabaseServerClient()

  const { data: lessons } = await supabase
    .from('lessons')
    .select('*, courses(title)')

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">المحاضرات</h1>

      {lessons?.map(lesson => (
        <div key={lesson.id} className="bg-gray-800 p-3 rounded mb-2">
          <p>{lesson.title}</p>
          <small>{lesson.courses?.title}</small>
        </div>
      ))}
    </div>
  )
}
