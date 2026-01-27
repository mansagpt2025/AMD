import { supabase } from '../lib/supabaseClient';

export const codesService = {
  // إنشاء كود جديد
  async createCode(packageId: string, grade: string) {
    const code = this.generateCode();
    
    const { data, error } = await supabase
      .from('codes')
      .insert([
        {
          code,
          package_id: packageId,
          grade,
          is_used: false,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // الحصول على جميع الأكواد
  async getAllCodes(limit = 50, offset = 0) {
    const { data, error, count } = await supabase
      .from('codes')
      .select(`
        id,
        code,
        package_id,
        grade,
        is_used,
        used_by,
        used_at,
        created_at,
        packages(name, type),
        profiles:used_by(full_name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);
    return { data, total: count };
  },

  // البحث عن أكواد
  async searchCodes(query: string) {
    const { data, error } = await supabase
      .from('codes')
      .select(`
        id,
        code,
        package_id,
        grade,
        is_used,
        used_by,
        used_at,
        created_at,
        packages(name, type),
        profiles:used_by(full_name, email)
      `)
      .ilike('code', `%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  },

  // الحصول على أكواد غير مستخدمة
  async getUnusedCodes(packageId?: string) {
    let query = supabase
      .from('codes')
      .select(`
        id,
        code,
        package_id,
        grade,
        created_at,
        packages(name, type)
      `)
      .eq('is_used', false);

    if (packageId) {
      query = query.eq('package_id', packageId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  // الحصول على أكواد مستخدمة
  async getUsedCodes() {
    const { data, error } = await supabase
      .from('codes')
      .select(`
        id,
        code,
        package_id,
        grade,
        is_used,
        used_by,
        used_at,
        created_at,
        packages(name, type),
        profiles:used_by(full_name, email)
      `)
      .eq('is_used', true)
      .order('used_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  },

  // حذف كود
  async deleteCode(codeId: string) {
    const { error } = await supabase
      .from('codes')
      .delete()
      .eq('id', codeId);

    if (error) throw new Error(error.message);
  },

  // إحصائيات الأكواد
  async getCodeStatistics() {
    const { data: totalData } = await supabase
      .from('codes')
      .select('id', { count: 'exact' });

    const { data: usedData } = await supabase
      .from('codes')
      .select('id', { count: 'exact' })
      .eq('is_used', true);

    const { data: unusedData } = await supabase
      .from('codes')
      .select('id', { count: 'exact' })
      .eq('is_used', false);

    return {
      total: totalData?.length || 0,
      used: usedData?.length || 0,
      unused: unusedData?.length || 0,
    };
  },

  // توليد كود عشوائي
  generateCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  },

  // حذف جميع الأكواد المنتهية
  async deleteExpiredCodes() {
    const { error } = await supabase
      .from('codes')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .eq('is_used', false);

    if (error) throw new Error(error.message);
  },
};
