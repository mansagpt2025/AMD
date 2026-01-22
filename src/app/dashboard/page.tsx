// app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/supabase-server'
import type { Metadata } from 'next'
import './dashboard.css'

// إضافة Viewport بشكل صحيح
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

// إضافة Metadata
export const metadata: Metadata = {
  title: 'لوحة التحكم | محمود الديب',
  description: 'لوحة تحكم الطالب',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // استخدام getUser بدلاً من getSession
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // جلب بيانات المستخدم
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // جلب رصيد المحفظة
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  // جلب الباقات المشتراة
  const { data: purchasedPackages } = await supabase
    .from('user_packages')
    .select(`
      *,
      packages (*)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (!profile) {
    redirect('/complete-profile')
  }

  // دالة مساعدة للحصول على نص الصف
  const getGradeText = (grade: string): string => {
    const grades: Record<string, string> = {
      first: 'الأول الثانوي',
      second: 'الثاني الثانوي',
      third: 'الثالث الثانوي'
    }
    return grades[grade] || grade
  }

  // دالة للحصول على الأحرف الأولى من الاسم
  const getInitials = (fullName: string): string => {
    return fullName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="dashboard-container">
      {/* الهيدر */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-container">
              <span className="logo-text">م</span>
            </div>
            <div className="header-text">
              <h1 className="platform-name">محمود الديب</h1>
              <p className="platform-description">التعليم التفاعلي للثانوية العامة</p>
            </div>
          </div>
          
          <div className="user-profile-card">
            <div className="user-info">
              <p className="user-name">{profile.full_name}</p>
              <p className="user-grade">الصف {getGradeText(profile.grade)}</p>
            </div>
            <div className="user-avatar">
              <span>{getInitials(profile.full_name)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="main-content">
        {/* بطاقة الترحيب */}
        <div className="welcome-card">
          <div className="welcome-content">
            <div className="welcome-text">
              <h2 className="welcome-title">مرحباً بك، {profile.full_name}!</h2>
              <p className="welcome-subtitle">استعد لرحلة التفوق مع أفضل المدرسين</p>
              
              <div className="welcome-actions">
                <div className="wallet-balance">
                  <span className="balance-label">رصيد المحفظة:</span>
                  <span className="balance-amount">{wallet?.balance || 0} ج.م</span>
                </div>
                
                <Link 
                  href={`/grades/${profile.grade}`}
                  className="primary-button"
                >
                  عرض الباقات →
                </Link>
              </div>
            </div>
            
            <div className="welcome-emoji">
              🎓
            </div>
          </div>
        </div>

        <div className="grid-layout">
          {/* العمود الأيسر */}
          <div className="left-column">
            {/* بطاقات الإحصائيات */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <div>
                    <p className="stat-title">الباقات المشتراة</p>
                    <p className="stat-value">{purchasedPackages?.length || 0}</p>
                  </div>
                  <div className="stat-icon packages">
                    📦
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div>
                    <p className="stat-title">المحاضرات المكتملة</p>
                    <p className="stat-value text-success">0</p>
                  </div>
                  <div className="stat-icon completed">
                    ✅
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <div>
                    <p className="stat-title">الساعات الدراسية</p>
                    <p className="stat-value text-warning">0</p>
                  </div>
                  <div className="stat-icon hours">
                    ⏱️
                  </div>
                </div>
              </div>
            </div>

            {/* الباقات المشتراة */}
            <div className="packages-section">
              <div className="section-header">
                <h3 className="section-title">اشتراكاتك النشطة</h3>
                <Link 
                  href={`/grades/${profile.grade}`}
                  className="view-all-link"
                >
                  عرض الكل →
                </Link>
              </div>

              {purchasedPackages && purchasedPackages.length > 0 ? (
                <div className="packages-list">
                  {purchasedPackages.slice(0, 3).map((up: any) => (
                    <div 
                      key={up.id}
                      className="package-item"
                    >
                      <div className="package-info">
                        <div className="package-icon">
                          <span>ب</span>
                        </div>
                        <div className="package-details">
                          <h4 className="package-name">{up.packages.name}</h4>
                          <p className="package-description">{up.packages.description}</p>
                        </div>
                      </div>
                      <div className="package-status">
                        <p className="status-active text-success">مفعلة</p>
                        <p className="status-expiry">ينتهي في 30 يوم</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📚</div>
                  <p className="empty-text">لا توجد باقات مشتركة بعد</p>
                  <Link
                    href={`/grades/${profile.grade}`}
                    className="secondary-button"
                  >
                    ابدأ بالاشتراك الآن
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* العمود الأيمن */}
          <div className="right-column">
            {/* بطاقة الصف الدراسي */}
            <div className="grade-card">
              <h3 className="grade-title">صفك الدراسي</h3>
              <div className="grade-display">
                <div className="grade-icon">🎯</div>
                <h4 className="grade-name">
                  {getGradeText(profile.grade)}
                </h4>
                <p className="grade-description">عام دراسي مميز بانتظارك</p>
                <Link
                  href={`/grades/${profile.grade}`}
                  className="secondary-button"
                >
                  دخول الصف
                </Link>
              </div>
            </div>

            {/* الإجراءات السريعة */}
            <div className="quick-actions">
              <h3 className="actions-title">إجراءات سريعة</h3>
              <div className="actions-list">
                <Link
                  href={`/grades/${profile.grade}`}
                  className="action-item primary"
                >
                  <span className="action-text">شراء باقة جديدة</span>
                  <span className="action-arrow">→</span>
                </Link>
                <Link
                  href="/profile"
                  className="action-item"
                >
                  <span className="action-text">تعديل الملف الشخصي</span>
                  <span className="action-arrow">→</span>
                </Link>
                <Link
                  href="/support"
                  className="action-item"
                >
                  <span className="action-text">الدعم الفني</span>
                  <span className="action-arrow">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}