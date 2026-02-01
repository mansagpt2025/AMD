'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ==================== Packages ====================

export async function getPackages() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('grade', 'first')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createPackage(formData: FormData) {
  const supabase = await createClient();
  
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string);
  const original_price = parseFloat(formData.get('original_price') as string) || price;
  const type = formData.get('type') as string;
  const duration_days = parseInt(formData.get('duration_days') as string) || 30;
  const image_url = formData.get('image_url') as string;

  const { error } = await supabase.from('packages').insert({
    name,
    description: description || null,
    price,
    original_price: original_price > price ? original_price : null,
    grade: 'first',
    type,
    duration_days,
    image_url: image_url || null,
    is_active: true
  });

  if (error) throw error;
  revalidatePath('/admin/first-secondary');
}

export async function updatePackage(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string);
  const original_price = parseFloat(formData.get('original_price') as string) || price;
  const type = formData.get('type') as string;
  const duration_days = parseInt(formData.get('duration_days') as string) || 30;
  const image_url = formData.get('image_url') as string;
  const is_active = formData.get('is_active') === 'true';

  const updateData: any = {
    name,
    description: description || null,
    price,
    original_price: original_price > price ? original_price : null,
    type,
    duration_days,
    image_url: image_url || null,
    is_active,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('packages')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
  revalidatePath('/admin/first-secondary');
}

export async function deletePackage(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.from('packages').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/first-secondary');
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

export async function getLecturesByPackage(packageId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('lectures')
    .select('*')
    .eq('package_id', packageId)
    .order('order_number', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createLecture(formData: FormData) {
  const supabase = await createClient();
  
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const image_url = formData.get('image_url') as string;
  const package_ids = JSON.parse(formData.get('package_ids') as string || '[]') as string[];
  const order_number = parseInt(formData.get('order_number') as string) || 0;

  if (!package_ids.length) throw new Error('يجب اختيار باقة واحدة على الأقل');

  // Create lecture for each selected package
  for (const package_id of package_ids) {
    const { error } = await supabase.from('lectures').insert({
      title,
      description: description || null,
      image_url: image_url || null,
      package_id,
      order_number,
      is_active: true
    });
    
    if (error) throw error;
  }

  revalidatePath('/admin/first-secondary');
}

export async function updateLecture(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const image_url = formData.get('image_url') as string;
  const order_number = parseInt(formData.get('order_number') as string) || 0;
  const is_active = formData.get('is_active') === 'true';

  const updateData: any = {
    title,
    description: description || null,
    image_url: image_url || null,
    order_number,
    is_active,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('lectures')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
  revalidatePath('/admin/first-secondary');
}

export async function deleteLecture(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.from('lectures').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/first-secondary');
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

export async function getContentsByLecture(lectureId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('lecture_contents')
    .select('*')
    .eq('lecture_id', lectureId)
    .order('order_number', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createContent(formData: FormData) {
  const supabase = await createClient();
  
  const type = formData.get('type') as 'video' | 'pdf' | 'exam' | 'text';
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const content_url = formData.get('content_url') as string;
  const lecture_ids = JSON.parse(formData.get('lecture_ids') as string || '[]') as string[];
  const duration_minutes = parseInt(formData.get('duration_minutes') as string) || 0;
  const order_number = parseInt(formData.get('order_number') as string) || 0;
  const max_attempts = parseInt(formData.get('max_attempts') as string) || 1;
  const pass_score = parseInt(formData.get('pass_score') as string) || 70;

  if (!lecture_ids.length) throw new Error('يجب اختيار محاضرة واحدة على الأقل');

  // معالجة أسئلة الامتحان
  let exam_questions = null;
  if (type === 'exam') {
    const questionsJson = formData.get('exam_questions') as string;
    if (questionsJson) {
      try {
        exam_questions = JSON.parse(questionsJson);
      } catch (e) {
        throw new Error('صيغة أسئلة الامتحان غير صحيحة');
      }
    }
  }

  for (const lecture_id of lecture_ids) {
    const insertData: any = {
      lecture_id,
      type,
      title,
      description: description || null,
      content_url: content_url || null,
      duration_minutes,
      order_number,
      max_attempts: type === 'video' || type === 'exam' ? max_attempts : null,
      pass_score: type === 'exam' ? pass_score : null,
      exam_questions: type === 'exam' ? exam_questions : null,
      is_active: true
    };

    const { error } = await supabase.from('lecture_contents').insert(insertData);
    
    if (error) throw error;
  }

  revalidatePath('/admin/first-secondary');
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

  // معالجة أسئلة الامتحان في حالة التعديل
  let exam_questions = null;
  if (type === 'exam') {
    const questionsJson = formData.get('exam_questions') as string;
    if (questionsJson) {
      try {
        exam_questions = JSON.parse(questionsJson);
      } catch (e) {
        throw new Error('صيغة أسئلة الامتحان غير صحيحة');
      }
    }
  }

  const updateData: any = {
    title,
    description: description || null,
    content_url: content_url || null,
    duration_minutes,
    order_number,
    max_attempts: type === 'video' || type === 'exam' ? max_attempts : null,
    pass_score: type === 'exam' ? pass_score : null,
    exam_questions: type === 'exam' ? exam_questions : null,
    is_active,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('lecture_contents')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
  revalidatePath('/admin/first-secondary');
}

export async function deleteContent(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.from('lecture_contents').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/first-secondary');
}