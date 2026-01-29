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

interface PackageData {
  id: string
  name: string
  description: string | null
  image_url: string | null
  lecture_count: number | null
  duration_days: number | null
  type: string
  grade: string
}

interface UserPackage {
  id: string
  user_id: string
  package_id: string
  is_active: boolean
  purchased_at: string
  expires_at: string | null
  packages: PackageData
}

function ErrorFallback({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">حدث خطأ</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <a 
          href="/login" 
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          العودة لتسجيل الدخول
        </a>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  try {
    // استخدام الدالة المساعدة الجديدة
const supabase = await createClient()
    
    // التحقق من المستخدم
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect('/login')
      return null
    }

    // جلب كل البيانات مرة واحدة بشكل متوازي (أسرع أداء)
    const [
      { data: profile, error: profileError },
      { data: wallet },
      { data: purchasedPackages },
      { count: activePackagesCount },
      { count: completedLecturesCount },
      { data: notifications }
    ] = await Promise.all([
      // 1. الملف الشخصي
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single(),
      
      // 2. المحفظة (اختياري - ما نوقفش الصفحة لو فشل)
      supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle(),
      
      // 3. الباقات المشتراة
      supabase
        .from('user_packages')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true),
      
      // 4. عدد الباقات النشطة
      supabase
        .from('user_packages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true),
      
      // 5. المحاضرات المكتملة
      supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed'),
      
      // 6. الإشعارات
      supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user.id},and(target_grade.eq.${user.id},user_id.is.null)`)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    // التحقق من الملف الشخصي (إجباري)
    if (profileError || !profile) {
      redirect('/complete-profile')
      return null
    }

    // معالجة بيانات الباقات
    let userPackages: UserPackage[] = []
    if (purchasedPackages && purchasedPackages.length > 0) {
      const packageIds = purchasedPackages.map(p => p.package_id)
      const { data: packagesData } = await supabase
        .from('packages')
        .select('*')
        .in('id', packageIds)

      if (packagesData) {
        userPackages = purchasedPackages.map(up => ({
          ...up,
          packages: packagesData.find(p => p.id === up.package_id) || {
            id: up.package_id,
            name: 'باقة غير معروفة',
            description: null,
            image_url: null,
            lecture_count: 0,
            duration_days: 0,
            type: '',
            grade: profile.grade
          }
        })) as UserPackage[]
      }
    }

    // Helper functions
    const getGradeText = (grade: string): string => {
      const grades: Record<string, string> = {
        first: 'الأول الثانوي',
        second: 'الثاني الثانوي',
        third: 'الثالث الثانوي',
      }
      return grades[grade] || grade
    }

    const getPackageTypeText = (type: string): string => {
      const types: Record<string, string> = {
        weekly: 'أسبوعي',
        monthly: 'شهري',
        term: 'ترم',
        offer: 'عرض خاص',
      }
      return types[type] || type
    }

    const getInitials = (fullName: string): string => {
      if (!fullName) return '?'
      return fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
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

    return (
      <div className="dashboard-container">
        {/* Header */}
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
              <Link href="/notifications" className="notification-link" aria-label="الإشعارات">
                <Bell size={20} strokeWidth={2.5} />
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
          {/* Welcome Card */}
          <section className="welcome-card">
            <div className="welcome-content">
              <div className="welcome-text">
                <h2 className="welcome-title">مرحبًا بك، {profile.full_name || 'طالبنا العزيز'}!</h2>
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

          {/* Stats */}
          <section className="stats-section">
            <h3 className="section-title">إحصائياتك</h3>
            <div className="stats-grid">
              <StatCard 
                icon={<Package size={24} />}
                value={activePackagesCount || 0}
                label="الباقات النشطة"
                color="primary"
              />
              <StatCard 
                icon={<BookOpen size={24} />}
                value={completedLecturesCount || 0}
                label="محاضرات مكتملة"
                color="secondary"
              />
              <StatCard 
                icon={<TrendingUp size={24} />}
                value={userPackages.length}
                label="إجمالي المشتريات"
                color="success"
              />
            </div>
          </section>

          {/* Grade Section */}
          <section className="grade-section">
            <div className="grade-card">
              <div className="grade-content">
                <div className="grade-info">
                  <h4>الصف {getGradeText(profile.grade)}</h4>
                  <p>ابدأ رحلتك التعليمية مع باقات مميزة</p>
                </div>
                <Link href={`/grades/${profile.grade}`} className="secondary-button">
                  استعراض الباقات
                </Link>
              </div>
              <div className="grade-illustration">
                <div className="books-stack">
                  <div className="book book-1"></div>
                  <div className="book book-2"></div>
                  <div className="book book-3"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Packages */}
          <section className="packages-section">
            <div className="section-header">
              <h3 className="section-title">الباقات المشتركة</h3>
            </div>
            
            {userPackages.length > 0 ? (
              <div className="packages-grid">
                {userPackages.map((up) => (
                  <PackageCard 
                    key={up.id} 
                    userPackage={up} 
                    grade={profile.grade}
                    getPackageTypeText={getPackageTypeText}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            ) : (
              <EmptyState profileGrade={profile.grade} />
            )}
          </section>
        </main>
      </div>
    )
  } catch (error: any) {
    console.error('Critical Dashboard Error:', error?.message || error)
    return <ErrorFallback message="حدث خطأ غير متوقع في تحميل البيانات" />
  }
}

// المكونات الفرعية
function StatCard({ icon, value, label, color }: { 
  icon: React.ReactNode
  value: number
  label: string
  color: 'primary' | 'secondary' | 'success'
}) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    secondary: 'bg-secondary-50 text-secondary-600',
    success: 'bg-success-light text-success-dark'
  }

  return (
    <div className="stat-card">
      <div className={`stat-icon-wrapper ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="stat-content">
        <h4 className="stat-value">{value}</h4>
        <p className="stat-label">{label}</p>
      </div>
    </div>
  )
}

function PackageCard({ 
  userPackage, 
  grade, 
  getPackageTypeText,
  formatDate 
}: { 
  userPackage: UserPackage
  grade: string
  getPackageTypeText: (t: string) => string
  formatDate: (d: string) => string
}) {
  const pkg = userPackage.packages
  
  return (
    <div className="package-card">
      {pkg?.image_url ? (
        <div className="package-image-container">
          <img 
            src={pkg.image_url} 
            alt={pkg.name || 'Package'}
            className="package-image"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                parent.classList.add('package-image-fallback')
                parent.innerHTML = `<div class="package-image-default"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg><span>${pkg.name || 'باقة'}</span></div>`
              }
            }}
          />
        </div>
      ) : (
        <div className="package-image-default">
          <Package size={48} />
          <span>{pkg?.name || 'باقة تعليمية'}</span>
        </div>
      )}
      
      <div className="package-header">
        <div className="package-badge">{getPackageTypeText(pkg?.type || '')}</div>
        <div className="package-status">
          <span className={`status-indicator ${userPackage.is_active ? 'active' : 'inactive'}`}></span>
          {userPackage.is_active ? 'نشط' : 'غير نشط'}
        </div>
      </div>
      
      <div className="package-content">
        <h4>{pkg?.name || 'باقة غير معروفة'}</h4>
        <p className="package-description">{pkg?.description || 'لا يوجد وصف'}</p>
        
        <div className="package-details">
          <div className="detail-item">
            <BookOpen size={16} />
            <span>{pkg?.lecture_count || 0} محاضرة</span>
          </div>
          <div className="detail-item">
            <Clock size={16} />
            <span>{pkg?.duration_days || 0} يوم</span>
          </div>
        </div>
        
        <div className="package-footer">
          <span className="purchase-date">مشترك منذ {formatDate(userPackage.purchased_at)}</span>
          <Link href={`/grades/${pkg?.grade || grade}/packages/${pkg?.id}`} className="access-button">
            دخول الباقة
          </Link>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ profileGrade }: { profileGrade: string }) {
  return (
    <div className="empty-state">
      <Package size={48} />
      <h4>لا توجد باقات مشتركة</h4>
      <p>ابدأ رحلتك التعليمية بالاشتراك في إحدى باقاتنا</p>
      <Link href={`/grades/${profileGrade}`} className="primary-button">
        استعراض الباقات
      </Link>
    </div>
  )
}