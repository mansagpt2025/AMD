'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientBrowser } from '@/lib/supabase/sf2-client'
import { 
  Wallet, BookOpen, Clock, Calendar, Loader2, GraduationCap,
  Users, Zap, TrendingUp, Award, Crown, Package,
  AlertCircle, CheckCircle2, PlayCircle, ArrowRight,
  ShoppingCart, X, CreditCard, Ticket
} from 'lucide-react'
import styles from './GradePage.module.css'

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

// مكون بسيط لعرض الباقات
const SimplePackageCard = ({ 
  pkg, 
  isPurchased,
  onEnter,
  onPurchase
}: { 
  pkg: Package, 
  isPurchased: boolean,
  onEnter?: () => void,
  onPurchase?: () => void
}) => {
  return (
    <div className={styles.packageCard}>
      <div className={styles.packageHeader}>
        <h3 className={styles.packageName}>{pkg.name}</h3>
        {pkg.type === 'offer' && (
          <span className={styles.offerBadge}>عرض خاص</span>
        )}
      </div>
      
      <p className={styles.packageDescription}>{pkg.description}</p>
      
      <div className={styles.packageDetails}>
        <div className={styles.packageDetail}>
          <PlayCircle size={16} />
          <span>{pkg.lecture_count} محاضرة</span>
        </div>
        <div className={styles.packageDetail}>
          <Clock size={16} />
          <span>{pkg.duration_days} يوم</span>
        </div>
      </div>
      
      <div className={styles.packagePrice}>
        <span className={styles.price}>{pkg.price.toLocaleString()} جنيه</span>
        {pkg.type === 'offer' && (
          <span className={styles.originalPrice}>
            {(pkg.price * 1.2).toLocaleString()} جنيه
          </span>
        )}
      </div>
      
      {isPurchased ? (
        <button 
          className={styles.enterButton}
          onClick={onEnter}
        >
          <ArrowRight size={16} />
          دخول إلى الباقة
        </button>
      ) : (
        <button 
          className={styles.purchaseButton}
          onClick={onPurchase}
        >
          <ShoppingCart size={16} />
          اشترك الآن
        </button>
      )}
    </div>
  )
}

