import { createExam } from './action'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createSupabaseServerClient()
  const { data: lessons } = await supabase.from('lessons').select('id,title')

  return (
    <form action={createExam}>
      <input name="title" placeholder="Exam title" required />

      <select name="lesson_id">
        {lessons?.map(l => (
          <option key={l.id} value={l.id}>{l.title}</option>
        ))}
      </select>

      <button>Create</button>
    </form>
  )
}
