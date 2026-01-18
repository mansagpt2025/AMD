'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function deletePlan(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  const id = formData.get('id') as string

  await supabase.from('plans').delete().eq('id', id)

  redirect('/admin/plans')
}
