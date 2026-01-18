import { createSupabaseServerClient } from '@/lib/supabase/server'
import { updateCourse } from './action'

export default async function EditCoursePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createSupabaseServerClient()

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!course) {
    return <p>الكورس غير موجود</p>
  }

  return (
    <div>
      <h1>تعديل الكورس</h1>

      <form action={updateCourse}>
        <input type="hidden" name="id" value={course.id} />

        <input
          name="title"
          defaultValue={course.title}
          placeholder="اسم الكورس"
          required
        />

        <textarea
          name="description"
          defaultValue={course.description || ''}
          placeholder="وصف الكورس"
        />

        <label>
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={course.is_active}
          />
          الكورس مفعل
        </label>

        <button type="submit">حفظ التعديلات</button>
      </form>
    </div>
  )
}
