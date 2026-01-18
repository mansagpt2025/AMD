'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function addQuestion(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  await supabase.from('questions').insert({
    exam_id: formData.get('exam_id'),
    question: formData.get('question'),
    option_a: formData.get('a'),
    option_b: formData.get('b'),
    option_c: formData.get('c'),
    option_d: formData.get('d'),
    correct_option: formData.get('correct'),
  })
}
