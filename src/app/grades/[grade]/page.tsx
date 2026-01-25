'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { createClientBrowser } from '@/lib/supabase/sf-client'
import { 
  Wallet, 
  BookOpen, 
  Clock, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  X, 
  CreditCard,
  Ticket,
  Loader2,
  ArrowRight,
  GraduationCap,
  PlayCircle
} from 'lucide-react'
import styles from './styles.module.css'

// ================== Types ==================
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
}

interface UserPackage {
  id: string
  package_id: string
  purchased_at: string
  expires_at: string
  is_active: boolean
  packages: Package
}

interface Grade {
  id: string
  name: string
  slug: string
}

// ================== Animation Variants ==================
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  }
}

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 20
    }
  },
  hover: {
    scale: 1.03,
    y: -10,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25
    }
  }
}

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 50 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: { duration: 0.2 }
  }
}

// ================== Page ==================
export default function GradePage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClientBrowser()
  
  const gradeSlug = params?.grade as string

  // State
  const [grade, setGrade] = useState<Grade | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [userPackages, setUserPackages] = useState<UserPackage[]>([])
  const [user, setUser] = useState<any>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal State
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'code'>('wallet')
  const [codeInput, setCodeInput] = useState('')
  const [purchaseError, setPurchaseError] = useState('')
  const [purchaseSuccess, setPurchaseSuccess] = useState('')
  const [isPurchasing, setIsPurchasing] = useState(false)

  // ================== Load Data ==================
  useEffect(() => {
    if (gradeSlug) {
      fetchData()
      checkUser() // نحتفظ بجلب بيانات المستخدم لو كان مسجل دخول، لكن مش شرط
    }
  }, [gradeSlug])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: gradeData, error: gradeError } = await supabase
        .from('grades')
        .select('*')
        .eq('slug', gradeSlug)
        .maybeSingle()

      if (gradeError) throw new Error('خطأ في تحميل بيانات الصف')
      setGrade(gradeData)

      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .eq('grade', gradeSlug)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (packagesError) throw new Error('خطأ في تحميل الباقات')
      setPackages(packagesData || [])

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const checkUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (currentUser) {
        setUser(currentUser)
        // Fetch Wallet
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', currentUser.id)
          .maybeSingle()

        if (walletData) setWalletBalance(walletData.balance)

        // Fetch User Packages
        const { data: userPackagesData } = await supabase
          .from('user_packages')
          .select(`*, packages (*)`)
          .eq('user_id', currentUser.id)
          .eq('is_active', true)

        if (userPackagesData) {
          const filtered = userPackagesData.filter((up: any) => up.packages?.grade === gradeSlug)
          setUserPackages(filtered)
        }
      }
    } catch (err) {
      console.error('Error checking user:', err)
    }
  }

  // ================== Purchase Handlers ==================
  const handlePurchaseClick = (pkg: Package) => {
    if (!user) {
      // لو مش مسجل دخول، نوديه لصفحة تسجيل الدخول مع العودة للصفحة الحالية
      router.push(`/login?returnUrl=/grades/${gradeSlug}`)
      return
    }
    setSelectedPackage(pkg)
    setPaymentMethod('wallet')
    setCodeInput('')
    setPurchaseError('')
    setPurchaseSuccess('')
    setShowPurchaseModal(true)
  }

  const handlePurchase = async () => {
    if (!selectedPackage || !user) return
    
    setIsPurchasing(true)
    setPurchaseError('')

    try {
      if (paymentMethod === 'wallet') {
        if (walletBalance < selectedPackage.price) {
          throw new Error('رصيد المحفظة غير كافٍ')
        }

        const response = await fetch('/api/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packageId: selectedPackage.id,
            userId: user.id,
            paymentMethod: 'wallet'
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'فشل الشراء')
        }

        setPurchaseSuccess('تم الشراء بنجاح! 🎉')
        setWalletBalance(prev => prev - selectedPackage.price)
        await checkUser()
        
        setTimeout(() => setShowPurchaseModal(false), 2000)

      } else {
        if (!codeInput.trim()) throw new Error('يرجى إدخال الكود')

        const response = await fetch('/api/validate-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: codeInput,
            packageId: selectedPackage.id,
            userId: user.id
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'كود غير صالح')
        }

        setPurchaseSuccess('تم التفعيل بنجاح! 🎉')
        await checkUser()
        setTimeout(() => setShowPurchaseModal(false), 2000)
      }
    } catch (err: any) {
      setPurchaseError(err.message)
    } finally {
      setIsPurchasing(false)
    }
  }

  const isPackagePurchased = (packageId: string) => {
    return userPackages.some(up => up.package_id === packageId)
  }

  // ================== Loading State ==================
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={styles.loadingContent}
        >
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>جاري تحميل البيانات...</p>
        </motion.div>
      </div>
    )
  }

  // ================== Error State ==================
  if (error || !grade) {
    return (
      <div className={styles.errorContainer}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.errorCard}
        >
          <div className={styles.errorIcon}>
            <X className="w-10 h-10 text-red-400" />
          </div>
          <h2 className={styles.errorTitle}>عذراً</h2>
          <p className={styles.errorMessage}>{error || 'الصف غير موجود'}</p>
          <button 
            onClick={() => router.push('/')}
            className={styles.backButton}
          >
            العودة للرئيسية
          </button>
        </motion.div>
      </div>
    )
  }

  // ================== Main Content ==================
  const weeklyPackages = packages.filter(p => p.type === 'weekly')
  const monthlyPackages = packages.filter(p => p.type === 'monthly')
  const termPackages = packages.filter(p => p.type === 'term')
  const offerPackages = packages.filter(p => p.type === 'offer')

  return (
    <div className={styles.container}>
      {/* Background Effects */}
      <div className={styles.bgEffects}>
        <div className={`${styles.bgOrb} ${styles.bgOrb1}`}></div>
        <div className={`${styles.bgOrb} ${styles.bgOrb2}`}></div>
      </div>

      <div className={styles.content}>
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.header}
        >
          <div className={styles.headerContent}>
            <motion.div 
              className={styles.headerTitle}
              whileHover={{ scale: 1.02 }}
            >
              <div className={styles.iconWrapper}>
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={styles.title}>{grade.name}</h1>
                <p className={styles.subtitle}>اختر باقتك وابدأ رحلة التعلم</p>
              </div>
            </motion.div>

            {user && (
              <motion.div 
                className={styles.walletBadge}
                whileHover={{ scale: 1.05 }}
              >
                <Wallet className="w-5 h-5 text-purple-400" />
                <div>
                  <p className={styles.walletLabel}>رصيدك</p>
                  <p className={styles.walletAmount}>{walletBalance} جنيه</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.header>

        {/* Main Content */}
        <main className={styles.main}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={styles.sections}
          >
            {/* Offers Section */}
            {offerPackages.length > 0 && (
              <section className={styles.section}>
                <motion.div variants={itemVariants} className={styles.sectionHeader}>
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  <h2 className={`${styles.sectionTitle} ${styles.gradientText}`}>
                    عروض خاصة محدودة
                  </h2>
                </motion.div>
                <div className={styles.grid}>
                  {offerPackages.map((pkg, index) => (
                    <PackageCard 
                      key={pkg.id} 
                      pkg={pkg} 
                      index={index}
                      isPurchased={isPackagePurchased(pkg.id)}
                      onPurchase={() => handlePurchaseClick(pkg)}
                      onEnter={() => router.push(`/grades/${gradeSlug}/packages/${pkg.id}`)}
                      highlight={true}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Term Packages */}
            {termPackages.length > 0 && (
              <section className={styles.section}>
                <motion.div variants={itemVariants} className={styles.sectionHeader}>
                  <BookOpen className="w-6 h-6 text-blue-400" />
                  <h2 className={styles.sectionTitle}>باقات الترم الكامل</h2>
                </motion.div>
                <div className={styles.grid}>
                  {termPackages.map((pkg, index) => (
                    <PackageCard 
                      key={pkg.id} 
                      pkg={pkg} 
                      index={index}
                      isPurchased={isPackagePurchased(pkg.id)}
                      onPurchase={() => handlePurchaseClick(pkg)}
                      onEnter={() => router.push(`/grades/${gradeSlug}/packages/${pkg.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Monthly Packages */}
            {monthlyPackages.length > 0 && (
              <section className={styles.section}>
                <motion.div variants={itemVariants} className={styles.sectionHeader}>
                  <Calendar className="w-6 h-6 text-green-400" />
                  <h2 className={styles.sectionTitle}>الباقات الشهرية</h2>
                </motion.div>
                <div className={styles.grid}>
                  {monthlyPackages.map((pkg, index) => (
                    <PackageCard 
                      key={pkg.id} 
                      pkg={pkg} 
                      index={index}
                      isPurchased={isPackagePurchased(pkg.id)}
                      onPurchase={() => handlePurchaseClick(pkg)}
                      onEnter={() => router.push(`/grades/${gradeSlug}/packages/${pkg.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Weekly Packages */}
            {weeklyPackages.length > 0 && (
              <section className={styles.section}>
                <motion.div variants={itemVariants} className={styles.sectionHeader}>
                  <Clock className="w-6 h-6 text-purple-400" />
                  <h2 className={styles.sectionTitle}>الباقات الأسبوعية</h2>
                </motion.div>
                <div className={styles.grid}>
                  {weeklyPackages.map((pkg, index) => (
                    <PackageCard 
                      key={pkg.id} 
                      pkg={pkg} 
                      index={index}
                      isPurchased={isPackagePurchased(pkg.id)}
                      onPurchase={() => handlePurchaseClick(pkg)}
                      onEnter={() => router.push(`/grades/${gradeSlug}/packages/${pkg.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {packages.length === 0 && (
              <motion.div 
                variants={itemVariants}
                className={styles.emptyState}
              >
                <div className={styles.emptyIcon}>
                  <BookOpen className="w-12 h-12 text-gray-400" />
                </div>
                <p className={styles.emptyText}>لا توجد باقات متاحة حالياً</p>
              </motion.div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Purchase Modal */}
      <AnimatePresence>
        {showPurchaseModal && selectedPackage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            onClick={() => setShowPurchaseModal(false)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={styles.modal}
              onClick={e => e.stopPropagation()}
            >
              {purchaseSuccess ? (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={styles.successContainer}
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" as const, stiffness: 200 }}
                    className={styles.successIcon}
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </motion.div>
                  <h3 className={styles.successTitle}>تهانينا!</h3>
                  <p className={styles.successMessage}>{purchaseSuccess}</p>
                </motion.div>
              ) : (
                <>
                  <div className={styles.modalHeader}>
                    <div>
                      <h3 className={styles.modalTitle}>{selectedPackage.name}</h3>
                      <p className={styles.modalPrice}>{selectedPackage.price} جنيه</p>
                    </div>
                    <button 
                      onClick={() => setShowPurchaseModal(false)}
                      className={styles.closeButton}
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  <div className={styles.paymentMethods}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethod('wallet')}
                      className={`${styles.paymentMethod} ${paymentMethod === 'wallet' ? styles.paymentMethodActive : ''}`}
                    >
                      <CreditCard className={`w-6 h-6 ${paymentMethod === 'wallet' ? 'text-purple-400' : 'text-gray-400'}`} />
                      <div className={styles.paymentMethodInfo}>
                        <p className={styles.paymentMethodTitle}>الدفع من المحفظة</p>
                        <p className={styles.paymentMethodSubtitle}>رصيدك: {walletBalance} جنيه</p>
                      </div>
                      {paymentMethod === 'wallet' && <div className={styles.checkIndicator}></div>}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethod('code')}
                      className={`${styles.paymentMethod} ${paymentMethod === 'code' ? styles.paymentMethodActive : ''}`}
                    >
                      <Ticket className={`w-6 h-6 ${paymentMethod === 'code' ? 'text-purple-400' : 'text-gray-400'}`} />
                      <div className={styles.paymentMethodInfo}>
                        <p className={styles.paymentMethodTitle}>كود تفعيل</p>
                        <p className={styles.paymentMethodSubtitle}>أدخل كود الشراء</p>
                      </div>
                      {paymentMethod === 'code' && <div className={styles.checkIndicator}></div>}
                    </motion.button>
                  </div>

                  {paymentMethod === 'code' && (
                    <motion.input
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      type="text"
                      placeholder="أدخل كود التفعيل هنا"
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value)}
                      className={styles.codeInput}
                    />
                  )}

                  {purchaseError && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={styles.errorBanner}
                    >
                      <X className="w-5 h-5" />
                      {purchaseError}
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePurchase}
                    disabled={isPurchasing}
                    className={styles.confirmButton}
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        جاري المعالجة...
                      </>
                    ) : (
                      <>
                        تأكيد الشراء
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ================== Package Card Component ==================
function PackageCard({ 
  pkg, 
  index,
  isPurchased, 
  onPurchase, 
  onEnter,
  highlight = false
}: { 
  pkg: Package
  index: number
  isPurchased: boolean
  onPurchase?: () => void
  onEnter?: () => void
  highlight?: boolean
}) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      transition={{ delay: index * 0.1 }}
      className={`${styles.card} ${highlight ? styles.cardHighlight : ''} ${isPurchased ? styles.cardPurchased : ''}`}
    >
      {highlight && (
        <div className={styles.badge}>
          <Sparkles className="w-3 h-3" />
          عرض خاص
        </div>
      )}

      {isPurchased && (
        <div className={styles.purchasedOverlay}>
          <div className={styles.purchasedBadge}>
            <CheckCircle2 className="w-5 h-5" />
            تم الشراء
          </div>
        </div>
      )}

      <div className={styles.cardImage}>
        {pkg.image_url ? (
          <img 
            src={pkg.image_url} 
            alt={pkg.name}
            className={styles.image}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <BookOpen className="w-16 h-16 text-white/50" />
          </div>
        )}
        <div className={styles.imageOverlay}></div>
      </div>

      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{pkg.name}</h3>
        <p className={styles.cardDescription}>{pkg.description}</p>

        <div className={styles.cardMeta}>
          <div className={styles.metaItem}>
            <PlayCircle className="w-4 h-4 text-purple-400" />
            <span>{pkg.lecture_count} محاضرة</span>
          </div>
          <div className={styles.metaItem}>
            <Clock className="w-4 h-4 text-purple-400" />
            <span>{pkg.duration_days} يوم</span>
          </div>
        </div>

        <div className={styles.cardFooter}>
          <div>
            <p className={styles.priceLabel}>السعر</p>
            <p className={`${styles.price} ${highlight ? styles.priceHighlight : ''}`}>
              {pkg.price} <span className={styles.currency}>جنيه</span>
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isPurchased ? onEnter : onPurchase}
            className={`${styles.actionButton} ${isPurchased ? styles.enterButton : highlight ? styles.offerButton : styles.buyButton}`}
          >
            {isPurchased ? (
              <>
                دخول
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                اشترك الآن
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}