import { createSupabaseServerClient } from '@/lib/supabase/server'
import LessonsDragList from '@/components/admin/LessonsDragList'

export default async function AdminLessonsPage() {
  const supabase = await createSupabaseServerClient()

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id,title,order_index')
    .order('order_index')

  return (
    <div>
      <h1>ترتيب المحاضرات</h1>
      <LessonsDragList initialLessons={lessons || []} />
    </div>
  )
}
