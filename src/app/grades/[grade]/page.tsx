'use client'

import { useState, useEffect, useRef } from 'react'
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
  PlayCircle,
  Users,
  Zap,
  Star,
  Shield,
  TrendingUp
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
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
}

const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 20
    }
  },
  hover: {
    scale: 1.03,
    y: -10,
    rotateX: 5,
    rotateY: 5,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
}

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 50 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 50,
    transition: { duration: 0.2 }
  }
}

// الأنيميشن المعدلة مع Types الصحيحة
const floatAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut" as const
  }
}

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut" as const
  }
}

// ================== Particle Background Component ==================
const ParticleBackground = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    size: Math.random() * 8 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5
  }))

  return (
    <div className={styles.particleSystem}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={styles.particle}
          initial={{ x: `${particle.x}%`, y: `${particle.y}%` }}
          animate={{
            x: [`${particle.x}%`, `${particle.x + 10}%`, `${particle.x}%`],
            y: [`${particle.y}%`, `${particle.y - 15}%`, `${particle.y}%`],
            rotate: 360
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "linear",
            delay: particle.delay
          }}
          style={{
            width: particle.size,
            height: particle.size,
            background: particle.id % 3 === 0 
              ? 'var(--primary-400)' 
              : particle.id % 3 === 1 
                ? 'var(--accent-400)' 
                : 'var(--primary-200)',
            opacity: 0.15
          }}
        />
      ))}
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
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePosition({ x, y })
  }

  const getPackageIcon = () => {
    switch (pkg.type) {
      case 'weekly': return <Clock className="w-4 h-4" />
      case 'monthly': return <Calendar className="w-4 h-4" />
      case 'term': return <BookOpen className="w-4 h-4" />
      case 'offer': return <Sparkles className="w-4 h-4" />
      default: return <Star className="w-4 h-4" />
    }
  }

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      transition={{ delay: index * 0.1 }}
      className={`${styles.card} ${highlight ? styles.cardHighlight : ''} ${isPurchased ? styles.cardPurchased : ''}`}
      onMouseMove={handleMouseMove}
      style={{
        '--mouse-x': `${mousePosition.x}%`,
        '--mouse-y': `${mousePosition.y}%`,
      } as React.CSSProperties}
    >
      {highlight && (
        <div className={styles.cardBadge}>
          <Sparkles className="w-3 h-3" />
          عرض خاص محدود
        </div>
      )}

      <div className={styles.typeBadge}>
        {getPackageIcon()}
        <span>{pkg.type === 'weekly' ? 'أسبوعي' : 
               pkg.type === 'monthly' ? 'شهري' : 
               pkg.type === 'term' ? 'ترم كامل' : 'عرض خاص'}</span>
      </div>

      {isPurchased && (
        <div className={`${styles.purchasedOverlay} ${isPurchased ? styles.active : ''}`}>
          <motion.div 
            className={styles.purchasedBadge}
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: -5 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>تم الشراء</span>
          </motion.div>
        </div>
      )}

      <div className={styles.cardImage}>
        {pkg.image_url ? (
          <img 
            src={pkg.image_url} 
            alt={pkg.name}
            className={styles.image}
            loading="lazy"
          />
        ) : (
          <motion.div 
            className={styles.imagePlaceholder}
            animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
            transition={{ duration: 10, repeat: Infinity }}
          >
            <GraduationCap className="w-16 h-16 text-white/50" />
          </motion.div>
        )}
        <div className={styles.imageOverlay}></div>
      </div>

      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{pkg.name}</h3>
        <p className={styles.cardDescription}>{pkg.description}</p>

        <div className={styles.cardMeta}>
          <div className={styles.metaItem}>
            <div className={styles.metaIcon}>
              <PlayCircle className="w-4 h-4 text-primary-400" />
            </div>
            <span>{pkg.lecture_count} محاضرة</span>
          </div>
          <div className={styles.metaItem}>
            <div className={styles.metaIcon}>
              <Clock className="w-4 h-4 text-accent-400" />
            </div>
            <span>{pkg.duration_days} يوم</span>
          </div>
          <div className={styles.metaItem}>
            <div className={styles.metaIcon}>
              <Shield className="w-4 h-4 text-success-500" />
            </div>
            <span>ضمان الاسترجاع</span>
          </div>
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.priceInfo}>
            <p className={styles.priceLabel}>السعر</p>
            <p className={`${styles.price} ${highlight ? styles.priceHighlight : ''}`}>
              {pkg.price} <span className={styles.currency}>جنيه</span>
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isPurchased ? onEnter : onPurchase}
            className={`${styles.actionButton} ${
              isPurchased ? styles.enterButton : 
              highlight ? styles.offerButton : 
              styles.buyButton
            }`}
            disabled={isPurchased}
          >
            {isPurchased ? (
              <>
                <span>دخول للمحاضرات</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>اشترك الآن</span>
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    transition: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ================== Page Component ==================
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

  // Stats
  const [stats, setStats] = useState({
    totalStudents: 1250,
    successRate: 94,
    activeCourses: 42
  })

  // ================== Load Data ==================
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
      const { data: gradeData, error: gradeError } = await supabase
        .from('grades')
        .select('*')
        .eq('slug', gradeSlug)
        .maybeSingle()

      if (gradeError) throw new Error('خطأ في تحميل بيانات الصف')
      if (!gradeData) throw new Error('الصف غير موجود')
      setGrade(gradeData)

      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .eq('grade', gradeSlug)
        .eq('is_active', true)
        .order('price', { ascending: true })

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
          <motion.div
            className={styles.loadingSpinner}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p
            className={styles.loadingText}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            جاري تحميل بيانات الصف...
          </motion.p>
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
            <X className="w-10 h-10 text-error-500" />
          </div>
          <h2 className={styles.errorTitle}>عذراً</h2>
          <p className={styles.errorMessage}>{error || 'الصف غير موجود'}</p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/')}
            className={styles.backButton}
          >
            العودة للرئيسية
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // ================== Filter Packages ==================
  const weeklyPackages = packages.filter(p => p.type === 'weekly')
  const monthlyPackages = packages.filter(p => p.type === 'monthly')
  const termPackages = packages.filter(p => p.type === 'term')
  const offerPackages = packages.filter(p => p.type === 'offer')

  return (
    <div className={styles.container}>
      {/* Background Effects */}
      <div className={styles.bgEffects}>
        <div className={styles.animatedLines} />
        <div className={styles.gridDots} />
        <ParticleBackground />
      </div>

      <div className={styles.content}>
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
          className={styles.header}
        >
          <div className={styles.headerContent}>
            <motion.div 
              className={styles.headerTitle}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className={styles.gradeIcon}
                animate={{
                  y: [0, -10, 0],
                  transition: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
              >
                <GraduationCap className="w-8 h-8 text-white" />
              </motion.div>
              <div className={styles.titleWrapper}>
                <h1 className={styles.title}>{grade.name}</h1>
                <p className={styles.subtitle}>اختر باقتك وابدأ رحلة التعلم معنا</p>
              </div>
            </motion.div>

            {user && (
              <motion.div 
                className={styles.walletBalance}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div 
                  className={styles.walletIcon}
                  animate={{
                    scale: [1, 1.05, 1],
                    transition: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                >
                  <Wallet className="w-6 h-6 text-white" />
                </motion.div>
                <div className={styles.walletInfo}>
                  <p className={styles.walletLabel}>رصيد المحفظة</p>
                  <p className={styles.walletAmount}>{walletBalance.toLocaleString()} جنيه</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.header>

        {/* Stats Section */}
        <motion.div 
          className={styles.statsContainer}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={styles.statCard}>
            <Users className="w-8 h-8 text-primary-400" />
            <div>
              <h3>{stats.totalStudents.toLocaleString()}+</h3>
              <p>طالب</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <TrendingUp className="w-8 h-8 text-accent-400" />
            <div>
              <h3>{stats.successRate}%</h3>
              <p>نسبة النجاح</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <Zap className="w-8 h-8 text-success-500" />
            <div>
              <h3>{stats.activeCourses}+</h3>
              <p>دورة نشطة</p>
            </div>
          </div>
        </motion.div>

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
                  <div className={styles.sectionIcon}>
                    <Sparkles className="w-6 h-6 text-accent-400" />
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>عروض حصرية محدودة</h2>
                    <p className={styles.sectionSubtitle}>استغل العروض قبل انتهاء المدة</p>
                  </div>
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
                  <div className={styles.sectionIcon}>
                    <BookOpen className="w-6 h-6 text-primary-400" />
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>باقات الترم الكامل</h2>
                    <p className={styles.sectionSubtitle}>تعلم بلا حدود طوال الترم</p>
                  </div>
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
                  <div className={styles.sectionIcon}>
                    <Calendar className="w-6 h-6 text-success-500" />
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>الباقات الشهرية</h2>
                    <p className={styles.sectionSubtitle}>مرونة في التعلم شهرياً</p>
                  </div>
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
                  <div className={styles.sectionIcon}>
                    <Clock className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className={styles.sectionTitle}>الباقات الأسبوعية</h2>
                    <p className={styles.sectionSubtitle}>ابدأ رحلتك هذا الأسبوع</p>
                  </div>
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
                <p className={styles.emptySubtext}>سيتم إضافة باقات جديدة قريباً</p>
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
            onClick={() => !purchaseSuccess && setShowPurchaseModal(false)}
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
                    transition={{ type: "spring", stiffness: 200 }}
                    className={styles.successIcon}
                  >
                    <CheckCircle2 className="w-12 h-12 text-success-500" />
                  </motion.div>
                  <h3 className={styles.successTitle}>تهانينا!</h3>
                  <p className={styles.successMessage}>{purchaseSuccess}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowPurchaseModal(false)}
                    className={styles.closeButton}
                    style={{ marginTop: '1.5rem' }}
                  >
                    إغلاق
                  </motion.button>
                </motion.div>
              ) : (
                <>
                  <div className={styles.modalHeader}>
                    <div>
                      <h3 className={styles.modalTitle}>{selectedPackage.name}</h3>
                      <p className={styles.modalPrice}>{selectedPackage.price.toLocaleString()} جنيه</p>
                    </div>
                    <motion.button 
                      whileHover={{ rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowPurchaseModal(false)}
                      className={styles.closeButton}
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </motion.button>
                  </div>

                  <div className={styles.paymentMethods}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethod('wallet')}
                      className={`${styles.paymentMethod} ${paymentMethod === 'wallet' ? styles.paymentMethodActive : ''}`}
                    >
                      <CreditCard className={`w-6 h-6 ${paymentMethod === 'wallet' ? 'text-primary-500' : 'text-gray-400'}`} />
                      <div className={styles.paymentMethodInfo}>
                        <p className={styles.paymentMethodTitle}>الدفع من المحفظة</p>
                        <p className={styles.paymentMethodSubtitle}>رصيدك: {walletBalance.toLocaleString()} جنيه</p>
                      </div>
                      {paymentMethod === 'wallet' && <div className={styles.checkIndicator}></div>}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethod('code')}
                      className={`${styles.paymentMethod} ${paymentMethod === 'code' ? styles.paymentMethodActive : ''}`}
                    >
                      <Ticket className={`w-6 h-6 ${paymentMethod === 'code' ? 'text-primary-500' : 'text-gray-400'}`} />
                      <div className={styles.paymentMethodInfo}>
                        <p className={styles.paymentMethodTitle}>كود تفعيل</p>
                        <p className={styles.paymentMethodSubtitle}>أدخل كود الشراء</p>
                      </div>
                      {paymentMethod === 'code' && <div className={styles.checkIndicator}></div>}
                    </motion.button>
                  </div>

                  {paymentMethod === 'code' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={styles.codeInputContainer}
                    >
                      <input
                        type="text"
                        placeholder="أدخل كود التفعيل هنا"
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value)}
                        className={styles.codeInput}
                        dir="ltr"
                      />
                    </motion.div>
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