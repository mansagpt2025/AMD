'use client'

import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)

  useEffect(() => {
    checkUser()
    
    // استمع لتغييرات حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/login')
        } else if (session) {
          setUser(session.user)
          loadUserData(session.user.id)
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
      await loadUserData(session.user.id)
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadUserData = async (userId: string) => {
    try {
      // جلب بيانات الملف الشخصي
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (profileData) {
        setProfile(profileData)
      }

      // جلب بيانات المحفظة
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (walletData) {
        setWallet(walletData)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
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
          <h2>مرحباً {profile?.full_name || 'عزيزي الطالب'}</h2>
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
                <p className="stat-number">{wallet?.balance || 0}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="user-details">
          <h3>معلوماتك الشخصية</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">البريد الإلكتروني:</span>
              <span className="detail-value">{user?.email}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">الاسم الكامل:</span>
              <span className="detail-value">{profile?.full_name || 'غير محدد'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">الصف الدراسي:</span>
              <span className="detail-value">{profile?.grade || 'غير محدد'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">رقم الهاتف:</span>
              <span className="detail-value">{profile?.student_phone || 'غير محدد'}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}