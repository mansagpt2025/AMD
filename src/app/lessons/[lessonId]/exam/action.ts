'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function submitExam(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()

  const examId = formData.get('exam_id')

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', examId)

  let score = 0

  for (const q of questions!) {
    const answer = formData.get(`q_${q.id}`)
    if (answer === q.correct_option) score++
  }

  await supabase.from('exam_results').upsert({
    user_id: userData.user!.id,
    exam_id: examId,
    score,
    total: questions!.length,
  })

  redirect('/dashboard')
}
