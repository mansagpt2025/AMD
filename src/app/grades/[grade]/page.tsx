'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientBrowser } from '@/lib/supabase/sf-client'
import { 
  Wallet, BookOpen, Clock, Calendar, Loader2, GraduationCap,
  Users, Zap, TrendingUp, Award, Crown, Package,
  AlertCircle, CheckCircle2, PlayCircle, ArrowRight,
  ShoppingCart, X, CreditCard
} from 'lucide-react'
import styles from './GradePage.module.css'

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
  
  const [grade, setGrade] = useState<any>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [userPackages, setUserPackages] = useState<UserPackage[]>([])
  const [user, setUser] = useState<any>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)

  const [stats] = useState({
    totalStudents: 1250,
    successRate: 94,
    activeCourses: 42,
    expertTeachers: 25
  })

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

        // جلب باقات المستخدم المشتراة مع تفاصيل الباقة
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

  const handlePurchaseSuccess = async () => {
    if (!user?.id || !selectedPackage) {
      setShowPurchaseModal(false)
      return
    }
    
    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + (selectedPackage.duration_days || 30))
      
      const { data: newUserPackage, error: insertError } = await supabase
        .from('user_packages')
        .insert({
          user_id: user.id,
          package_id: selectedPackage.id,
          purchased_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true,
          source: 'purchase'
        })
        .select(`
          *,
          packages:package_id (*)
        `)
        .single()

      if (insertError) throw insertError

      if (newUserPackage) {
        setUserPackages(prev => [...prev, newUserPackage as UserPackage])
      }
      
      setPackages(prev => prev.filter(p => p.id !== selectedPackage.id))
      setShowPurchaseModal(false)
      setSelectedPackage(null)
      
      setTimeout(() => {
        router.push(`/grades/${gradeSlug}/packages/${selectedPackage.id}`)
      }, 1000)
      
    } catch (err) {
      console.error('Error purchasing package:', err)
      alert('حدث خطأ أثناء الشراء، يرجى المحاولة مرة أخرى')
    }
  }

  const handleRetry = () => {
    fetchData()
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
          <button onClick={handleRetry} className={styles.retryButton}>
            <Loader2 className={styles.retryIcon} />
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
          <div className={styles.platformBranding}>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={styles.platformInfo}>
              <h1 className={styles.platformTitle}>الأبــارع محمود الـديــب</h1>
              <p className={styles.platformSubtitle}>منارة العلم والتميز</p>
            </motion.div>

            {user && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={styles.walletContainer}>
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
                  <button className={styles.addBalanceButton} onClick={() => router.push('/wallet')}>
                    إضافة رصيد
                  </button>
                )}
              </motion.div>
            )}
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={styles.gradeTitle}>
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

      <div className={styles.statsContainer}>
        <div className={styles.statsGrid}>
          {[
            { icon: Users, label: 'طالب متفوق', value: stats.totalStudents, suffix: '+' },
            { icon: TrendingUp, label: 'نسبة النجاح', value: stats.successRate, suffix: '%' },
            { icon: Zap, label: 'دورة نشطة', value: stats.activeCourses, suffix: '+' },
            { icon: Award, label: 'خبير تعليمي', value: stats.expertTeachers, suffix: '+' },
          ].map((stat, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className={styles.statCard}>
              <div className={styles.statContent}>
                <div className={styles.statIconContainer}>
                  <stat.icon className={styles.statIcon} />
                </div>
                <div>
                  <p className={styles.statValue}>{stat.value}{stat.suffix}</p>
                  <p className={styles.statLabel}>{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <main className={styles.mainContent}>
        {purchasedPackages.length > 0 && (
          <section className={styles.packagesSection}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={styles.sectionHeader}>
              <div className={styles.sectionIconContainer}>
                <Package className={styles.sectionIcon} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>اشتراكاتك</h2>
                <p className={styles.sectionSubtitle}>الباقات التي قمت بشرائها</p>
              </div>
              <div className={styles.sectionCount}>{purchasedPackages.length} باقة</div>
            </motion.div>

            <div className={styles.packagesGrid}>
              {purchasedPackages.map((pkg) => (
                <SimplePackageCard key={pkg.id} pkg={pkg} isPurchased={true} onEnter={() => handleEnterPackage(pkg.id)} />
              ))}
            </div>
          </section>
        )}

        {offerPackages.length > 0 && (
          <section className={styles.packagesSection}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={styles.sectionHeader}>
              <div className={styles.sectionIconContainer}>
                <Crown className={styles.sectionIcon} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>عروض VIP حصرية</h2>
                <p className={styles.sectionSubtitle}>فرص ذهبية بخصومات استثنائية</p>
              </div>
              <div className={styles.sectionCount}>محدودة</div>
            </motion.div>

            <div className={styles.packagesGrid}>
              {offerPackages.map((pkg) => (
                <SimplePackageCard key={pkg.id} pkg={pkg} isPurchased={false} onPurchase={() => handlePurchaseClick(pkg)} />
              ))}
            </div>
          </section>
        )}

        {(monthlyPackages.length > 0 || termPackages.length > 0) && (
          <section className={styles.packagesSection}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={styles.sectionHeader}>
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
                <SimplePackageCard key={pkg.id} pkg={pkg} isPurchased={false} onPurchase={() => handlePurchaseClick(pkg)} />
              ))}
            </div>
          </section>
        )}

        {weeklyPackages.length > 0 && (
          <section className={styles.packagesSection}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={styles.sectionHeader}>
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
                <SimplePackageCard key={pkg.id} pkg={pkg} isPurchased={false} onPurchase={() => handlePurchaseClick(pkg)} />
              ))}
            </div>
          </section>
        )}

        {packages.length === 0 && purchasedPackages.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={styles.noPackages}>
            <BookOpen className={styles.noPackagesIcon} />
            <h3 className={styles.noPackagesTitle}>لا توجد باقات متاحة</h3>
            <p className={styles.noPackagesText}>سيتم إضافة باقات جديدة قريباً</p>
          </motion.div>
        )}
      </main>

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