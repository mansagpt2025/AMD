import { createSupabaseServerClient } from '@/lib/supabase/server'
import { submitExam } from './action'

export default async function Page({ params }: any) {
  const supabase = await createSupabaseServerClient()

  const { data: exam } = await supabase
    .from('exams')
    .select('*')
    .eq('lesson_id', params.id)
    .single()

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', exam.id)

  return (
    <form action={submitExam}>
      <input type="hidden" name="exam_id" value={exam.id} />

      {questions?.map((q, i) => (
        <div key={q.id}>
          <p>{i + 1}. {q.question}</p>

          {['a','b','c','d'].map(opt => (
            <label key={opt}>
              <input
                type="radio"
                name={`q_${q.id}`}
                value={opt}
                required
              />
              {q[`option_${opt}`]}
            </label>
          ))}
        </div>
      ))}

      <button>Submit</button>
    </form>
  )
}
