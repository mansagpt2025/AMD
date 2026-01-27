'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientBrowser } from '@/lib/supabase/sf-client'
import { 
  Wallet, BookOpen, Clock, Calendar, Loader2, GraduationCap,
  Users, Zap, TrendingUp, Award, Crown, Package,
  AlertCircle, CheckCircle2, PlayCircle, ArrowRight,
  ShoppingCart, X, CreditCard, Ticket
} from 'lucide-react'
import styles from './GradePage.module.css'
import PurchaseModal from '@/components/packages/PurchaseModal'

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

const PackageCard = ({ 
  pkg, 
  isPurchased,
  onEnter,
  onPurchase,
  theme
}: { 
  pkg: Package, 
  isPurchased: boolean,
  onEnter?: () => void,
  onPurchase?: () => void,
  theme?: any
}) => {
  const getTypeLabel = () => {
    switch (pkg.type) {
      case 'weekly': return 'أسبوعي'
      case 'monthly': return 'شهري'
      case 'term': return 'ترم كامل'
      case 'offer': return 'عرض خاص'
      default: return 'خاص'
    }
  }

  const getTypeColor = () => {
    switch (pkg.type) {
      case 'weekly': return '#3b82f6'
      case 'monthly': return '#8b5cf6'
      case 'term': return '#10b981'
      case 'offer': return '#f59e0b'
      default: return '#6366f1'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -8 }}
      className={styles.packageCard}
    >
      {isPurchased && (
        <div 
          className={styles.purchasedBadge}
          style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
        >
          <CheckCircle2 size={16} />
          <span>مشترك</span>
        </div>
      )}

      {pkg.type === 'offer' && !isPurchased && (
        <div 
          className={styles.offerBadge}
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
        >
          <Crown size={16} />
          <span>عرض خاص</span>
        </div>
      )}

      <div className={styles.imageWrapper}>
        {pkg.image_url ? (
          <img src={pkg.image_url} alt={pkg.name} className={styles.packageImage} />
        ) : (
          <div 
            className={styles.imagePlaceholder}
            style={{ background: `linear-gradient(135deg, ${getTypeColor()}40, ${getTypeColor()}20)` }}
          >
            <BookOpen size={40} color={getTypeColor()} />
          </div>
        )}
        <div 
          className={styles.typeBadge}
          style={{ background: getTypeColor() }}
        >
          {getTypeLabel()}
        </div>
      </div>

      <div className={styles.cardContent}>
        <h3 className={styles.packageName}>{pkg.name}</h3>
        <p className={styles.packageDescription}>{pkg.description || ''}</p>

        <div className={styles.packageStats}>
          <div className={styles.stat}>
            <PlayCircle size={16} />
            <span>{pkg.lecture_count || 0} محاضرة</span>
          </div>
          <div className={styles.stat}>
            <Clock size={16} />
            <span>{pkg.duration_days || 30} يوم</span>
          </div>
        </div>

        <div className={styles.priceSection}>
          <div className={styles.price}>
            <span className={styles.amount}>{(pkg.price || 0).toLocaleString()}</span>
            <span className={styles.currency}>جنيه</span>
          </div>
        </div>

        <button
          onClick={isPurchased ? onEnter : onPurchase}
          className={`${styles.actionButton} ${isPurchased ? styles.enterBtn : styles.purchaseBtn}`}
          style={isPurchased ? { background: '#10b981' } : { background: getTypeColor() }}
        >
          {isPurchased ? (
            <>
              <ArrowRight size={16} />
              دخول للباقة
            </>
          ) : (
            <>
              <ShoppingCart size={16} />
              اشترك الآن
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}

export default function GradePage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClientBrowser()
  
  const gradeSlug = params?.grade as 'first' | 'second' | 'third'
  
  const [grade, setGrade] = useState<any>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [userPackages, setUserPackages] = useState<UserPackage[]>([])
  const [user, setUser] = useState<any>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)

  const theme = {
    primary: '#3b82f6',
    accent: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    text: '#1f2937'
  }

  const stats = {
    totalStudents: 1250,
    successRate: 94,
    activeCourses: 42,
    expertTeachers: 25
  }

  useEffect(() => {
    if (gradeSlug) {
      fetchData()
    }
  }, [gradeSlug])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // جلب بيانات الصف
      const { data: gradeData } = await supabase
        .from('grades')
        .select('*')
        .eq('slug', gradeSlug)
        .single()

      setGrade(gradeData || { 
        name: gradeSlug === 'first' ? 'الصف الأول الثانوي' : 
              gradeSlug === 'second' ? 'الصف الثاني الثانوي' : 
              'الصف الثالث الثانوي',
        slug: gradeSlug
      })

      // جلب الباقات المتاحة
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .eq('grade', gradeSlug)
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (packagesError) throw packagesError
      setPackages(packagesData || [])

      // التحقق من المستخدم
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (currentUser) {
        setUser(currentUser)
        
        // جلب رصيد المحفظة
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', currentUser.id)
          .single()
        
        if (walletData) setWalletBalance(walletData.balance || 0)

        // جلب باقات المستخدم المشتراة
        const { data: userPackagesData, error: userPackagesError } = await supabase
          .from('user_packages')
          .select(`
            *,
            packages:package_id (*)
          `)
          .eq('user_id', currentUser.id)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())

        if (userPackagesError) throw userPackagesError
        
        const validUserPackages = (userPackagesData || []).filter((up: any) => up.packages !== null)
        setUserPackages(validUserPackages as UserPackage[])
      }

    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(err.message || 'حدث خطأ في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const isPackagePurchased = (packageId: string) => {
    return userPackages.some(up => up.package_id === packageId)
  }

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

  const handlePurchaseClick = (pkg: Package) => {
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

  const handlePurchaseSuccess = (packageId: string) => {
    fetchData()
    setTimeout(() => {
      router.push(`/grades/${gradeSlug}/packages/${packageId}`)
    }, 1000)
  }

  const handleRetry = () => {
    fetchData()
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.loadingSpinner} />
        <p className={styles.loadingText}>جاري تحميل البيانات...</p>
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
          <button onClick={handleRetry} className={styles.retryButton}>
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={styles.platformInfo}>
            <h1 className={styles.platformTitle}>الأبــارع محمود الـديــب</h1>
            <p className={styles.platformSubtitle}>منارة العلم والتميز</p>
            <p className={styles.encouragement}>🌟 رحلتك نحو التميز تبدأ من هنا</p>
          </motion.div>

          {user && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={styles.walletCard}>
              <Wallet className={styles.walletIcon} />
              <div>
                <p className={styles.walletLabel}>رصيد المحفظة</p>
                <p className={styles.walletBalance}>
                  {walletBalance.toLocaleString()} <span>جنيه</span>
                </p>
              </div>
              {walletBalance < 100 && (
                <button 
                  className={styles.addBalanceBtn}
                  onClick={() => router.push('/wallet')}
                >
                  إضافة رصيد
                </button>
              )}
            </motion.div>
          )}
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={styles.gradeCard}>
          <GraduationCap className={styles.gradeIcon} />
          <div>
            <h2 className={styles.gradeName}>
              {grade?.name || (gradeSlug === 'first' ? 'الصف الأول الثانوي' : 
                             gradeSlug === 'second' ? 'الصف الثاني الثانوي' : 
                             'الصف الثالث الثانوي')}
            </h2>
            <p className={styles.gradeDesc}>رحلة نحو التميز الأكاديمي</p>
          </div>
        </motion.div>
      </header>

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
              <stat.icon className={styles.statIcon} />
              <div>
                <p className={styles.statValue}>{stat.value}{stat.suffix}</p>
                <p className={styles.statLabel}>{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <main className={styles.mainContent}>
        {/* القسم الأول: اشتراكاتك */}
        {purchasedPackages.length > 0 && (
          <section className={styles.section}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={styles.sectionHeader}>
              <Package className={styles.sectionIcon} />
              <div>
                <h2 className={styles.sectionTitle}>اشتراكاتك</h2>
                <p className={styles.sectionSubtitle}>الباقات التي قمت بشرائها</p>
              </div>
              <span className={styles.badge}>{purchasedPackages.length}</span>
            </motion.div>

            <div className={styles.packagesGrid}>
              {purchasedPackages.map((pkg) => (
                <PackageCard 
                  key={pkg.id} 
                  pkg={pkg} 
                  isPurchased={true} 
                  onEnter={() => handleEnterPackage(pkg.id)}
                  theme={theme}
                />
              ))}
            </div>
          </section>
        )}

        {/* القسم الثاني: العروض VIP */}
        {offerPackages.length > 0 && (
          <section className={`${styles.section} ${styles.offerSection}`}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={styles.sectionHeader}>
              <Crown className={styles.sectionIcon} />
              <div>
                <h2 className={styles.sectionTitle}>عروض VIP حصرية</h2>
                <p className={styles.sectionSubtitle}>فرص ذهبية بخصومات استثنائية</p>
              </div>
              <span className={styles.badge}>محدودة</span>
            </motion.div>

            <div className={styles.packagesGrid}>
              {offerPackages.map((pkg) => (
                <PackageCard 
                  key={pkg.id} 
                  pkg={pkg} 
                  isPurchased={false} 
                  onPurchase={() => handlePurchaseClick(pkg)}
                  theme={theme}
                />
              ))}
            </div>
          </section>
        )}

        {/* القسم الثالث: باقات التميز (شهرية و ترم) */}
        {(monthlyPackages.length > 0 || termPackages.length > 0) && (
          <section className={`${styles.section} ${styles.premiumSection}`}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={styles.sectionHeader}>
              <Calendar className={styles.sectionIcon} />
              <div>
                <h2 className={styles.sectionTitle}>باقات التميز</h2>
                <p className={styles.sectionSubtitle}>برامج تعليمية متكاملة</p>
              </div>
            </motion.div>

            <div className={styles.packagesGrid}>
              {[...monthlyPackages, ...termPackages].map((pkg) => (
                <PackageCard 
                  key={pkg.id} 
                  pkg={pkg} 
                  isPurchased={false} 
                  onPurchase={() => handlePurchaseClick(pkg)}
                  theme={theme}
                />
              ))}
            </div>
          </section>
        )}

        {/* القسم الرابع: باقات البداية (أسبوعية) */}
        {weeklyPackages.length > 0 && (
          <section className={`${styles.section} ${styles.starterSection}`}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={styles.sectionHeader}>
              <Clock className={styles.sectionIcon} />
              <div>
                <h2 className={styles.sectionTitle}>باقات البداية</h2>
                <p className={styles.sectionSubtitle}>ابدأ رحلتك من اليوم</p>
              </div>
            </motion.div>

            <div className={styles.packagesGrid}>
              {weeklyPackages.map((pkg) => (
                <PackageCard 
                  key={pkg.id} 
                  pkg={pkg} 
                  isPurchased={false} 
                  onPurchase={() => handlePurchaseClick(pkg)}
                  theme={theme}
                />
              ))}
            </div>
          </section>
        )}

        {/* رسالة عدم توفر الباقات */}
        {packages.length === 0 && purchasedPackages.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={styles.emptyState}>
            <BookOpen className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>لا توجد باقات متاحة</h3>
            <p className={styles.emptyText}>سيتم إضافة باقات جديدة قريباً</p>
          </motion.div>
        )}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <Crown className={styles.footerIcon} />
            <span>الابارع محمود الديب</span>
          </div>
          <p className={styles.footerCopyright}>منارة العلم والتميز منذ 2010</p>
          <div className={styles.footerStats}>
            <span>+{stats.totalStudents} طالب متفوق</span>
            <span className={styles.separator}>•</span>
            <span>{stats.successRate}% نسبة نجاح</span>
            <span className={styles.separator}>•</span>
            <span>{stats.expertTeachers} خبير تعليمي</span>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showPurchaseModal && selectedPackage && (
          <PurchaseModal
            package={selectedPackage}
            user={user}
            walletBalance={walletBalance}
            gradeSlug={gradeSlug}
            onClose={() => setShowPurchaseModal(false)}
            onSuccess={handlePurchaseSuccess}
            theme={theme}
          />
        )}
      </AnimatePresence>
    </div>
  )
}