'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function saveProgress(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()

  await supabase.from('lesson_progress').upsert({
    user_id: data.user!.id,
    lesson_id: formData.get('lesson_id'),
    completed: formData.get('completed') === 'true',
    updated_at: new Date().toISOString(),
  })
}