// مكون بسيط لل modal
const SimplePurchaseModal = ({
  pkg,
  onClose,
  onConfirm
}: {
  pkg: Package,
  onClose: () => void,
  onConfirm: () => void
}) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>تأكيد الشراء</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.modalPackageInfo}>
            <h4>{pkg.name}</h4>
            <p>{pkg.description}</p>
            <div className={styles.modalDetails}>
              <div className={styles.modalDetail}>
                <CheckCircle2 size={16} />
                <span>{pkg.lecture_count} محاضرة</span>
              </div>
              <div className={styles.modalDetail}>
                <CheckCircle2 size={16} />
                <span>صلاحية {pkg.duration_days} يوم</span>
              </div>
              <div className={styles.modalDetail}>
                <CheckCircle2 size={16} />
                <span>مناسب للصف {pkg.grade}</span>
              </div>
            </div>
          </div>
          
          <div className={styles.modalPrice}>
            <span>السعر: </span>
            <span className={styles.modalPriceValue}>
              {pkg.price.toLocaleString()} جنيه
            </span>
          </div>
          
          <div className={styles.paymentOptions}>
            <button className={styles.walletPayment}>
              <Wallet size={18} />
              الدفع من المحفظة
            </button>
            <button className={styles.cardPayment}>
              <CreditCard size={18} />
              بطاقة ائتمان
            </button>
          </div>
        </div>
        
        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={onClose}>
            إلغاء
          </button>
          <button className={styles.confirmButton} onClick={onConfirm}>
            تأكيد الشراء
          </button>
        </div>
      </div>
    </div>
  )
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
    }
  }, [gradeSlug])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // بيانات الصف
      setGrade({ 
        name: gradeSlug === 'first' ? 'الصف الأول الثانوي' : 
              gradeSlug === 'second' ? 'الصف الثاني الثانوي' : 
              'الصف الثالث الثانوي',
        slug: gradeSlug
      })

      // محاولة جلب الباقات من Supabase
      try {
        const { data: packagesData, error: packagesError } = await supabase
          .from('packages')
          .select('*')
          .eq('grade', gradeSlug)
          .eq('is_active', true)
          .order('price', { ascending: true })

        if (packagesError) {
          console.error('Error fetching packages:', packagesError)
          // استخدام بيانات وهمية إذا فشل الاتصال
          createDummyPackages()
        } else {
          setPackages(packagesData || [])
        }
      } catch (supabaseError) {
        console.error('Supabase error:', supabaseError)
        createDummyPackages()
      }

    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(err.message || 'حدث خطأ في تحميل البيانات')
      createDummyPackages()
    } finally {
      setLoading(false)
    }
  }

  const createDummyPackages = () => {
    const dummyPackages: Package[] = [
      {
        id: '1',
        name: 'الباقة الأسبوعية',
        description: 'وصف الباقة الأسبوعية المميزة',
        price: 100,
        image_url: '',
        type: 'weekly',
        lecture_count: 10,
        grade: gradeSlug,
        duration_days: 7,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'الباقة الشهرية',
        description: 'وصف الباقة الشهرية المتكاملة',
        price: 300,
        image_url: '',
        type: 'monthly',
        lecture_count: 40,
        grade: gradeSlug,
        duration_days: 30,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'عرض VIP',
        description: 'عرض خاص بخصم 50%',
        price: 500,
        image_url: '',
        type: 'offer',
        lecture_count: 60,
        grade: gradeSlug,
        duration_days: 90,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
    setPackages(dummyPackages)
  }

  const checkUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (currentUser) {
        setUser(currentUser)
        
        // بيانات وهمية للمحفظة
        setWalletBalance(1500)
        
        // بيانات وهمية للباقات المشتراة
        const dummyUserPackages: UserPackage[] = [
          {
            id: 'user-1',
            user_id: currentUser.id,
            package_id: '1',
            purchased_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true,
            source: 'purchase',
            packages: {
              id: '1',
              name: 'الباقة الشهرية',
              description: 'وصف الباقة الشهرية المتكاملة',
              price: 300,
              image_url: '',
              type: 'monthly',
              lecture_count: 40,
              grade: gradeSlug,
              duration_days: 30,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          }
        ]
        setUserPackages(dummyUserPackages)
      }
    } catch (err) {
      console.error('Error checking user:', err)
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
    router.push(`/grades/${gradeSlug}/packages/${pkgId}`)
  }

  // بعد الشراء الناجح
  const handlePurchaseSuccess = async () => {
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
      
      // الانتقال إلى الباقة بعد ثانية
      setTimeout(() => {
        router.push(`/grades/${gradeSlug}/packages/${selectedPackage.id}`)
      }, 1000)
    }
    
    setShowPurchaseModal(false)
    setSelectedPackage(null)
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
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
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
              {purchasedPackages.map((pkg) => (
                <SimplePackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isPurchased={true}
                  onEnter={() => handleEnterPackage(pkg.id)}
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
              {offerPackages.map((pkg) => (
                <SimplePackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isPurchased={false}
                  onPurchase={() => handlePurchaseClick(pkg)}
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
              {[...monthlyPackages, ...termPackages].map((pkg) => (
                <SimplePackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isPurchased={false}
                  onPurchase={() => handlePurchaseClick(pkg)}
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
              {weeklyPackages.map((pkg) => (
                <SimplePackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isPurchased={false}
                  onPurchase={() => handlePurchaseClick(pkg)}
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
          <SimplePurchaseModal
            pkg={selectedPackage}
            onClose={() => setShowPurchaseModal(false)}
            onConfirm={handlePurchaseSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  )
}