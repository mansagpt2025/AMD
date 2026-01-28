'use server';

import { createServerClient } from '@/lib/2supabase';
import { revalidatePath } from 'next/cache';

// ⬅️ أنشئ client مرة واحدة
const supabase = createServerClient();

// توليد كود عشوائي
function generateCode(length: number = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function getPackages() {
  try {
    const { data, error } = await supabase
      .from('packages')
      .select('id, name, grade, type, price')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function getGrades() {
  try {
    const { data, error } = await supabase
      .from('grades')
      .select('id, name, slug')
      .order('name');

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function createCode(formData: {
  package_id: string;
  grade: string;
  expires_at?: string;
}) {
  try {
    const code = `EDU-${generateCode(6)}-${generateCode(4)}`;

    const { data, error } = await supabase
      .from('codes')
      .insert({
        code,
        package_id: formData.package_id,
        grade: formData.grade,
        is_used: false,
        expires_at: formData.expires_at || null,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/admin/codes');
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
}

export async function getCodes(page: number = 1, limit: number = 10) {
  try {
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data, error, count } = await supabase
      .from('codes')
      .select(
        `
        *,
        packages:package_id (id, name, grade, type),
        profiles:used_by (id, full_name, email)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    return {
      data,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      total: 0,
      totalPages: 0,
      error: error.message,
    };
  }
}

export async function deleteCode(id: string) {
  try {
    const { error } = await supabase
      .from('codes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/admin/codes');
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
