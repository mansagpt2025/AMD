'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function updateCourse(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  await supabase
    .from('courses')
    .update({
      title: formData.get('title'),
      description: formData.get('description'),
      is_active: formData.get('is_active') === 'on',
    })
    .eq('id', formData.get('id'))
}
