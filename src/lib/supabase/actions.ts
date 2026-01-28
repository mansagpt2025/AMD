'use server'

import { createServerActionClient } from '@/lib/supabase/2server'
import { revalidatePath } from 'next/cache'

export interface PackageData {
  name: string
  description: string | null
  price: number
  image_url: string | null
}

export interface LectureData {
  package_id: string
  title: string
  description: string | null
  image_url: string | null
  order_number: number
}

export interface ContentData {
  lecture_id: string
  type: 'video' | 'pdf' | 'exam' | 'text'
  title: string
  description: string | null
  content_url: string | null
  max_attempts: number
  order_number: number
}

export async function getPackages() {
  const supabase = await createServerActionClient()
  const { data, error } = await supabase.from('packages').select('*')
  if (error) throw error
  return data ?? []
}

export async function getLectures(packageId?: string) {
  const supabase = await createServerActionClient()

  let query = supabase
    .from('lectures')
    .select('*, packages(name)')
    .order('order_number')

  if (packageId) query = query.eq('package_id', packageId)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getContents(lectureId?: string) {
  const supabase = await createServerActionClient()

  let query = supabase
    .from('lecture_contents')
    .select('*, lectures(title)')
    .order('order_number')

  if (lectureId) query = query.eq('lecture_id', lectureId)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
