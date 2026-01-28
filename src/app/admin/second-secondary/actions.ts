'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ==================== Packages ====================

export async function getPackages() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('grade', 'second')  // تغيير الفلتر إلى second
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createPackage(formData: FormData) {
  const supabase = await createClient();
  
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseInt(formData.get('price') as string);
  const type = formData.get('type') as string;
  const duration_days = parseInt(formData.get('duration_days') as string) || 30;
  const image_url = formData.get('image_url') as string;

  const { error } = await supabase.from('packages').insert({
    name,
    description,
    price,
    grade: 'second',  // تغيير إلى second
    type,
    duration_days,
    image_url: image_url || null,
    is_active: true
  });

  if (error) throw error;
  revalidatePath('/admin/second-secondary');
}

export async function updatePackage(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseInt(formData.get('price') as string);
  const type = formData.get('type') as string;
  const duration_days = parseInt(formData.get('duration_days') as string) || 30;
  const image_url = formData.get('image_url') as string;
  const is_active = formData.get('is_active') === 'true';

  const { error } = await supabase
    .from('packages')
    .update({
      name,
      description,
      price,
      type,
      duration_days,
      image_url: image_url || null,
      is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
  revalidatePath('/admin/second-secondary');
}

export async function deletePackage(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.from('packages').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/second-secondary');
}

// ==================== Lectures ====================

export async function getLectures() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('lectures')
    .select(`
      *,
      package:packages(id, name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createLecture(formData: FormData) {
  const supabase = await createClient();
  
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const image_url = formData.get('image_url') as string;
  const package_ids = JSON.parse(formData.get('package_ids') as string) as string[];
  const order_number = parseInt(formData.get('order_number') as string) || 0;

  for (const package_id of package_ids) {
    const { error } = await supabase.from('lectures').insert({
      title,
      description,
      image_url: image_url || null,
      package_id,
      order_number,
      is_active: true
    });
    
    if (error) throw error;
  }

  revalidatePath('/admin/second-secondary');
}

export async function updateLecture(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const image_url = formData.get('image_url') as string;
  const order_number = parseInt(formData.get('order_number') as string) || 0;
  const is_active = formData.get('is_active') === 'true';

  const { error } = await supabase
    .from('lectures')
    .update({
      title,
      description,
      image_url: image_url || null,
      order_number,
      is_active
    })
    .eq('id', id);

  if (error) throw error;
  revalidatePath('/admin/second-secondary');
}

export async function deleteLecture(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.from('lectures').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/second-secondary');
}

// ==================== Lecture Contents ====================

export async function getContents() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('lecture_contents')
    .select(`
      *,
      lecture:lectures(id, title, package_id)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createContent(formData: FormData) {
  const supabase = await createClient();
  
  const type = formData.get('type') as 'video' | 'pdf' | 'exam' | 'text';
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const content_url = formData.get('content_url') as string;
  const lecture_ids = JSON.parse(formData.get('lecture_ids') as string) as string[];
  const duration_minutes = parseInt(formData.get('duration_minutes') as string) || 0;
  const order_number = parseInt(formData.get('order_number') as string) || 0;
  const max_attempts = parseInt(formData.get('max_attempts') as string) || 1;
  const pass_score = parseInt(formData.get('pass_score') as string) || 70;

  const examQuestions = formData.get('exam_questions') as string;
  const finalDescription = type === 'exam' && examQuestions 
    ? `${description}\n\n[EXAM_QUESTIONS]:${examQuestions}` 
    : description;

  for (const lecture_id of lecture_ids) {
    const { error } = await supabase.from('lecture_contents').insert({
      lecture_id,
      type,
      title,
      description: finalDescription,
      content_url: content_url || null,
      duration_minutes,
      order_number,
      max_attempts: type === 'video' || type === 'exam' ? max_attempts : null,
      pass_score: type === 'exam' ? pass_score : null,
      is_active: true
    });
    
    if (error) throw error;
  }

  revalidatePath('/admin/second-secondary');
}

export async function updateContent(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const type = formData.get('type') as 'video' | 'pdf' | 'exam' | 'text';
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const content_url = formData.get('content_url') as string;
  const duration_minutes = parseInt(formData.get('duration_minutes') as string) || 0;
  const order_number = parseInt(formData.get('order_number') as string) || 0;
  const max_attempts = parseInt(formData.get('max_attempts') as string) || 1;
  const pass_score = parseInt(formData.get('pass_score') as string) || 70;
  const is_active = formData.get('is_active') === 'true';

  const examQuestions = formData.get('exam_questions') as string;
  const finalDescription = type === 'exam' && examQuestions 
    ? `${description}\n\n[EXAM_QUESTIONS]:${examQuestions}` 
    : description;

  const { error } = await supabase
    .from('lecture_contents')
    .update({
      type,
      title,
      description: finalDescription,
      content_url: content_url || null,
      duration_minutes,
      order_number,
      max_attempts: type === 'video' || type === 'exam' ? max_attempts : null,
      pass_score: type === 'exam' ? pass_score : null,
      is_active
    })
    .eq('id', id);

  if (error) throw error;
  revalidatePath('/admin/second-secondary');
}

export async function deleteContent(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.from('lecture_contents').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/second-secondary');
}