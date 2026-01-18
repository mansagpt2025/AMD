import { createSupabaseServerClient } from '@/lib/supabase/server'
import { addQuestion } from './action'

export default async function Page({ params }: any) {
  const supabase = await createSupabaseServerClient()

  const { data: exam } = await supabase
    .from('exams')
    .select('*')
    .eq('id', params.id)
    .single()

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', params.id)

  return (
    <>
      <h2>{exam.title}</h2>

      <form action={addQuestion}>
        <input type="hidden" name="exam_id" value={params.id} />
        <input name="question" placeholder="Question" required />
        <input name="a" placeholder="Option A" required />
        <input name="b" placeholder="Option B" required />
        <input name="c" placeholder="Option C" required />
        <input name="d" placeholder="Option D" required />

        <select name="correct">
          <option value="a">A</option>
          <option value="b">B</option>
          <option value="c">C</option>
          <option value="d">D</option>
        </select>

        <button>Add Question</button>
      </form>

      <ul>
        {questions?.map(q => (
          <li key={q.id}>{q.question}</li>
        ))}
      </ul>
    </>
  )
}
