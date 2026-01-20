'use client'

import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
    
    // استمع لتغييرات حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/login')
        } else if (session) {
          setUser(session.user)
        }
      }
    )
    
    return () => subscription.unsubscribe()
  }, [router])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }
      
      setUser(session.user)
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>جاري التحميل...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>مرحباً بك في منصة البارع محمود الديب</h1>
          <p>منصة التعليم التفاعلي</p>
        </div>
        
        <div className="user-info">
          <span>{user?.email}</span>
          <button onClick={handleLogout} className="btn-logout">
            تسجيل الخروج
          </button>
        </div>
      </header>
      
      <main className="dashboard-content">
        <div className="welcome-card">
          <h2>مرحباً {user?.user_metadata?.full_name || 'عزيزي الطالب'}</h2>
          <p>لقد سجلت دخولك بنجاح إلى منصتنا التعليمية</p>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-info">
                <h3>الدروس المتاحة</h3>
                <p className="stat-number">0</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-info">
                <h3>الاختبارات المكتملة</h3>
                <p className="stat-number">0</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">💼</div>
              <div className="stat-info">
                <h3>رصيد النقاط</h3>
                <p className="stat-number">0</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="quick-actions">
          <h3>ابدأ التعلم الآن</h3>
          <div className="actions-grid">
            <button className="action-btn">
              <span className="action-icon">📖</span>
              <span>استعراض الدروس</span>
            </button>
            
            <button className="action-btn">
              <span className="action-icon">🧪</span>
              <span>الاختبارات</span>
            </button>
            
            <button className="action-btn">
              <span className="action-icon">📊</span>
              <span>التقارير</span>
            </button>
            
            <button className="action-btn">
              <span className="action-icon">⚙️</span>
              <span>الإعدادات</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}