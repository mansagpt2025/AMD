'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Helper function للتعامل مع الأخطاء
function handleError(error: any, context: string) {
  console.error(`Error in ${context}:`, error);
  if (error?.message) {
    throw new Error(error.message);
  }
  throw new Error(`حدث خطأ في ${context}`);
}

// ==================== Packages ====================

export async function getPackages() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('grade', 'first')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'getPackages');
    return [];
  }
}

export async function createPackage(formData: FormData) {
  try {
    const supabase = await createClient();
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const priceStr = formData.get('price') as string;
    const originalPriceStr = formData.get('original_price') as string;
    const type = formData.get('type') as string;
    const durationStr = formData.get('duration_days') as string;
    const image_url = formData.get('image_url') as string;
    const is_active = formData.get('is_active') === 'true';

    // Validation
    if (!name?.trim()) throw new Error('اسم الباقة مطلوب');
    if (!priceStr) throw new Error('السعر مطلوب');
    
    const price = parseFloat(priceStr);
    const original_price = originalPriceStr ? parseFloat(originalPriceStr) : null;
    const duration_days = parseInt(durationStr) || 30;

    if (isNaN(price) || price < 0) throw new Error('السعر غير صالح');

    const insertData = {
      name: name.trim(),
      description: description?.trim() || null,
      price,
      original_price: original_price && original_price > price ? original_price : null,
      grade: 'first',
      type: type || 'monthly',
      duration_days,
      image_url: image_url?.trim() || null,
      is_active: is_active !== undefined ? is_active : true
    };

    console.log('Creating package:', insertData);

    const { error } = await supabase.from('packages').insert(insertData);

    if (error) throw error;
    
    revalidatePath('/admin/first-secondary');
    return { success: true };
  } catch (error) {
    handleError(error, 'createPackage');
  }
}

export async function updatePackage(id: string, formData: FormData) {
  try {
    const supabase = await createClient();
    
    if (!id) throw new Error('معرف الباقة مطلوب');

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const priceStr = formData.get('price') as string;
    const originalPriceStr = formData.get('original_price') as string;
    const type = formData.get('type') as string;
    const durationStr = formData.get('duration_days') as string;
    const image_url = formData.get('image_url') as string;
    const is_active = formData.get('is_active') === 'true';

    if (!name?.trim()) throw new Error('اسم الباقة مطلوب');
    
    const price = parseFloat(priceStr);
    const original_price = originalPriceStr ? parseFloat(originalPriceStr) : null;
    const duration_days = parseInt(durationStr) || 30;

    if (isNaN(price)) throw new Error('السعر غير صالح');

    const updateData = {
      name: name.trim(),
      description: description?.trim() || null,
      price,
      original_price: original_price && original_price > price ? original_price : null,
      type: type || 'monthly',
      duration_days,
      image_url: image_url?.trim() || null,
      is_active,
      updated_at: new Date().toISOString()
    };

    console.log('Updating package:', id, updateData);

    const { error } = await supabase
      .from('packages')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    
    revalidatePath('/admin/first-secondary');
    return { success: true };
  } catch (error) {
    handleError(error, 'updatePackage');
  }
}

export async function deletePackage(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase.from('packages').delete().eq('id', id);
    if (error) throw error;
    
    revalidatePath('/admin/first-secondary');
    return { success: true };
  } catch (error) {
    handleError(error, 'deletePackage');
  }
}

// ==================== Lectures ====================

export async function getLectures() {
  try {
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
  } catch (error) {
    handleError(error, 'getLectures');
    return [];
  }
}

export async function createLecture(formData: FormData) {
  try {
    const supabase = await createClient();
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const image_url = formData.get('image_url') as string;
    const packageIdsJson = formData.get('package_ids') as string;
    const orderStr = formData.get('order_number') as string;

    if (!title?.trim()) throw new Error('عنوان المحاضرة مطلوب');
    
    let package_ids: string[] = [];
    try {
      package_ids = JSON.parse(packageIdsJson || '[]');
    } catch (e) {
      throw new Error('بيانات الباقات غير صالحة');
    }

    if (!package_ids.length) throw new Error('يجب اختيار باقة واحدة على الأقل');

    const order_number = parseInt(orderStr) || 0;

    // Create lecture for each selected package
    const promises = package_ids.map(async (package_id) => {
      const { error } = await supabase.from('lectures').insert({
        title: title.trim(),
        description: description?.trim() || null,
        image_url: image_url?.trim() || null,
        package_id,
        order_number,
        is_active: true
      });
      
      if (error) throw error;
    });

    await Promise.all(promises);
    
    revalidatePath('/admin/first-secondary');
    return { success: true };
  } catch (error) {
    handleError(error, 'createLecture');
  }
}

export async function updateLecture(id: string, formData: FormData) {
  try {
    const supabase = await createClient();
    
    if (!id) throw new Error('معرف المحاضرة مطلوب');

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const image_url = formData.get('image_url') as string;
    const orderStr = formData.get('order_number') as string;
    const is_active = formData.get('is_active') === 'true';

    if (!title?.trim()) throw new Error('عنوان المحاضرة مطلوب');

    const order_number = parseInt(orderStr) || 0;

    const updateData = {
      title: title.trim(),
      description: description?.trim() || null,
      image_url: image_url?.trim() || null,
      order_number,
      is_active,
      updated_at: new Date().toISOString()
    };

    console.log('Updating lecture:', id, updateData);

    const { error } = await supabase
      .from('lectures')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    
    revalidatePath('/admin/first-secondary');
    return { success: true };
  } catch (error) {
    handleError(error, 'updateLecture');
  }
}

