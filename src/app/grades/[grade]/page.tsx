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
  TrendingUp,
  Crown,
  Award,
  Target,
  Brain,
  Rocket,
  Gem,
  Moon,
  Sun,
  Waves as WavesIcon
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

interface PurchaseCode {
  id: string
  code: string
  package_id: string
  grade: string
  is_used: boolean
  used_by: string | null
  used_at: string | null
  expires_at: string
}

// ================== Animation Variants ==================
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 1
    }
  }
}

const cardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8, 
    y: 30,
    rotateX: 15,
    rotateY: -10
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    rotateY: 0,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 20,
      mass: 1.2
    }
  },
  hover: {
    scale: 1.05,
    y: -15,
    rotateX: 5,
    rotateY: 5,
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  }
}

const modalVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8, 
    y: 50,
    rotateX: 10
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
      mass: 1
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: { 
      duration: 0.3,
      ease: "easeInOut"
    }
  }
}

// ================== Wave Background Component ==================
const WaveBackground = () => {
  const waves = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    amplitude: Math.random() * 30 + 20,
    frequency: Math.random() * 0.02 + 0.01,
    speed: Math.random() * 2 + 1,
    color: i === 0 ? 'var(--primary-400)' : 
           i === 1 ? 'var(--accent-400)' : 
           i === 2 ? 'var(--secondary-400)' :
           i === 3 ? 'var(--success-400)' : 'var(--purple-400)',
    opacity: 0.05 + (i * 0.03)
  }))

  return (
    <div className={styles.waveContainer}>
      {waves.map((wave, index) => (
        <motion.div
          key={wave.id}
          className={styles.wave}
          animate={{
            x: [0, -100, 0],
            y: [0, Math.sin(index * 0.5) * 20, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: wave.speed * 10,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            background: `linear-gradient(90deg, transparent, ${wave.color}, transparent)`,
            opacity: wave.opacity,
            height: `${wave.amplitude}px`,
            filter: `blur(${index * 2}px)`
          }}
        />
      ))}
    </div>
  )
}

// ================== Floating Elements Component ==================
const FloatingElements = () => {
  const elements = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: Math.random() * 40 + 20,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 30 + 20,
    delay: Math.random() * 10,
    type: i % 4,
    rotation: Math.random() * 360
  }))

  const getElementContent = (type: number) => {
    switch(type) {
      case 0: return <Brain className="w-full h-full" />
      case 1: return <Award className="w-full h-full" />
      case 2: return <Target className="w-full h-full" />
      case 3: return <Gem className="w-full h-full" />
      default: return <Star className="w-full h-full" />
    }
  }

  return (
    <div className={styles.floatingContainer}>
      {elements.map((element) => (
        <motion.div
          key={element.id}
          className={styles.floatingElement}
          initial={{ 
            x: `${element.x}%`, 
            y: `${element.y}%`,
            rotate: element.rotation
          }}
          animate={{
            x: [`${element.x}%`, `${element.x + 15}%`, `${element.x}%`],
            y: [`${element.y}%`, `${element.y - 20}%`, `${element.y}%`],
            rotate: element.rotation + 360,
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: element.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: element.delay
          }}
          style={{
            width: element.size,
            height: element.size,
            opacity: 0.1,
            filter: 'blur(1px)'
          }}
        >
          {getElementContent(element.type)}
        </motion.div>
      ))}
    </div>
  )
}

// ================== Particle Background Component ==================
const ParticleBackground = () => {
  const particles = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    size: Math.random() * 5 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 30 + 15,
    delay: Math.random() * 20,
    color: `hsla(${Math.random() * 60 + 200}, 100%, 65%, ${Math.random() * 0.3 + 0.1})`
  }))

  return (
    <div className={styles.particleSystem}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={styles.particle}
          initial={{ x: `${particle.x}%`, y: `${particle.y}%` }}
          animate={{
            x: [`${particle.x}%`, `${particle.x + Math.random() * 30 - 15}%`, `${particle.x}%`],
            y: [`${particle.y}%`, `${particle.y - Math.random() * 40}%`, `${particle.y}%`],
            rotate: 360
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.delay
          }}
          style={{
            width: particle.size,
            height: particle.size,
            background: particle.color,
            borderRadius: '50%'
          }}
        />
      ))}
    </div>
  )
}

