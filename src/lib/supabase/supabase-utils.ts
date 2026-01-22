// lib/supabase/supabase-utils.ts
import { createClient } from './supabase-server'
import { supabase as browserClient } from './supabase-client'

// دالة للتحقق من حالة المصادقة
export async function checkAuthStatus() {
  try {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    return {
      isAuthenticated: !!session,
      session,
      error
    }
  } catch (error) {
    return {
      isAuthenticated: false,
      session: null,
      error
    }
  }
}

// دالة للتحقق من دور المستخدم
export async function getUserRole(userId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching user role:', error)
      return 'student' // دور افتراضي
    }
    
    return data?.role || 'student'
  } catch (error) {
    console.error('Error in getUserRole:', error)
    return 'student'
  }
}

// دالة لتحديث حالة المصادقة في العميل
export async function refreshAuth() {
  try {
    const { data: { session }, error } = await browserClient.auth.getSession()
    
    if (error) {
      console.error('Error refreshing auth:', error)
      return null
    }
    
    return session
  } catch (error) {
    console.error('Error in refreshAuth:', error)
    return null
  }
}