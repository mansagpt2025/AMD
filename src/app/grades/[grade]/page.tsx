'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientBrowser } from '@/lib/supabase/sf2-client'
import { 
  Wallet, BookOpen, Clock, Calendar, CheckCircle2, 
  X, CreditCard, Ticket, Loader2, ArrowRight, GraduationCap,
  PlayCircle, Users, Zap, Star, Shield, TrendingUp, Crown,
  Award, Target, Brain, Rocket, Gem, Moon, Sun, Package,
  ShoppingCart, Lock, Unlock, Tag, Percent, Gift, AlertCircle
} from 'lucide-react'
import PurchaseModal from '@/components/packages/PurchaseModal'
import PackageCard from '@/components/packages/PackageCard'
import styles from './GradePage.module.css'

// إضافة viewport في البداية
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// الأنواع المحدثة حسب قاعدة البيانات
interface Package {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  type: 'weekly' | 'monthly' | 'term' | 'offer'
  lecture_count: number
  grade: string
  duration_days: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface UserPackage {
  id: string
  user_id: string
  package_id: string
  purchased_at: string
  expires_at: string
  is_active: boolean
  source: string
  packages: Package
}

// ثيم افتراضي بسيط
const defaultTheme = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#8b5cf6',
  success: '#10b981',
  background: '#ffffff',
  backgroundLight: '#f9fafb',
  text: '#111827',
  border: '#e5e7eb',
  error: '#ef4444'
}

