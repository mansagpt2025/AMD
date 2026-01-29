// lib/supabase/auth.ts
import { createClient } from '@supabase/supabase-js'

// Singleton pattern لتجنب إنشاء متعددة
let supabaseInstance: any = null

export const getSupabaseClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client should only be used on the client side')
  }
  
  if (supabaseInstance) return supabaseInstance
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }
  
  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // هذا هو الحل الأساسي
      storageKey: 'sb-auth-token',
      storage: window.localStorage,
      flowType: 'pkce'
    }
  })
  
  return supabaseInstance
}

export const checkAuth = async () => {
  try {
    const supabase = getSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return null
    }
    
    // تحقق من صلاحية الجلسة
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return null
    }
    
    return { user, session }
  } catch (error) {
    console.error('Auth check error:', error)
    return null
  }
}

export const clearAuthSession = async () => {
  try {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    
    localStorage.removeItem('sb-auth-token')
    sessionStorage.clear()
    
    // حذف جميع الكوكيز المتعلقة بالجلسة
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=')
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    })
  } catch (error) {
    console.error('Error clearing auth session:', error)
  }
}