'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

export async function generateCode(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  const code = randomUUID().slice(0, 8).toUpperCase()

  await supabase.from('codes').insert({
    code,
    type: formData.get('type'),
    target_id: formData.get('target_id') || null,
  })
}