export default function GradePage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClientBrowser()
  
  const gradeSlug = params?.grade as 'first' | 'second' | 'third'
  
  // State
  const [grade, setGrade] = useState<any>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [userPackages, setUserPackages] = useState<UserPackage[]>([])
  const [user, setUser] = useState<any>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Modal State
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)

  // إحصائيات مؤقتة
  const [stats] = useState({
    totalStudents: 1250,
    successRate: 94,
    activeCourses: 42,
    expertTeachers: 25
  })

  // تحميل البيانات
  useEffect(() => {
    if (gradeSlug) {
      fetchData()
      checkUser()
      
      // تحديث تلقائي كل 30 ثانية
      const interval = setInterval(() => {
        if (!loading && !refreshing) {
          refreshUserData()
        }
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [gradeSlug])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // جلب بيانات الصف من جدول grades
      const { data: gradeData, error: gradeError } = await supabase
        .from('grades')
        .select('*')
        .eq('slug', gradeSlug)
        .single()

      if (gradeError) {
        console.warn('Grade not found, using default:', gradeError.message)
        setGrade({ 
          name: gradeSlug === 'first' ? 'الصف الأول الثانوي' : 
                gradeSlug === 'second' ? 'الصف الثاني الثانوي' : 
                'الصف الثالث الثانوي',
          slug: gradeSlug
        })
      } else {
        setGrade(gradeData)
      }

      // جلب الباقات من جدول packages
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .eq('grade', gradeSlug)
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (packagesError) {
        console.error('Error fetching packages:', packagesError)
        throw new Error('فشل تحميل الباقات. حاول تحديث الصفحة.')
      }

      setPackages(packagesData || [])

    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(err.message || 'حدث خطأ في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const checkUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (currentUser) {
        setUser(currentUser)
        
        // جلب رصيد المحفظة من جدول wallets
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', currentUser.id)
          .single()

        if (walletData) setWalletBalance(walletData.balance)

        // محاولة جلب الباقات بطريقة JOIN
        try {
          const { data: userPackagesData, error: packagesError } = await supabase
            .from('user_packages')
            .select(`
              *,
              packages (*)
            `)
            .eq('user_id', currentUser.id)
            .eq('is_active', true)

          if (packagesError) {
            console.warn('JOIN query failed, using alternative:', packagesError.message)
            await fetchUserPackagesAlternative(currentUser.id)
          } else if (userPackagesData) {
            // تصفية الباقات الخاصة بهذا الصف فقط
            const filtered = userPackagesData.filter((up: any) => 
              up.packages?.grade === gradeSlug
            )
            setUserPackages(filtered)
          }
        } catch (joinError) {
          console.warn('Join error, using alternative:', joinError)
          await fetchUserPackagesAlternative(currentUser.id)
        }
      }
    } catch (err) {
      console.error('Error checking user:', err)
    }
  }

  // دالة بديلة لجلب باقات المستخدم
  const fetchUserPackagesAlternative = async (userId: string) => {
    try {
      // أولاً: جلب جميع user_packages الخاصة بالمستخدم
      const { data: userPackagesData, error: upError } = await supabase
        .from('user_packages')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (upError) throw upError

      if (userPackagesData && userPackagesData.length > 0) {
        // جمع معرفات الباقات
        const packageIds = userPackagesData.map((up: any) => up.package_id)
        
        // جلب تفاصيل الباقات من جدول packages
        const { data: packagesData, error: pkgError } = await supabase
          .from('packages')
          .select('*')
          .in('id', packageIds)
          .eq('grade', gradeSlug)

        if (pkgError) throw pkgError

        // دمج البيانات يدوياً
        const mergedData = userPackagesData
          .map((up: any) => ({
            ...up,
            packages: packagesData?.find((p: any) => p.id === up.package_id) || null
          }))
          .filter((up: any) => up.packages !== null)

        setUserPackages(mergedData)
      } else {
        setUserPackages([])
      }
    } catch (err) {
      console.error('Alternative fetch error:', err)
      setUserPackages([])
    }
  }

  // تحديث بيانات المستخدم فقط
  const refreshUserData = async () => {
    if (!user || refreshing) return
    
    setRefreshing(true)
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (currentUser) {
        // تحديث رصيد المحفظة
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', currentUser.id)
          .single()

        if (walletData) setWalletBalance(walletData.balance)

        // تحديث باقات المستخدم
        await fetchUserPackagesAlternative(currentUser.id)
      }
    } catch (err) {
      console.error('Error refreshing user data:', err)
    } finally {
      setRefreshing(false)
    }
  }

  // الدوال المساعدة
  const isPackagePurchased = (packageId: string) => {
    return userPackages.some(up => up.package_id === packageId)
  }

  // تصنيف الباقات
  const purchasedPackages = userPackages
    .filter(up => up.is_active && up.packages)
    .map(up => up.packages)
    .filter((pkg): pkg is Package => pkg !== null)

  const availablePackages = packages.filter(pkg => 
    !userPackages.some(up => up.package_id === pkg.id)
  )

  const weeklyPackages = availablePackages.filter(p => p.type === 'weekly')
  const monthlyPackages = availablePackages.filter(p => p.type === 'monthly')
  const termPackages = availablePackages.filter(p => p.type === 'term')
  const offerPackages = availablePackages.filter(p => p.type === 'offer')

  // معالج الشراء
  const handlePurchaseClick = async (pkg: Package) => {
    if (!user) {
      router.push(`/login?returnUrl=/grades/${gradeSlug}`)
      return
    }
    
    if (isPackagePurchased(pkg.id)) {
      handleEnterPackage(pkg.id)
      return
    }
    
    setSelectedPackage(pkg)
    setShowPurchaseModal(true)
  }

  const handleEnterPackage = (pkgId: string) => {
    // التحقق من وجود الباقة أولاً
    const userPackage = userPackages.find(up => up.package_id === pkgId)
    if (!userPackage) {
      alert('ليس لديك صلاحية للدخول إلى هذه الباقة')
      return
    }
    
    // التحقق من صلاحية الباقة
    const expiresAt = new Date(userPackage.expires_at)
    if (expiresAt < new Date()) {
      alert('انتهت صلاحية هذه الباقة')
      return
    }
    
    // الانتقال إلى الباقة
    router.push(`/grades/${gradeSlug}/packages/${pkgId}`)
  }

  // بعد الشراء الناجح
  const handlePurchaseSuccess = async (purchasedPackageId: string) => {
    try {
      // تحديث فوري للمنظر
      if (selectedPackage) {
        // إضافة الباقة مباشرة إلى userPackages لظهورها فوراً
        const tempUserPackage: UserPackage = {
          id: 'temp-' + Date.now(),
          user_id: user.id,
          package_id: selectedPackage.id,
          purchased_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + (selectedPackage.duration_days || 30) * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          source: 'purchase',
          packages: selectedPackage
        }
        
        setUserPackages(prev => [...prev, tempUserPackage])
        
        // إزالة الباقة من القائمة المتاحة
        setPackages(prev => prev.filter(p => p.id !== selectedPackage.id))
      }

      // إعادة تحميل البيانات للتأكد
      await refreshUserData()
      
      // الانتقال إلى الباقة بعد ثانية
      setTimeout(() => {
        router.push(`/grades/${gradeSlug}/packages/${purchasedPackageId}`)
      }, 1500)
    } catch (error) {
      console.error('Error updating after purchase:', error)
    } finally {
      setShowPurchaseModal(false)
      setSelectedPackage(null)
    }
  }

  // إعادة تحميل البيانات
  const handleRetry = () => {
    fetchData()
    checkUser()
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.loadingSpinner} />
        <p className={styles.loadingText}>جاري تحميل بيانات الصف...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <AlertCircle className={styles.errorIcon} />
          <h3 className={styles.errorTitle}>حدث خطأ</h3>
          <p className={styles.errorMessage}>{error}</p>
          <button 
            onClick={handleRetry}
            className={styles.retryButton}
          >
            <Loader2 className={styles.retryIcon} />
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      
      {/* مؤشر التحديث الخفي */}
      {refreshing && (
        <div className={styles.refreshIndicator}>
          <Loader2 className={styles.refreshSpinner} size={16} />
          <span>جاري تحديث البيانات...</span>
        </div>
      )}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {/* Platform Branding */}
          <div className={styles.platformBranding}>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.platformInfo}
            >
              <h1 className={styles.platformTitle}>الأبــارع محمود الـديــب</h1>
              <p className={styles.platformSubtitle}>منارة العلم والتميز</p>
            </motion.div>

            {user && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={styles.walletContainer}
              >
                <div className={styles.walletInfo}>
                  <Wallet className={styles.walletIcon} />
                  <div>
                    <p className={styles.walletLabel}>رصيد المحفظة</p>
                    <p className={styles.walletBalance}>
                      {walletBalance.toLocaleString()} <span className={styles.walletCurrency}>جنيه</span>
                    </p>
                  </div>
                </div>
                {walletBalance < 100 && (
                  <button 
                    className={styles.addBalanceButton}
                    onClick={() => router.push('/wallet')}
                  >
                    إضافة رصيد
                  </button>
                )}
              </motion.div>
            )}
          </div>

          {/* Grade Title */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.gradeTitle}
          >
            <div className={styles.gradeCard}>
              <div className={styles.gradeIconContainer}>
                <GraduationCap className={styles.gradeIcon} />
              </div>
              <div className={styles.gradeInfo}>
                <h2 className={styles.gradeName}>
                  {grade?.name || (gradeSlug === 'first' ? 'الصف الأول الثانوي' : 
                                 gradeSlug === 'second' ? 'الصف الثاني الثانوي' : 
                                 'الصف الثالث الثانوي')}
                </h2>
                <p className={styles.gradeDescription}>رحلة نحو التميز الأكاديمي</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className={styles.floatingShapes}>
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className={styles.floatingShape}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.sin(i) * 20, 0],
              }}
              transition={{
                duration: Math.random() * 5 + 3,
                repeat: Infinity,
              }}
            />
          ))}
        </div>
      </header>

      {/* Stats */}
      <div className={styles.statsContainer}>
        <div className={styles.statsGrid}>
          {[
            { icon: Users, label: 'طالب متفوق', value: stats.totalStudents, suffix: '+' },
            { icon: TrendingUp, label: 'نسبة النجاح', value: stats.successRate, suffix: '%' },
            { icon: Zap, label: 'دورة نشطة', value: stats.activeCourses, suffix: '+' },
            { icon: Award, label: 'خبير تعليمي', value: stats.expertTeachers, suffix: '+' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={styles.statCard}
            >
              <div className={styles.statContent}>
                <div className={styles.statIconContainer}>
                  <stat.icon className={styles.statIcon} />
                </div>
                <div>
                  <p className={styles.statValue}>
                    {stat.value}{stat.suffix}
                  </p>
                  <p className={styles.statLabel}>{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Section 1: اشتراكاتك */}
        {purchasedPackages.length > 0 && (
          <section className={styles.packagesSection}>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={styles.sectionHeader}
            >
              <div className={styles.sectionIconContainer}>
                <Package className={styles.sectionIcon} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>اشتراكاتك</h2>
                <p className={styles.sectionSubtitle}>الباقات التي قمت بشرائها</p>
              </div>
              <div className={styles.sectionCount}>
                {purchasedPackages.length} باقة
              </div>
            </motion.div>

            <div className={styles.packagesGrid}>
              {purchasedPackages.map((pkg, index) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  index={index}
                  isPurchased={true}
                  onEnter={() => handleEnterPackage(pkg.id)}
                  theme={defaultTheme}
                />
              ))}
            </div>
          </section>
        )}

        {/* Section 2: العروض */}
        {offerPackages.length > 0 && (
          <section className={styles.packagesSection}>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={styles.sectionHeader}
            >
              <div className={styles.sectionIconContainer}>
                <Crown className={styles.sectionIcon} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>عروض VIP حصرية</h2>
                <p className={styles.sectionSubtitle}>فرص ذهبية بخصومات استثنائية</p>
              </div>
              <div className={styles.sectionCount}>
                محدودة
              </div>
            </motion.div>

            <div className={styles.packagesGrid}>
              {offerPackages.map((pkg, index) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  index={index}
                  isPurchased={false}
                  onPurchase={() => handlePurchaseClick(pkg)}
                  theme={defaultTheme}
                  isHighlighted={true}
                />
              ))}
            </div>
          </section>
        )}

        {/* Section 3: الباقات الشهرية والترم */}
        {(monthlyPackages.length > 0 || termPackages.length > 0) && (
          <section className={styles.packagesSection}>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={styles.sectionHeader}
            >
              <div className={styles.sectionIconContainer}>
                <Calendar className={styles.sectionIcon} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>باقات التميز</h2>
                <p className={styles.sectionSubtitle}>برامج تعليمية متكاملة</p>
              </div>
            </motion.div>

            <div className={styles.packagesGrid}>
              {[...monthlyPackages, ...termPackages].map((pkg, index) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  index={index}
                  isPurchased={false}
                  onPurchase={() => handlePurchaseClick(pkg)}
                  theme={defaultTheme}
                />
              ))}
            </div>
          </section>
        )}

        {/* Section 4: الباقات الأسبوعية */}
        {weeklyPackages.length > 0 && (
          <section className={styles.packagesSection}>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={styles.sectionHeader}
            >
              <div className={styles.sectionIconContainer}>
                <Clock className={styles.sectionIcon} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>باقات البداية</h2>
                <p className={styles.sectionSubtitle}>ابدأ رحلتك من اليوم</p>
              </div>
            </motion.div>

            <div className={styles.packagesGrid}>
              {weeklyPackages.map((pkg, index) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  index={index}
                  isPurchased={false}
                  onPurchase={() => handlePurchaseClick(pkg)}
                  theme={defaultTheme}
                />
              ))}
            </div>
          </section>
        )}

        {/* حالة عدم وجود باقات */}
        {packages.length === 0 && purchasedPackages.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.noPackages}
          >
            <BookOpen className={styles.noPackagesIcon} />
            <h3 className={styles.noPackagesTitle}>جاري التحضير</h3>
            <p className={styles.noPackagesText}>يتم إعداد محتوى مميز للصف حالياً</p>
            <p className={styles.noPackagesSubtext}>سيتم إطلاق الباقات قريباً</p>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <Crown className={styles.footerIcon} />
            <span className={styles.footerBrandName}>الابارع محمود الديب</span>
          </div>
          <p className={styles.footerCopyright}>منارة العلم والتميز منذ 2010</p>
          <div className={styles.footerStats}>
            <span>+{stats.totalStudents} طالب متفوق</span>
            <span className={styles.footerSeparator}>•</span>
            <span>{stats.successRate}% نسبة نجاح</span>
            <span className={styles.footerSeparator}>•</span>
            <span>{stats.expertTeachers} خبير تعليمي</span>
          </div>
        </div>
      </footer>

      {/* Purchase Modal */}
      <AnimatePresence>
        {showPurchaseModal && selectedPackage && (
          <PurchaseModal
            package={selectedPackage}
            user={user}
            walletBalance={walletBalance}
            gradeSlug={gradeSlug}
            onClose={() => setShowPurchaseModal(false)}
            onSuccess={handlePurchaseSuccess}
            theme={defaultTheme}
          />
        )}
      </AnimatePresence>
    </div>
  )
}