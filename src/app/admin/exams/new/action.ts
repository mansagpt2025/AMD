'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createExam(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  await supabase.from('exams').insert({
    title: formData.get('title'),
    lesson_id: formData.get('lesson_id'),
  })

  redirect('/admin/exams')
}
