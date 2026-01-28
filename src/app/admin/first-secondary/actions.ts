'use server'

import { createServerActionClient } from '@/lib/supabase/2server'
import { revalidatePath } from 'next/cache'

// ================== TYPES ==================

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

// ================== GET ==================

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

// ================== CREATE ==================

export async function createPackage(data: PackageData) {
  const supabase = await createServerActionClient()
  const { error } = await supabase.from('packages').insert(data)
  if (error) throw error
  revalidatePath('/admin/first-secondary')
}

export async function createLecture(data: LectureData) {
  const supabase = await createServerActionClient()
  const { error } = await supabase.from('lectures').insert(data)
  if (error) throw error
  revalidatePath('/admin/first-secondary')
}

export async function createContent(data: ContentData) {
  const supabase = await createServerActionClient()
  const { error } = await supabase.from('lecture_contents').insert(data)
  if (error) throw error
  revalidatePath('/admin/first-secondary')
}

// ================== UPDATE ==================

export async function updatePackage(id: string, data: PackageData) {
  const supabase = await createServerActionClient()
  const { error } = await supabase
    .from('packages')
    .update(data)
    .eq('id', id)

  if (error) throw error
  revalidatePath('/admin/first-secondary')
}

export async function updateLecture(
  id: string,
  data: {
    title: string
    description: string | null
    image_url: string | null
    order_number: number
    package_id: string
  }
) {
  const supabase = await createServerActionClient()
  const { error } = await supabase
    .from('lectures')
    .update(data)
    .eq('id', id)

  if (error) throw error
  revalidatePath('/admin/first-secondary')
}

export async function updateContent(
  id: string,
  data: {
    lecture_id: string
    type: string
    title: string
    description: string | null
    content_url: string | null
    max_attempts: number
    order_number: number
  }
) {
  const supabase = await createServerActionClient()
  const { error } = await supabase
    .from('lecture_contents')
    .update(data)
    .eq('id', id)

  if (error) throw error
  revalidatePath('/admin/first-secondary')
}

// ================== DELETE ==================

export async function deletePackage(id: string) {
  const supabase = await createServerActionClient()
  const { error } = await supabase.from('packages').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/admin/first-secondary')
}

export async function deleteLecture(id: string) {
  const supabase = await createServerActionClient()
  const { error } = await supabase.from('lectures').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/admin/first-secondary')
}

export async function deleteContent(id: string) {
  const supabase = await createServerActionClient()
  const { error } = await supabase.from('lecture_contents').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/admin/first-secondary')
}