export async function deleteLecture(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase.from('lectures').delete().eq('id', id);
    if (error) throw error;
    
    revalidatePath('/admin/first-secondary');
    return { success: true };
  } catch (error) {
    handleError(error, 'deleteLecture');
  }
}

// ==================== Contents ====================

export async function getContents() {
  try {
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
  } catch (error) {
    handleError(error, 'getContents');
    return [];
  }
}

export async function createContent(formData: FormData) {
  try {
    const supabase = await createClient();
    
    const type = formData.get('type') as 'video' | 'pdf' | 'exam' | 'text';
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const content_url = formData.get('content_url') as string;
    const lectureIdsJson = formData.get('lecture_ids') as string;
    const durationStr = formData.get('duration_minutes') as string;
    const orderStr = formData.get('order_number') as string;
    const maxAttemptsStr = formData.get('max_attempts') as string;
    const passScoreStr = formData.get('pass_score') as string;

    if (!title?.trim()) throw new Error('عنوان المحتوى مطلوب');
    if (!type) throw new Error('نوع المحتوى مطلوب');
    
    let lecture_ids: string[] = [];
    try {
      lecture_ids = JSON.parse(lectureIdsJson || '[]');
    } catch (e) {
      throw new Error('بيانات المحاضرات غير صالحة');
    }

    if (!lecture_ids.length) throw new Error('يجب اختيار محاضرة واحدة على الأقل');

    const duration_minutes = parseInt(durationStr) || 0;
    const order_number = parseInt(orderStr) || 0;
    const max_attempts = parseInt(maxAttemptsStr) || 1;
    const pass_score = parseInt(passScoreStr) || 70;

    // معالجة أسئلة الامتحان
    let exam_questions = null;
    if (type === 'exam') {
      const questionsJson = formData.get('exam_questions') as string;
      if (questionsJson) {
        try {
          exam_questions = JSON.parse(questionsJson);
          if (!Array.isArray(exam_questions) || exam_questions.length === 0) {
            throw new Error('يجب إضافة سؤال واحد على الأقل للامتحان');
          }
        } catch (e) {
          throw new Error('صيغة أسئلة الامتحان غير صالحة');
        }
      } else {
        throw new Error('يجب إضافة أسئلة للامتحان');
      }
    }

    // Create content for each selected lecture
    const promises = lecture_ids.map(async (lecture_id) => {
      const insertData: any = {
        lecture_id,
        type,
        title: title.trim(),
        description: description?.trim() || null,
        content_url: content_url?.trim() || null,
        duration_minutes,
        order_number,
        max_attempts: (type === 'video' || type === 'exam') ? max_attempts : null,
        pass_score: type === 'exam' ? pass_score : null,
        exam_questions: type === 'exam' ? exam_questions : null,
        is_active: true
      };

      const { error } = await supabase.from('lecture_contents').insert(insertData);
      
      if (error) throw error;
    });

    await Promise.all(promises);
    
    revalidatePath('/admin/first-secondary');
    return { success: true };
  } catch (error) {
    handleError(error, 'createContent');
  }
}

export async function updateContent(id: string, formData: FormData) {
  try {
    const supabase = await createClient();
    
    if (!id) throw new Error('معرف المحتوى مطلوب');

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const content_url = formData.get('content_url') as string;
    const durationStr = formData.get('duration_minutes') as string;
    const orderStr = formData.get('order_number') as string;
    const maxAttemptsStr = formData.get('max_attempts') as string;
    const passScoreStr = formData.get('pass_score') as string;
    const is_active = formData.get('is_active') === 'true';
    const type = formData.get('type') as 'video' | 'pdf' | 'exam' | 'text';

    if (!title?.trim()) throw new Error('عنوان المحتوى مطلوب');

    const duration_minutes = parseInt(durationStr) || 0;
    const order_number = parseInt(orderStr) || 0;
    const max_attempts = parseInt(maxAttemptsStr) || 1;
    const pass_score = parseInt(passScoreStr) || 70;

    // معالجة أسئلة الامتحان في حالة التعديل
    let exam_questions = null;
    if (type === 'exam') {
      const questionsJson = formData.get('exam_questions') as string;
      if (questionsJson) {
        try {
          exam_questions = JSON.parse(questionsJson);
        } catch (e) {
          throw new Error('صيغة أسئلة الامتحان غير صالحة');
        }
      }
    }

    const updateData: any = {
      title: title.trim(),
      description: description?.trim() || null,
      content_url: content_url?.trim() || null,
      duration_minutes,
      order_number,
      max_attempts: (type === 'video' || type === 'exam') ? max_attempts : null,
      pass_score: type === 'exam' ? pass_score : null,
      exam_questions: type === 'exam' ? exam_questions : null,
      is_active,
      updated_at: new Date().toISOString()
    };

    console.log('Updating content:', id, updateData);

    const { error } = await supabase
      .from('lecture_contents')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    
    revalidatePath('/admin/first-secondary');
    return { success: true };
  } catch (error) {
    handleError(error, 'updateContent');
  }
}

export async function deleteContent(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase.from('lecture_contents').delete().eq('id', id);
    if (error) throw error;
    
    revalidatePath('/admin/first-secondary');
    return { success: true };
  } catch (error) {
    handleError(error, 'deleteContent');
  }
}