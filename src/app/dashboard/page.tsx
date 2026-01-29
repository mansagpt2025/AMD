import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Bell, BookOpen, Clock, Package, TrendingUp, Award } from 'lucide-react'
import './dashboard.css'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'لوحة التحكم | محمود الديب',
  description: 'لوحة تحكم الطالب',
}

// Types
interface PackageData {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  lecture_count: number | null;
  duration_days: number | null;
  type: string;
  grade: string;
}

interface UserPackageData {
  id: string;
  user_id: string;
  package_id: string;
  is_active: boolean;
  purchased_at: string;
  packages: PackageData;
}

export default async function DashboardPage() {
  // 1. التحقق من الإعدادات أولاً
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('ENV ERROR: Missing Supabase env vars')
    return (
      <div style={{ padding: 50, textAlign: 'center' }}>
        <h1>خطأ في الإعدادات</h1>
        <p>متغيرات البيئة غير مكتملة</p>
      </div>
    )
  }

  try {
    // 2. إنشاء Client (✅ صححت الـ try/catch هنا)
    let supabase
    try {
      supabase = await createClient()
    } catch (e: any) {
      console.error('CLIENT ERROR:', e.message)
      return <ErrorDisplay message="فشل في إنشاء اتصال Supabase" />
    }

    // 3. التحقق من المستخدم
    let user
    try {
      const { data, error } = await supabase.auth.getUser()
      if (error) throw error
      if (!data.user) {
        redirect('/login')
        return null
      }
      user = data.user
    } catch (e: any) {
      console.error('AUTH ERROR:', e.message)
      redirect('/login')
      return null
    }

    // 4. جلب البيانات
    let profile = null
    let wallet = { balance: 0 }
    let userPackages: UserPackageData[] = []
    let activePackagesCount = 0
    let completedLecturesCount = 0
    let notifications: any[] = []

    // جلب الملف الشخصي
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('PROFILE DB ERROR:', error.message)
        if (error.code === 'PGRST116') {
          redirect('/complete-profile')
          return null
        }
        throw error
      }
      profile = data
    } catch (e: any) {
      console.error('PROFILE FETCH ERROR:', e.message)
      return <ErrorDisplay message={`خطأ في جلب الملف الشخصي: ${e.message}`} />
    }

    // جلب المحفظة (اختياري)
    try {
      const { data } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) wallet = data
    } catch (e: any) {
      console.error('WALLET ERROR:', e.message)
    }

    // جلب الباقات (✅ صححت الـ types هنا)
    try {
      const { data: purchased } = await supabase
        .from('user_packages')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (purchased && purchased.length > 0) {
        const ids = purchased.map((p: any) => p.package_id)
        const { data: packages } = await supabase
          .from('packages')
          .select('*')
          .in('id', ids)
        
        if (packages) {
          userPackages = purchased.map((up: any) => ({
            ...up,
            packages: packages.find((p: any) => p.id === up.package_id) || {
              id: up.package_id,
              name: 'باقة غير معروفة',
              description: null,
              image_url: null,
              lecture_count: 0,
              duration_days: 0,
              type: '',
              grade: profile.grade
            }
          }))
        }
      }
    } catch (e: any) {
      console.error('PACKAGES ERROR:', e.message)
    }

    // الإحصائيات
    try {
      const { count } = await supabase
        .from('user_packages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true)
      if (count !== null) activePackagesCount = count
    } catch (e) {}

    try {
      const { count } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed')
      if (count !== null) completedLecturesCount = count
    } catch (e) {}

    // الإشعارات
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user.id},and(target_grade.eq.${profile?.grade},user_id.is.null)`)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5)
      if (data) notifications = data
    } catch (e: any) {
      console.error('NOTIFICATIONS ERROR:', e.message)
    }

    // Helper functions
    const getGradeText = (grade: string) => {
      const grades: Record<string, string> = {
        first: 'الأول الثانوي',
        second: 'الثاني الثانوي',
        third: 'الثالث الثانوي',
      }
      return grades[grade] || grade
    }

    const getPackageTypeText = (type: string) => {
      const types: Record<string, string> = {
        weekly: 'أسبوعي',
        monthly: 'شهري',
        term: 'ترم',
        offer: 'عرض خاص',
      }
      return types[type] || type
    }

    const getInitials = (fullName: string) => {
      if (!fullName) return '?'
      return fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    }

    const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return 'تاريخ غير صالح'
        return date.toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      } catch (e) {
        return 'تاريخ غير معروف'
      }
    }

    // Render
    return (
      <div className="dashboard-container" style={{ direction: 'rtl' }}>
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <div className="logo-container">
                <span className="logo-text">MD</span>
              </div>
              <div className="header-text">
                <h1 className="platform-name">محمود الديب</h1>
                <p className="platform-description">معلم لغة عربية للثانوية العامة</p>
              </div>
            </div>

            <div className="header-right">
              <Link href="/notifications" className="notification-link">
                <Bell size={20} />
                {notifications && notifications.length > 0 && (
                  <span className="notification-badge">{notifications.length}</span>
                )}
              </Link>
              <div className="user-profile-card">
                <div className="user-info">
                  <p className="user-name">{profile.full_name || 'مستخدم'}</p>
                  <p className="user-grade">الصف {getGradeText(profile.grade)}</p>
                </div>
                <div className="user-avatar">
                  <span>{getInitials(profile.full_name || 'مستخدم')}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="main-content">
          <section className="welcome-card">
            <div className="welcome-content">
              <div className="welcome-text">
                <h2 className="welcome-title">
                  مرحبًا بك، {profile.full_name || 'طالبنا العزيز'}!
                </h2>
                <p className="welcome-subtitle">استمر في رحلتك التعليمية وحقق أهدافك</p>
                
                <div className="welcome-actions">
                  <div className="wallet-balance">
                    <span className="balance-label">رصيد المحفظة:</span>
                    <span className="balance-amount">{wallet?.balance ?? 0} ج.م</span>
                  </div>
                </div>
              </div>
              <div className="welcome-emoji">
                <Award size={64} />
              </div>
            </div>
          </section>

          <section className="stats-section">
            <h3 className="section-title">إحصائياتك</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper bg-primary-50 text-primary-600">
                  <Package size={24} />
                </div>
                <div className="stat-content">
                  <h4 className="stat-value">{activePackagesCount}</h4>
                  <p className="stat-label">الباقات النشطة</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon-wrapper bg-secondary-50 text-secondary-600">
                  <BookOpen size={24} />
                </div>
                <div className="stat-content">
                  <h4 className="stat-value">{completedLecturesCount}</h4>
                  <p className="stat-label">محاضرات مكتملة</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon-wrapper bg-success-light text-success-dark">
                  <TrendingUp size={24} />
                </div>
                <div className="stat-content">
                  <h4 className="stat-value">{userPackages.length}</h4>
                  <p className="stat-label">إجمالي المشتريات</p>
                </div>
              </div>
            </div>
          </section>

          <section className="packages-section">
            <div className="section-header">
              <h3 className="section-title">الباقات المشتركة</h3>
            </div>
            
            {userPackages.length > 0 ? (
              <div className="packages-grid">
                {userPackages.map((up: UserPackageData) => (
                  <div key={up.id} className="package-card">
                    <div className="package-header">
                      <div className="package-badge">{getPackageTypeText(up.packages?.type || '')}</div>
                      <div className="package-status">
                        <span className={`status-indicator ${up.is_active ? 'active' : 'inactive'}`}></span>
                        {up.is_active ? 'نشط' : 'غير نشط'}
                      </div>
                    </div>
                    
                    <div className="package-content">
                      <h4>{up.packages?.name || 'باقة غير معروفة'}</h4>
                      <p className="package-description">{up.packages?.description || 'لا يوجد وصف'}</p>
                      
                      <div className="package-details">
                        <div className="detail-item">
                          <BookOpen size={16} />
                          <span>{up.packages?.lecture_count || 0} محاضرة</span>
                        </div>
                        <div className="detail-item">
                          <Clock size={16} />
                          <span>{up.packages?.duration_days || 0} يوم</span>
                        </div>
                      </div>
                      
                      <div className="package-footer">
                        <span className="purchase-date">مشترك منذ {formatDate(up.purchased_at)}</span>
                        <Link href={`/grades/${up.packages?.grade || profile.grade}/packages/${up.packages?.id}`} className="access-button">
                          دخول الباقة
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Package size={48} />
                <h4>لا توجد باقات مشتركة</h4>
                <p>ابدأ رحلتك التعليمية بالاشتراك في إحدى باقاتنا</p>
                <Link href={`/grades/${profile.grade}`} className="primary-button">
                  استعراض الباقات
                </Link>
              </div>
            )}
          </section>
        </main>
      </div>
    )
    
  } catch (error: any) {
    console.error('FATAL ERROR:', error)
    return <ErrorDisplay message={`خطأ جسيم: ${error?.message || 'غير معروف'}`} />
  }
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f9fafb',
      padding: '20px',
      direction: 'rtl'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '16px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
        <h2 style={{ color: '#1f2937', marginBottom: '10px' }}>حدث خطأ</h2>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>{message}</p>
        <a 
          href="/login" 
          style={{ 
            display: 'inline-block', 
            background: '#4f46e5', 
            color: 'white', 
            padding: '12px 24px', 
            borderRadius: '8px', 
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          العودة لتسجيل الدخول
        </a>
      </div>
    </div>
  )
}