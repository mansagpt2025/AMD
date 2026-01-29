import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Bell, BookOpen, Clock, Package, TrendingUp, Award } from 'lucide-react'
import './dashboard.css'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'لوحة التحكم | محمود الديب',
  description: 'لوحة تحكم الطالب',
}

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

interface UserPackage {
  id: string;
  user_id: string;
  package_id: string;
  is_active: boolean;
  purchased_at: string;
  expires_at: string | null;
  source: string | null;
  packages: PackageData;
}

export default async function DashboardPage() {
  try {
    // الحصول على cookies بشكل آمن
    const cookieStore = await cookies()
    
    // إنشاء supabase client مع معالجة cookies بشكل صحيح
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // في Server Components نحن لا نستطيع تعيين cookies مباشرة
            // لكن نحتاج لتمرير الدالة لـ createServerClient
            try {
              cookieStore.set(name, value, options)
            } catch (error) {
              // تجاهل خطأ cookies في القراءة فقط
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set(name, '', { ...options, maxAge: 0 })
            } catch (error) {
              // تجاهل خطأ cookies في القراءة فقط
            }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect('/login')
    }

    // =========================
    // PROFILE
    // =========================
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile error:', profileError?.message)
      // إذا لم يوجد profile، نحاول إنشاء redirect لصفحة إكمال الملف الشخصي
      redirect('/complete-profile')
    }

    // =========================
    // WALLET
    // =========================
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle()

    // =========================
    // PURCHASED PACKAGES
    // =========================
    let userPackages: UserPackage[] = []
    
    try {
      const { data: purchasedPackages } = await supabase
        .from('user_packages')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (purchasedPackages && purchasedPackages.length > 0) {
        const packageIds = purchasedPackages.map(p => p.package_id)
        const { data: packagesData } = await supabase
          .from('packages')
          .select('*')
          .in('id', packageIds)

        if (packagesData) {
          userPackages = purchasedPackages.map(up => {
            const pkg = packagesData.find(p => p.id === up.package_id)
            return {
              ...up,
              packages: pkg || {
                id: up.package_id,
                name: 'باقة غير معروفة',
                description: null,
                image_url: null,
                lecture_count: 0,
                duration_days: 0,
                type: '',
                grade: ''
              }
            } as UserPackage
          })
        }
      }
    } catch (packagesError) {
      console.error('Packages fetch error:', packagesError)
    }

    // =========================
    // STATISTICS
    // =========================
    let activePackagesCount = 0
    let completedLecturesCount = 0

    try {
      const { count: activeCount } = await supabase
        .from('user_packages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true)
      
      activePackagesCount = activeCount || 0
    } catch (e) { console.error('Active count error:', e) }

    try {
      const { count: completedCount } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed')
      
      completedLecturesCount = completedCount || 0
    } catch (e) { console.error('Progress count error:', e) }

    // =========================
    // NOTIFICATIONS
    // =========================
    let userNotifications: any[] = []
    
    try {
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user.id},and(target_grade.eq.${profile.grade},user_id.is.null)`)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5)
      
      userNotifications = notifications || []
    } catch (notifError) {
      console.error('Notifications error:', notifError)
    }

    // Helpers
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
                <p className="platform-description">
                  معلم لغة عربية للثانوية العامة
                </p>
              </div>
            </div>

            <div className="header-right">
              <Link 
                href="/notifications" 
                className="notification-link"
                aria-label="الإشعارات"
              >
                <Bell size={20} strokeWidth={2.5} />
                {userNotifications && userNotifications.length > 0 && (
                  <span className="notification-badge">{userNotifications.length}</span>
                )}
              </Link>
              <div className="user-profile-card">
                <div className="user-info">
                  <p className="user-name">{profile.full_name}</p>
                  <p className="user-grade">
                    الصف {getGradeText(profile.grade)}
                  </p>
                </div>
                <div className="user-avatar">
                  <span>{getInitials(profile.full_name)}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="main-content">
          {/* Welcome Card */}
          <div className="welcome-card">
            <div className="welcome-content">
              <div className="welcome-text">
                <h2 className="welcome-title">
                   مرحبًا بك،  {profile.full_name}!
                </h2>
                <p className="welcome-subtitle">
                  استمر في رحلتك التعليمية وحقق أهدافك
                </p>

                <div className="welcome-actions">
                  <div className="wallet-balance">
                    <span className="balance-label"> رصيد المحفظة : </span>
                    <span className="balance-amount">
                      {wallet?.balance ?? 0} ج.م
                    </span>
                  </div>
                </div>
              </div>

              <div className="welcome-emoji">
                <Award size={64} />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-section">
            <h3 className="section-title">إحصائياتك</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper bg-primary-50">
                  <Package size={24} />
                </div>
                <div className="stat-content">
                  <h4 className="stat-value">{activePackagesCount}</h4>
                  <p className="stat-label">الباقات النشطة</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper bg-secondary-50">
                  <BookOpen size={24} />
                </div>
                <div className="stat-content">
                  <h4 className="stat-value">{completedLecturesCount}</h4>
                  <p className="stat-label">محاضرات مكتملة</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper bg-success">
                  <TrendingUp size={24} />
                </div>
                <div className="stat-content">
                  <h4 className="stat-value">{userPackages.length}</h4>
                  <p className="stat-label">إجمالي المشتريات</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grade Section */}
          <div className="grade-section">
            <div className="grade-card">
              <div className="grade-content">
                <div className="grade-info">
                  <h4>الصف {getGradeText(profile.grade)}</h4>
                  <p>ابدأ رحلتك التعليمية مع باقات مميزة </p>
                </div>
                <Link 
                  href={`/grades/${profile.grade}`}
                  className="secondary-button"
                >
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
          </div>

          {/* Packages */}
          <div className="packages-section">
            <div className="section-header">
              <h3 className="section-title">الباقات المشتركة</h3>
            </div>
            
            {userPackages.length > 0 ? (
              <div className="packages-grid">
                {userPackages.map((userPackage) => (
                  <div key={userPackage.id} className="package-card">
                    {userPackage.packages?.image_url ? (
                      <div className="package-image-container">
                        <img 
                          src={userPackage.packages.image_url} 
                          alt={userPackage.packages.name}
                          className="package-image"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                              parent.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:180px;background:linear-gradient(135deg, #eef2ff, #e0e7ff);color:#6366f1;"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg><span style="margin-top:8px;font-weight:700;">${userPackage.packages.name || 'باقة تعليمية'}</span></div>`;
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="package-image-default">
                        <Package size={48} />
                        <span>{userPackage.packages?.name || 'باقة تعليمية'}</span>
                      </div>
                    )}
                    
                    <div className="package-header">
                      <div className="package-badge">
                        {getPackageTypeText(userPackage.packages?.type || '')}
                      </div>
                      <div className="package-status">
                        <span className={`status-indicator ${userPackage.is_active ? 'active' : 'inactive'}`}></span>
                        {userPackage.is_active ? 'نشط' : 'غير نشط'}
                      </div>
                    </div>
                    
                    <div className="package-content">
                      <h4>{userPackage.packages?.name || 'باقة غير معروفة'}</h4>
                      <p className="package-description">
                        {userPackage.packages?.description || 'لا يوجد وصف'}
                      </p>
                      
                      <div className="package-details">
                        <div className="detail-item">
                          <BookOpen size={16} />
                          <span>{userPackage.packages?.lecture_count || 0} محاضرة</span>
                        </div>
                        <div className="detail-item">
                          <Clock size={16} />
                          <span>{userPackage.packages?.duration_days || 0} يوم</span>
                        </div>
                      </div>
                      
                      <div className="package-footer">
                        <span className="purchase-date">
                          مشترك منذ {formatDate(userPackage.purchased_at)}
                        </span>
                        <Link
                          href={`/grades/${userPackage.packages?.grade || profile.grade}/packages/${userPackage.packages?.id}`}
                          className="access-button"
                        >
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
          </div>
        </main>
      </div>
    )
  } catch (error: any) {
    console.error('Dashboard critical error:', error)
    // في حالة وجود خطأ حقيقي، نحول للـ login
    redirect('/login')
  }
}