// ================== Light Beam Component ==================
const LightBeams = () => {
  const beams = Array.from({ length: 3 }, (_, i) => ({
    id: i,
    angle: Math.random() * 360,
    width: Math.random() * 100 + 50,
    opacity: Math.random() * 0.1 + 0.05,
    duration: Math.random() * 20 + 10
  }))

  return (
    <div className={styles.lightBeams}>
      {beams.map((beam) => (
        <motion.div
          key={beam.id}
          className={styles.lightBeam}
          initial={{ rotate: beam.angle, opacity: 0 }}
          animate={{ 
            rotate: beam.angle + 360,
            opacity: [beam.opacity, beam.opacity * 2, beam.opacity]
          }}
          transition={{
            duration: beam.duration,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            width: `${beam.width}vw`,
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)`,
            opacity: beam.opacity
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
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePosition({ x, y })
  }

  const getPackageIcon = () => {
    switch (pkg.type) {
      case 'weekly': return <Clock className="w-5 h-5" />
      case 'monthly': return <Calendar className="w-5 h-5" />
      case 'term': return <BookOpen className="w-5 h-5" />
      case 'offer': return <Crown className="w-5 h-5" />
      default: return <Star className="w-5 h-5" />
    }
  }

  const getTypeColor = () => {
    switch (pkg.type) {
      case 'weekly': return 'var(--accent-400)'
      case 'monthly': return 'var(--primary-400)'
      case 'term': return 'var(--success-400)'
      case 'offer': return 'var(--purple-400)'
      default: return 'var(--secondary-400)'
    }
  }

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      transition={{ 
        delay: index * 0.15,
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
      className={`${styles.card} ${highlight ? styles.cardHighlight : ''} ${isPurchased ? styles.cardPurchased : ''}`}
      onMouseMove={handleMouseMove}
      style={{
        '--mouse-x': `${mousePosition.x}%`,
        '--mouse-y': `${mousePosition.y}%`,
        '--type-color': getTypeColor(),
      } as React.CSSProperties}
    >
      {/* Glow Effect */}
      {isHovered && (
        <motion.div 
          className={styles.cardGlow}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Animated Border */}
      <div className={styles.cardBorder}>
        <motion.div 
          className={styles.borderEffect}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Highlight Badge */}
      {highlight && (
        <motion.div 
          className={styles.cardBadge}
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Sparkles className="w-4 h-4" />
          <span>عرض حصري</span>
          <motion.div
            className={styles.badgeGlow}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity
            }}
          />
        </motion.div>
      )}

      {/* Type Badge */}
      <motion.div 
        className={styles.typeBadge}
        whileHover={{ scale: 1.1 }}
      >
        <div className={styles.typeIcon}>
          {getPackageIcon()}
        </div>
        <span>{pkg.type === 'weekly' ? 'أسبوعي' : 
               pkg.type === 'monthly' ? 'شهري' : 
               pkg.type === 'term' ? 'ترم كامل' : 'عرض خاص'}</span>
      </motion.div>

      {/* Purchased Overlay */}
      {isPurchased && (
        <motion.div 
          className={styles.purchasedOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div 
            className={styles.purchasedBadge}
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 250 }}
          >
            <CheckCircle2 className="w-6 h-6" />
            <span>مشترك بالفعل</span>
          </motion.div>
        </motion.div>
      )}

      {/* Card Image */}
      <div className={styles.cardImage}>
        {pkg.image_url ? (
          <motion.img 
            src={pkg.image_url} 
            alt={pkg.name}
            className={styles.image}
            loading="lazy"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <motion.div 
            className={styles.imagePlaceholder}
            animate={{ 
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)', 'hue-rotate(0deg)']
            }}
            transition={{ duration: 15, repeat: Infinity }}
          >
            <GraduationCap className="w-20 h-20 text-white/60" />
          </motion.div>
        )}
        <div className={styles.imageOverlay}></div>
        <motion.div 
          className={styles.imageShine}
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
            delay: index * 0.5
          }}
        />
      </div>

      {/* Card Content */}
      <div className={styles.cardContent}>
        <motion.h3 
          className={styles.cardTitle}
          whileHover={{ scale: 1.02 }}
        >
          {pkg.name}
        </motion.h3>
        <p className={styles.cardDescription}>{pkg.description}</p>

        {/* Meta Information */}
        <div className={styles.cardMeta}>
          <div className={styles.metaItem}>
            <motion.div 
              className={styles.metaIcon}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <PlayCircle className="w-5 h-5" />
            </motion.div>
            <div>
              <span className={styles.metaValue}>{pkg.lecture_count}</span>
              <span className={styles.metaLabel}>محاضرة</span>
            </div>
          </div>
          
          <div className={styles.metaItem}>
            <motion.div 
              className={styles.metaIcon}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Clock className="w-5 h-5" />
            </motion.div>
            <div>
              <span className={styles.metaValue}>{pkg.duration_days}</span>
              <span className={styles.metaLabel}>يوم</span>
            </div>
          </div>
          
          <div className={styles.metaItem}>
            <motion.div 
              className={styles.metaIcon}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Shield className="w-5 h-5" />
            </motion.div>
            <div>
              <span className={styles.metaLabel}>ضمان</span>
              <span className={styles.metaLabel}>استرجاع</span>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className={styles.cardFooter}>
          <motion.div 
            className={styles.priceInfo}
            whileHover={{ scale: 1.05 }}
          >
            <p className={styles.priceLabel}>السعر</p>
            <div className={styles.priceWrapper}>
              <p className={`${styles.price} ${highlight ? styles.priceHighlight : ''}`}>
                {pkg.price.toLocaleString()}
              </p>
              <span className={styles.currency}>جنيه</span>
            </div>
            {pkg.type === 'offer' && (
              <motion.p 
                className={styles.originalPrice}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                كان {Math.round(pkg.price * 1.3).toLocaleString()} جنيه
              </motion.p>
            )}
          </motion.div>

          <motion.button
            whileHover={{ 
              scale: 1.08,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)"
            }}
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
                <motion.div
                  animate={{
                    x: [0, 5, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity
                  }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </>
            ) : (
              <>
                <span>اشترك الآن</span>
                <motion.div
                  animate={{
                    rotate: 360,
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Rocket className="w-5 h-5" />
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
  
  // Code Validation State
  const [isValidatingCode, setIsValidatingCode] = useState(false)
  const [codeValidationError, setCodeValidationError] = useState('')
  const [codeValidationSuccess, setCodeValidationSuccess] = useState('')
  const [validatedCode, setValidatedCode] = useState<PurchaseCode | null>(null)

  // Stats
  const [stats, setStats] = useState({
    totalStudents: 1250,
    successRate: 94,
    activeCourses: 42,
    expertTeachers: 25
  })

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

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

  // ================== Code Validation ==================
  const validateCode = async (code: string) => {
    if (!selectedPackage || !user) return null
    
    setIsValidatingCode(true)
    setCodeValidationError('')
    setCodeValidationSuccess('')
    setValidatedCode(null)

    try {
      const response = await fetch('/api/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          packageId: selectedPackage.id,
          userId: user.id,
          gradeSlug: gradeSlug
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'كود غير صالح')
      }

      setCodeValidationSuccess('الكود صالح ويمكن استخدامه!')
      setValidatedCode(data.code)
      return data.code
    } catch (err: any) {
      setCodeValidationError(err.message)
      return null
    } finally {
      setIsValidatingCode(false)
    }
  }

  const handleCodeInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCodeInput(value)
    
    // إذا كان الكود بطول 8 أحرف أو أكثر، قم بالتحقق منه تلقائياً
    if (value.length >= 8) {
      await validateCode(value)
    } else {
      setCodeValidationError('')
      setCodeValidationSuccess('')
      setValidatedCode(null)
    }
  }

  // ================== Purchase Handlers ==================
  const handlePurchaseClick = async (pkg: Package) => {
    if (!user) {
      router.push(`/login?returnUrl=/grades/${gradeSlug}`)
      return
    }
    
    // التحقق إذا كانت الباقة مشتراة مسبقاً
    const isPurchased = userPackages.some(up => up.package_id === pkg.id)
    
    if (isPurchased) {
      setPurchaseError('لقد قمت بشراء هذه الباقة مسبقاً!')
      setTimeout(() => {
        // توجيه المستخدم للباقة المشتراة
        router.push(`/grades/${gradeSlug}/packages/${pkg.id}`)
      }, 2000)
      return
    }
    
    setSelectedPackage(pkg)
    setPaymentMethod('wallet')
    setCodeInput('')
    setPurchaseError('')
    setPurchaseSuccess('')
    setCodeValidationError('')
    setCodeValidationSuccess('')
    setValidatedCode(null)
    setShowPurchaseModal(true)
  }

  const handlePurchase = async () => {
    if (!selectedPackage || !user) return
    
    setIsPurchasing(true)
    setPurchaseError('')

    try {
      if (paymentMethod === 'wallet') {
        // التحقق من الرصيد
        if (walletBalance < selectedPackage.price) {
          throw new Error(`رصيد المحفظة غير كافٍ. الرصيد المطلوب: ${selectedPackage.price} جنيه، رصيدك الحالي: ${walletBalance} جنيه`)
        }

        const response = await fetch('/api/purchase-with-wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            packageId: selectedPackage.id,
            userId: user.id,
            price: selectedPackage.price,
            gradeSlug: gradeSlug
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'فشل عملية الشراء')
        }

        setPurchaseSuccess('تم الشراء بنجاح! 🎉 سيتم تحويلك للباقة...')
        
        // تحديث الرصيد
        setWalletBalance(data.newBalance)
        
        // تحديث الباقات
        await checkUser()
        
        setTimeout(() => {
          setShowPurchaseModal(false)
          // توجيه المستخدم للباقة المشتراة
          router.push(`/grades/${gradeSlug}/packages/${selectedPackage.id}`)
        }, 2000)

      } else {
        // طريقة الدفع بالكود
        if (!codeInput.trim()) throw new Error('يرجى إدخال الكود')
        
        if (!validatedCode) {
          throw new Error('يرجى التحقق من صحة الكود أولاً')
        }

        const response = await fetch('/api/purchase-with-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: codeInput,
            packageId: selectedPackage.id,
            userId: user.id,
            gradeSlug: gradeSlug,
            codeId: validatedCode.id
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'فشل تفعيل الكود')
        }

        setPurchaseSuccess('تم التفعيل بنجاح! 🎉 سيتم تحويلك للباقة...')
        
        // تحديث الباقات
        await checkUser()
        
        setTimeout(() => {
          setShowPurchaseModal(false)
          // توجيه المستخدم للباقة المشتراة
          router.push(`/grades/${gradeSlug}/packages/${selectedPackage.id}`)
        }, 2000)
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
        <LightBeams />
        <ParticleBackground />
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={styles.loadingContent}
        >
          <motion.div
            className={styles.loadingSpinner}
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          />
          <motion.div
            className={styles.loadingTextContainer}
          >
            <motion.h2
              className={styles.loadingTitle}
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 3,
                repeat: Infinity
              }}
            >
              الأبــارع محمود الـديــب
            </motion.h2>
            <motion.p
              className={styles.loadingText}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              جاري تحميل بيانات الصف...
            </motion.p>
          </motion.div>
          
          <motion.div
            className={styles.loadingDots}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={styles.loadingDot}
                animate={{ 
                  y: [0, -10, 0],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // ================== Error State ==================
  if (error || !grade) {
    return (
      <div className={styles.errorContainer}>
        <WaveBackground />
        <FloatingElements />
        
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className={styles.errorCard}
        >
          <motion.div
            className={styles.errorIcon}
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <X className="w-16 h-16 text-error-500" />
          </motion.div>
          
          <motion.h2 
            className={styles.errorTitle}
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity
            }}
          >
            عذراً
          </motion.h2>
          
          <p className={styles.errorMessage}>{error || 'الصف غير موجود'}</p>
          
          <motion.button 
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)"
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/')}
            className={styles.backButton}
          >
            <ArrowRight className="w-5 h-5" />
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
    <div className={`${styles.container} ${theme === 'dark' ? styles.dark : styles.light}`}>
      {/* Enhanced Background Effects */}
      <div className={styles.bgEffects}>
        <WaveBackground />
        <ParticleBackground />
        <FloatingElements />
        <LightBeams />
        
        {/* Animated Gradient Orbs */}
        <motion.div 
          className={styles.gradientOrb1}
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className={styles.gradientOrb2}
          animate={{
            x: [100, 0, 100],
            y: [50, 0, 50],
            scale: [1.2, 1, 1.2]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className={styles.content}>
        {/* Premium Header */}
        <motion.header 
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 100,
            damping: 20,
            delay: 0.2
          }}
          className={styles.header}
        >
          <div className={styles.headerBackground}></div>
          
          <div className={styles.headerContent}>
            {/* Platform Branding */}
            <motion.div 
              className={styles.platformBranding}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div 
                className={styles.platformLogo}
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <Crown className="w-10 h-10 text-primary-400" />
              </motion.div>
              <div className={styles.platformInfo}>
                <motion.h1 
                  className={styles.platformName}
                  animate={{ 
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity
                  }}
                >
                  الأبــارع محمود الـديــب
                </motion.h1>
                <p className={styles.platformTagline}>منارة العلم والتميز</p>
              </div>
            </motion.div>

            {/* Grade Title */}
            <motion.div 
              className={styles.headerTitle}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <motion.div 
                className={styles.gradeIcon}
                animate={{
                  y: [0, -15, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <GraduationCap className="w-12 h-12 text-white" />
              </motion.div>
              <div className={styles.titleWrapper}>
                <motion.h1 
                  className={styles.title}
                  animate={{ 
                    textShadow: [
                      '0 0 20px rgba(255,255,255,0.3)',
                      '0 0 30px rgba(255,255,255,0.5)',
                      '0 0 20px rgba(255,255,255,0.3)'
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                >
                  {grade.name}
                </motion.h1>
                <p className={styles.subtitle}>رحلة نحو التميز الأكاديمي</p>
              </div>
            </motion.div>

            {/* User Actions */}
            <div className={styles.headerActions}>
              {user && (
                <motion.div 
                  className={styles.walletBalance}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div 
                    className={styles.walletIcon}
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Wallet className="w-8 h-8 text-white" />
                  </motion.div>
                  <div className={styles.walletInfo}>
                    <p className={styles.walletLabel}>رصيد المحفظة</p>
                    <motion.p 
                      className={styles.walletAmount}
                      animate={{
                        scale: [1, 1.05, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity
                      }}
                    >
                      {walletBalance.toLocaleString()} <span className={styles.currency}>جنيه</span>
                    </motion.p>
                  </div>
                  <motion.div 
                    className={styles.walletParticles}
                    animate={{
                      opacity: [0, 1, 0],
                      y: [0, -20, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity
                    }}
                  />
                </motion.div>
              )}

              {/* Theme Toggle */}
              <motion.button
                className={styles.themeToggle}
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? (
                  <Sun className="w-6 h-6 text-yellow-400" />
                ) : (
                  <Moon className="w-6 h-6 text-indigo-400" />
                )}
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* Stats Section with Enhanced Design */}
        <motion.div 
          className={styles.statsContainer}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, type: "spring" }}
        >
          <motion.div 
            className={styles.statCard}
            whileHover={{ 
              y: -10,
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)"
            }}
          >
            <motion.div 
              className={styles.statIcon}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Users className="w-10 h-10" />
            </motion.div>
            <div className={styles.statContent}>
              <motion.h3 
                className={styles.statNumber}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {stats.totalStudents.toLocaleString()}+
              </motion.h3>
              <p className={styles.statLabel}>طالب متفوق</p>
            </div>
          </motion.div>
          
          <motion.div 
            className={styles.statCard}
            whileHover={{ 
              y: -10,
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)"
            }}
          >
            <motion.div 
              className={styles.statIcon}
              animate={{
                y: [0, -5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            >
              <TrendingUp className="w-10 h-10" />
            </motion.div>
            <div className={styles.statContent}>
              <motion.h3 
                className={styles.statNumber}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {stats.successRate}%
              </motion.h3>
              <p className={styles.statLabel}>نسبة النجاح</p>
            </div>
          </motion.div>
          
          <motion.div 
            className={styles.statCard}
            whileHover={{ 
              y: -10,
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)"
            }}
          >
            <motion.div 
              className={styles.statIcon}
              animate={{
                rotate: [0, 180, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Zap className="w-10 h-10" />
            </motion.div>
            <div className={styles.statContent}>
              <motion.h3 
                className={styles.statNumber}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {stats.activeCourses}+
              </motion.h3>
              <p className={styles.statLabel}>دورة نشطة</p>
            </div>
          </motion.div>
          
          <motion.div 
            className={styles.statCard}
            whileHover={{ 
              y: -10,
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)"
            }}
          >
            <motion.div 
              className={styles.statIcon}
              animate={{
                rotate: [0, -360],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Award className="w-10 h-10" />
            </motion.div>
            <div className={styles.statContent}>
              <motion.h3 
                className={styles.statNumber}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {stats.expertTeachers}+
              </motion.h3>
              <p className={styles.statLabel}>خبير تعليمي</p>
            </div>
          </motion.div>
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
                <motion.div 
                  variants={itemVariants} 
                  className={styles.sectionHeader}
                  whileHover={{ scale: 1.02 }}
                >
                  <motion.div 
                    className={styles.sectionIcon}
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <Crown className="w-8 h-8" />
                  </motion.div>
                  <div>
                    <motion.h2 
                      className={styles.sectionTitle}
                      animate={{ 
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity
                      }}
                    >
                      عروض VIP حصرية
                    </motion.h2>
                    <p className={styles.sectionSubtitle}>فرص ذهبية بخصومات استثنائية</p>
                  </div>
                  <motion.div 
                    className={styles.sectionBadge}
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity
                    }}
                  >
                    محدودة
                  </motion.div>
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
                  <motion.div 
                    className={styles.sectionIcon}
                    animate={{
                      y: [0, -5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity
                    }}
                  >
                    <BookOpen className="w-8 h-8" />
                  </motion.div>
                  <div>
                    <h2 className={styles.sectionTitle}>باقات الترم الكامل</h2>
                    <p className={styles.sectionSubtitle}>رحلة تعلم متكاملة وشاملة</p>
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
                  <motion.div 
                    className={styles.sectionIcon}
                    animate={{
                      rotate: [0, 180, 0]
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <Calendar className="w-8 h-8" />
                  </motion.div>
                  <div>
                    <h2 className={styles.sectionTitle}>الباقات الشهرية</h2>
                    <p className={styles.sectionSubtitle}>مرونة في التعلم والتقدم</p>
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
                  <motion.div 
                    className={styles.sectionIcon}
                    animate={{
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity
                    }}
                  >
                    <Clock className="w-8 h-8" />
                  </motion.div>
                  <div>
                    <h2 className={styles.sectionTitle}>الباقات الأسبوعية</h2>
                    <p className={styles.sectionSubtitle}>ابدأ رحلتك من اليوم</p>
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div 
                  className={styles.emptyIcon}
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <BookOpen className="w-20 h-20" />
                </motion.div>
                <motion.h3 
                  className={styles.emptyTitle}
                  animate={{ 
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity
                  }}
                >
                  جاري التحضير
                </motion.h3>
                <p className={styles.emptyText}>يتم إعداد محتوى مميز للصف حالياً</p>
                <p className={styles.emptySubtext}>سيتم إطلاق الباقات قريباً</p>
                
                <motion.div 
                  className={styles.emptyProgress}
                  initial={{ width: 0 }}
                  animate={{ width: '60%' }}
                  transition={{ duration: 2, delay: 0.5 }}
                />
              </motion.div>
            )}
          </motion.div>
        </main>

        {/* Footer */}
        <motion.footer 
          className={styles.footer}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className={styles.footerContent}>
            <motion.div 
              className={styles.footerBrand}
              whileHover={{ scale: 1.05 }}
            >
              <Crown className="w-6 h-6 text-primary-400" />
              <span>الابارع محمود الديب</span>
            </motion.div>
            <p className={styles.footerText}>منارة العلم والتميز منذ 2010</p>
            <div className={styles.footerStats}>
              <span>+1250 طالب متفوق</span>
              <span>•</span>
              <span>94% نسبة نجاح</span>
              <span>•</span>
              <span>25 خبير تعليمي</span>
            </div>
          </div>
        </motion.footer>
      </div>

      {/* Premium Purchase Modal */}
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
              <div className={styles.modalGlow}></div>
              
              {purchaseSuccess ? (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={styles.successContainer}
                >
                  <motion.div 
                    className={styles.successIcon}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 200,
                      damping: 15
                    }}
                  >
                    <CheckCircle2 className="w-16 h-16" />
                  </motion.div>
                  <motion.h3 
                    className={styles.successTitle}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    مبروك! 🎉
                  </motion.h3>
                  <motion.p 
                    className={styles.successMessage}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {purchaseSuccess}
                  </motion.p>
                  <motion.div
                    className={styles.successConfetti}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {Array.from({ length: 20 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className={styles.confetti}
                        initial={{ 
                          x: 0, 
                          y: 0, 
                          rotate: 0,
                          opacity: 1
                        }}
                        animate={{ 
                          x: Math.random() * 200 - 100,
                          y: Math.random() * 200 - 100,
                          rotate: 360,
                          opacity: 0
                        }}
                        transition={{ 
                          duration: 1,
                          delay: i * 0.05
                        }}
                      />
                    ))}
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowPurchaseModal(false)}
                    className={styles.closeButton}
                    style={{ marginTop: '2rem' }}
                  >
                    إغلاق
                  </motion.button>
                </motion.div>
              ) : (
                <>
                  <div className={styles.modalHeader}>
                    <motion.div 
                      className={styles.modalTitleContainer}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                    >
                      <h3 className={styles.modalTitle}>{selectedPackage.name}</h3>
                      <motion.p 
                        className={styles.modalPrice}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {selectedPackage.price.toLocaleString()} <span className={styles.modalCurrency}>جنيه</span>
                      </motion.p>
                    </motion.div>
                    <motion.button 
                      whileHover={{ rotate: 90, scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowPurchaseModal(false)}
                      className={styles.closeButton}
                    >
                      <X className="w-6 h-6" />
                    </motion.button>
                  </div>

                  <motion.div 
                    className={styles.packageFeatures}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className={styles.feature}>
                      <PlayCircle className="w-5 h-5" />
                      <span>{selectedPackage.lecture_count} محاضرة</span>
                    </div>
                    <div className={styles.feature}>
                      <Clock className="w-5 h-5" />
                      <span>{selectedPackage.duration_days} يوم</span>
                    </div>
                    <div className={styles.feature}>
                      <Shield className="w-5 h-5" />
                      <span>ضمان الاسترجاع</span>
                    </div>
                  </motion.div>

                  <div className={styles.paymentMethods}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethod('wallet')}
                      className={`${styles.paymentMethod} ${paymentMethod === 'wallet' ? styles.paymentMethodActive : ''}`}
                    >
                      <div className={styles.paymentMethodIcon}>
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div className={styles.paymentMethodInfo}>
                        <p className={styles.paymentMethodTitle}>الدفع من المحفظة</p>
                        <p className={styles.paymentMethodSubtitle}>رصيدك: {walletBalance.toLocaleString()} جنيه</p>
                      </div>
                      {paymentMethod === 'wallet' && (
                        <motion.div 
                          className={styles.checkIndicator}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        />
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethod('code')}
                      className={`${styles.paymentMethod} ${paymentMethod === 'code' ? styles.paymentMethodActive : ''}`}
                    >
                      <div className={styles.paymentMethodIcon}>
                        <Ticket className="w-6 h-6" />
                      </div>
                      <div className={styles.paymentMethodInfo}>
                        <p className={styles.paymentMethodTitle}>كود تفعيل</p>
                        <p className={styles.paymentMethodSubtitle}>أدخل كود الشراء</p>
                      </div>
                      {paymentMethod === 'code' && (
                        <motion.div 
                          className={styles.checkIndicator}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        />
                      )}
                    </motion.button>
                  </div>

                  {paymentMethod === 'code' && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={styles.codeInputContainer}
                      >
                        <div className={styles.codeValidationSection}>
                          <input
                            type="text"
                            placeholder="أدخل كود التفعيل هنا (8 أحرف على الأقل)"
                            value={codeInput}
                            onChange={handleCodeInputChange}
                            className={styles.codeInput}
                            dir="ltr"
                            disabled={isValidatingCode}
                          />
                          
                          {codeInput.length >= 8 && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => validateCode(codeInput)}
                              disabled={isValidatingCode}
                              className={styles.validateButton}
                            >
                              {isValidatingCode ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'التحقق من الكود'
                              )}
                            </motion.button>
                          )}
                        </div>
                        
                        {codeValidationSuccess && (
                          <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={styles.successBanner}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            {codeValidationSuccess}
                            {validatedCode && (
                              <div className={styles.codeDetails}>
                                <span>الكود: {validatedCode.code}</span>
                                <span>ينتهي: {new Date(validatedCode.expires_at).toLocaleDateString('ar-EG')}</span>
                              </div>
                            )}
                          </motion.div>
                        )}
                        
                        {codeValidationError && (
                          <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={styles.errorBanner}
                          >
                            <X className="w-5 h-5" />
                            {codeValidationError}
                          </motion.div>
                        )}
                      </motion.div>
                      
                      {validatedCode && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={styles.codeInfo}
                        >
                          <div className={styles.codeInfoItem}>
                            <Shield className="w-5 h-5" />
                            <span>الكود صالح للاستخدام مرة واحدة</span>
                          </div>
                          <div className={styles.codeInfoItem}>
                            <Users className="w-5 h-5" />
                            <span>مخصص لمستخدم واحد فقط</span>
                          </div>
                          <div className={styles.codeInfoItem}>
                            <BookOpen className="w-5 h-5" />
                            <span>مخصص لباقة: {selectedPackage.name}</span>
                          </div>
                        </motion.div>
                      )}
                    </>
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
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePurchase}
                    disabled={isPurchasing || (paymentMethod === 'code' && !validatedCode)}
                    className={styles.confirmButton}
                  >
                    {isPurchasing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        جاري المعالجة...
                      </>
                    ) : paymentMethod === 'code' ? (
                      <>
                        تفعيل الكود
                        <motion.div
                          animate={{
                            x: [0, 5, 0]
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity
                          }}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </motion.div>
                      </>
                    ) : (
                      <>
                        تأكيد الشراء من المحفظة
                        <motion.div
                          animate={{
                            x: [0, 5, 0]
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity
                          }}
                        >
                          <Wallet className="w-5 h-5" />
                        </motion.div>
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