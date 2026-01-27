'use server';

import { supabase } from '../lib/supabaseClient';
import { revalidatePath } from 'next/cache';

export const codesService = {
  async createCode(packageId: string, grade: string) {
    try {
      // توليد كود عشوائي
      const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 10; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      const code = generateCode();
      
      const { data, error } = await supabase
        .from('codes')
        .insert({
          code,
          package_id: packageId,
          grade,
          is_used: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      revalidatePath('/admin/codes');
      return data;
    } catch (error) {
      console.error('Error creating code:', error);
      throw new Error('خطأ في إنشاء الكود');
    }
  },

  async getAllCodes(limit = 10, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('codes')
        .select(`
          *,
          packages (name, type),
          profiles (full_name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      return {
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching codes:', error);
      return { data: [], total: 0 };
    }
  },

  async searchCodes(query: string) {
    try {
      const { data, error } = await supabase
        .from('codes')
        .select(`
          *,
          packages (name, type),
          profiles (full_name, email)
        `)
        .or(`code.ilike.%${query}%,profiles.full_name.ilike.%${query}%,profiles.email.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error searching codes:', error);
      return [];
    }
  },

  async getUsedCodes() {
    try {
      const { data, error } = await supabase
        .from('codes')
        .select(`
          *,
          packages (name, type),
          profiles (full_name, email)
        `)
        .not('used_at', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching used codes:', error);
      return [];
    }
  },

  async getUnusedCodes() {
    try {
      const { data, error } = await supabase
        .from('codes')
        .select(`
          *,
          packages (name, type),
          profiles (full_name, email)
        `)
        .is('used_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching unused codes:', error);
      return [];
    }
  },

  async getCodeStatistics() {
    try {
      const [
        { count: total },
        { count: used },
        { count: unused }
      ] = await Promise.all([
        supabase.from('codes').select('*', { count: 'exact', head: true }),
        supabase.from('codes').select('*', { count: 'exact', head: true }).not('used_at', 'is', null),
        supabase.from('codes').select('*', { count: 'exact', head: true }).is('used_at', null)
      ]);
      
      return {
        total: total || 0,
        used: used || 0,
        unused: unused || 0
      };
    } catch (error) {
      console.error('Error fetching code statistics:', error);
      return { total: 0, used: 0, unused: 0 };
    }
  },

  async deleteCode(codeId: string) {
    try {
      const { error } = await supabase
        .from('codes')
        .delete()
        .eq('id', codeId);

      if (error) throw error;
      
      revalidatePath('/admin/codes');
      return { success: true };
    } catch (error) {
      console.error('Error deleting code:', error);
      throw new Error('خطأ في حذف الكود');
    }
  }
};