"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/supabase-client';
import { User } from '@supabase/supabase-js';

interface AuthUser {
  isLoggedIn: boolean;
  role: 'student' | 'admin' | null;
  name: string;
  profileImage: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // دالة لتحميل بيانات المستخدم
  const loadUserData = async (supabaseUser: User) => {
    try {
      // جلب بيانات المستخدم من جدول profiles
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return null;
      }

      // تحديد دور المستخدم (هنا يمكنك تعديل المنطق حسب نظام الأدوار الخاص بك)
      let role: 'student' | 'admin' = 'student';
      if (profileData.is_admin) {
        role = 'admin';
      }

      return {
        isLoggedIn: true,
        role,
        name: profileData.full_name || supabaseUser.email?.split('@')[0] || 'مستخدم',
        profileImage: profileData.avatar_url || '',
        email: supabaseUser.email || ''
      };
    } catch (err) {
      console.error('Error in loadUserData:', err);
      return null;
    }
  };

  // التحقق من الجلسة الحالية
  const refreshSession = async () => {
    try {
      setLoading(true);
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        setUser(null);
        localStorage.removeItem('supabase.auth.token');
        return;
      }

      const userData = await loadUserData(session.user);
      if (userData) {
        setUser(userData);
        
        // تخزين في localStorage للوصول السريع
        localStorage.setItem('supabase.auth.token', session.access_token);
        localStorage.setItem('userData', JSON.stringify(userData));
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error refreshing session:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // دالة تسجيل الدخول
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session && data.user) {
        const userData = await loadUserData(data.user);
        if (userData) {
          setUser(userData);
          localStorage.setItem('supabase.auth.token', data.session.access_token);
          localStorage.setItem('userData', JSON.stringify(userData));
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      throw new Error(err.message || 'فشل تسجيل الدخول');
    }
  };

  // دالة تسجيل الخروج
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('userData');
      router.push('/');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  // الاستماع لتغييرات حالة المصادقة
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
          const userData = await loadUserData(session.user);
          if (userData) {
            setUser(userData);
            localStorage.setItem('supabase.auth.token', session.access_token);
            localStorage.setItem('userData', JSON.stringify(userData));
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('userData');
        } else if (event === 'TOKEN_REFRESHED' && session) {
          const userData = await loadUserData(session.user);
          if (userData) {
            setUser(userData);
            localStorage.setItem('supabase.auth.token', session.access_token);
            localStorage.setItem('userData', JSON.stringify(userData));
          }
        }
      }
    );

    // تحميل الجلسة الحالية عند التحميل
    refreshSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // التحقق التلقائي من الجلسة كل دقيقة
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSession();
    }, 60000); // كل دقيقة

    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}