'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Wallet, BookOpen, GraduationCap, Loader2, AlertCircle,
  Crown, Sparkles, Clock, Calendar, Medal, PlayCircle,
  CheckCircle2, ArrowRight, ShoppingCart, RefreshCw, 
  Ticket, CreditCard, X, Shield, Gift
} from 'lucide-react'
import styles from './GradePage.module.css'
import { 
  deductWalletBalance, 
  markCodeAsUsed, 
  createUserPackage, 
  validateCode,
  getWalletBalance 
} from './actions'

// أنواع البيانات
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
  expires_at: string
  is_active: boolean
  packages: Package
}

interface ThemeType {
  primary: string
  secondary: string
  accent: string
  bg: string
  wave: string
}

// الألوان الخاصة بكل صف
const themes: Record<string, ThemeType> = {
  first: {
    primary: '#3b82f6',
    secondary: '#1d4ed8',
    accent: '#06b6d4',
    bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    wave: '#dbeafe'
  },
  second: {
    primary: '#8b5cf6',
    secondary: '#6d28d9',
    accent: '#ec4899',
    bg: 'linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)',
    wave: '#ede9fe'
  },
  third: {
    primary: '#f59e0b',
    secondary: '#d97706',
    accent: '#ef4444',
    bg: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
    wave: '#fef3c7'
  }
}

// دالة مساعدة لتحويل hex إلى rgb
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export default function GradePage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const gradeSlug = params?.grade as 'first' | 'second' | 'third'
  const theme = themes[gradeSlug] || themes.first

  // Refs للرسوم المتحركة
  const containerRef = useRef<HTMLDivElement>(null)
  const sectionsRef = useRef<(HTMLElement | null)[]>([])

  const [packages, setPackages] = useState<Package[]>([])
  const [userPackages, setUserPackages] = useState<UserPackage[]>([])
  const [user, setUser] = useState<any>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [activeSection, setActiveSection] = useState<'current' | 'offers' | 'available'>('available')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // تعيين المتغيرات CSS ديناميكياً
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--accent', theme.accent);
    
    const primaryRGB = hexToRgb(theme.primary);
    const secondaryRGB = hexToRgb(theme.secondary);
    const accentRGB = hexToRgb(theme.accent);
    
    if (primaryRGB) {
      root.style.setProperty('--primary-rgb', `${primaryRGB.r}, ${primaryRGB.g}, ${primaryRGB.b}`);
    }
    if (secondaryRGB) {
      root.style.setProperty('--secondary-rgb', `${secondaryRGB.r}, ${secondaryRGB.g}, ${secondaryRGB.b}`);
    }
    if (accentRGB) {
      root.style.setProperty('--accent-rgb', `${accentRGB.r}, ${accentRGB.g}, ${accentRGB.b}`);
    }
  }, [theme])

  // جلب البيانات
  const fetchData = useCallback(async () => {
    try {
      if (!isRefreshing) setLoading(true)
      setError(null)
      
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !currentUser) {
        setUser(null)
        setLoading(false)
        setIsRefreshing(false)
        return
      }
      
      setUser(currentUser)

      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .eq('grade', gradeSlug)
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (packagesError) throw packagesError
      setPackages(packagesData || [])

      const walletResult = await getWalletBalance(currentUser.id)
      if (walletResult.success && walletResult.data) {
        setWalletBalance(walletResult.data.balance || 0)
      }

      const { data: userPkgs, error: userPkgsError } = await supabase
        .from('user_packages')
        .select(`*, packages:package_id(*)`)
        .eq('user_id', currentUser.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())

      if (userPkgsError) throw userPkgsError
      setUserPackages(userPkgs as UserPackage[] || [])
      
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء جلب البيانات')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [gradeSlug, supabase, isRefreshing])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // إعداد Intersection Observer للرسوم المتحركة
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible)
          }
        })
      },
      { threshold: 0.1, rootMargin: '-50px' }
    )

    // مراقبة جميع الأقسام
    sectionsRef.current.forEach((section) => {
      if (section) {
        section.classList.add(styles.fadeInUp)
        observer.observe(section)
      }
    })

    return () => {
      sectionsRef.current.forEach((section) => {
        if (section) observer.unobserve(section)
      })
    }
  }, [packages, userPackages])

  // Real-time updates للمحفظة
  useEffect(() => {
    if (!user?.id) return
    
    const channel = supabase
      .channel(`wallet-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wallets',
        filter: `user_id=eq.${user.id}`
      }, (payload: any) => {
        setWalletBalance(payload.new?.balance || 0)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, supabase])

  // تصنيف الباقات
  const { purchased, available, offers } = useMemo(() => {
    const purchasedIds = userPackages.map(up => up.package_id)
    
    const purchased = userPackages
      .filter(up => up.packages)
      .map(up => ({ 
        ...up.packages, 
        userPackageId: up.id, 
        expires_at: up.expires_at 
      }))
    
    const available = packages.filter(p => 
      !purchasedIds.includes(p.id) && p.type !== 'offer'
    )
    
    const offers = packages.filter(p => 
      !purchasedIds.includes(p.id) && p.type === 'offer'
    )
    
    return { purchased, available, offers }
  }, [packages, userPackages])

  const handlePurchaseClick = (pkg: Package) => {
    if (!user) {
      router.push(`/login?returnUrl=/grades/${gradeSlug}`)
      return
    }
    setSelectedPackage(pkg)
    setShowPurchaseModal(true)
  }

  const handleEnterPackage = (pkgId: string) => {
    router.push(`/grades/${gradeSlug}/packages/${pkgId}`)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchData()
  }

  const scrollToSection = (section: 'current' | 'offers' | 'available') => {
    setActiveSection(section)
    const sectionId = `${section}-section`
    const element = document.getElementById(sectionId)
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // دالة لتحديث الـ refs
  const setSectionRef = useCallback((index: number) => (el: HTMLElement | null) => {
    sectionsRef.current[index] = el
  }, [])

  if (loading) {
    return (
      <div className={styles.loading}>
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 size={64} />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          جاري تحميل البيانات...
        </motion.p>
      </div>
    )
  }

  return (
    <div className={styles.container} ref={containerRef}>
      {/* شريط التقدم المتحرك */}
      <div className={styles.progressBar}></div>

      {/* تأثيرات الخلفية */}
      <div className={styles.backgroundEffects}>
        <div className={styles.floatingShapes}>
          <div className={styles.floatingShape1}></div>
          <div className={styles.floatingShape2}></div>
        </div>
      </div>

      {/* موجات الخلفية */}
      <div className={styles.waveContainer}>
        <div className={styles.waves}>
          <div className={styles.wave}></div>
          <div className={styles.wave}></div>
          <div className={styles.wave}></div>
        </div>
      </div>

      {/* الهيدر */}
      <header className={styles.header}>
        <motion.div 
          initial={{ y: -50, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.6 }}
          className={styles.headerContent}
        >
          <div className={styles.logoSection}>
            <div className={styles.logoIcon}>
              <Crown size={24} color="white" />
            </div>
            <div className={styles.logoText}>
              <h1>البارع محمود الديب</h1>
              <p>منارة العلم والتميز</p>
            </div>
          </div>

          {user ? (
            <motion.div 
              className={styles.walletCard} 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={styles.walletIcon}>
                <Wallet size={24} color="white" />
              </div>
              <div className={styles.walletInfo}>
                <span className={styles.walletLabel}>رصيدك</span>
                <span className={styles.walletAmount}>
                  {walletBalance.toLocaleString()} جنيه
                </span>
              </div>
              <button 
                className={styles.refreshBtn} 
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="تحديث"
                aria-label="تحديث الرصيد"
              >
                {isRefreshing ? (
                  <Loader2 className={styles.spinner} size={16} />
                ) : (
                  <RefreshCw size={16} />
                )}
              </button>
            </motion.div>
          ) : (
            <motion.button 
              className={styles.loginBtn}
              onClick={() => router.push(`/login?returnUrl=/grades/${gradeSlug}`)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              تسجيل الدخول
            </motion.button>
          )}
        </motion.div>

        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={styles.gradeBadge}
        >
          <GraduationCap size={32} />
          <h2>
            {gradeSlug === 'first' && 'الصف الأول الثانوي'}
            {gradeSlug === 'second' && 'الصف الثاني الثانوي'}
            {gradeSlug === 'third' && 'الصف الثالث الثانوي'}
          </h2>
        </motion.div>

        {/* تبويبات التنقل */}
        <nav className={styles.navTabs}>
          {purchased.length > 0 && (
            <button 
              className={`${styles.navTab} ${activeSection === 'current' ? styles.active : ''}`}
              onClick={() => scrollToSection('current')}
            >
              <CheckCircle2 size={18} />
              <span>اشتراكاتي ({purchased.length})</span>
            </button>
          )}
          {offers.length > 0 && (
            <button 
              className={`${styles.navTab} ${activeSection === 'offers' ? styles.active : ''}`}
              onClick={() => scrollToSection('offers')}
            >
              <Sparkles size={18} />
              <span>العروض ({offers.length})</span>
            </button>
          )}
          <button 
            className={`${styles.navTab} ${activeSection === 'available' ? styles.active : ''}`}
            onClick={() => scrollToSection('available')}
          >
            <BookOpen size={18} />
            <span>جميع الباقات ({available.length})</span>
          </button>
        </nav>
      </header>

      {/* المحتوى الرئيسي */}
      <main className={styles.main}>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.errorBanner}
          >
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={fetchData}>إعادة المحاولة</button>
          </motion.div>
        )}

        {/* قسم الاشتراكات الحالية */}
        {purchased.length > 0 && (
          <section 
            id="current-section" 
            className={styles.section}
            ref={setSectionRef(0)}
          >
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <CheckCircle2 size={32} />
                <div>
                  <h2>اشتراكاتك الحالية</h2>
                  <p>الباقات التي قمت بشرائها</p>
                </div>
              </div>
              <span className={styles.countBadge}>{purchased.length}</span>
            </div>
            <div className={styles.grid}>
              {purchased.map((pkg: any, idx: number) => (
                <PackageCard 
                  key={pkg.id} 
                  pkg={pkg} 
                  isPurchased={true} 
                  theme={theme} 
                  index={idx} 
                  onEnter={() => handleEnterPackage(pkg.id)} 
                  expiresAt={pkg.expires_at} 
                />
              ))}
            </div>
          </section>
        )}

        {/* قسم العروض */}
        {offers.length > 0 && (
          <section 
            id="offers-section" 
            className={`${styles.section} ${styles.offerSection}`}
            ref={setSectionRef(1)}
          >
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <Sparkles size={32} />
                <div>
                  <h2>عروض VIP حصرية</h2>
                  <p>خصومات لفترة محدودة</p>
                </div>
              </div>
            </div>
            <div className={styles.grid}>
              {offers.map((pkg, idx) => (
                <PackageCard 
                  key={pkg.id} 
                  pkg={pkg} 
                  isPurchased={false} 
                  theme={theme} 
                  index={idx} 
                  isOffer={true} 
                  onPurchase={() => handlePurchaseClick(pkg)} 
                />
              ))}
            </div>
          </section>
        )}

        {/* قسم الباقات المتاحة */}
        {available.length > 0 && (
          <section 
            id="available-section" 
            className={styles.section}
            ref={setSectionRef(2)}
          >
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <BookOpen size={32} />
                <div>
                  <h2>الباقات المتاحة</h2>
                  <p>اختر الباقة المناسبة لك</p>
                </div>
              </div>
            </div>
            <div className={styles.grid}>
              {available.map((pkg, idx) => (
                <PackageCard 
                  key={pkg.id} 
                  pkg={pkg} 
                  isPurchased={false} 
                  theme={theme} 
                  index={idx} 
                  onPurchase={() => handlePurchaseClick(pkg)} 
                />
              ))}
            </div>
          </section>
        )}

        {purchased.length === 0 && available.length === 0 && offers.length === 0 && (
          <div className={styles.empty}>
            <BookOpen size={64} />
            <h3>لا توجد باقات متاحة حالياً</h3>
            <p>سيتم إضافة باقات جديدة قريباً</p>
          </div>
        )}
      </main>

      {/* مودال الشراء */}
      <AnimatePresence>
        {showPurchaseModal && selectedPackage && user && (
          <PurchaseModal 
            pkg={selectedPackage} 
            user={user} 
            walletBalance={walletBalance} 
            theme={theme}
            onClose={() => {
              setShowPurchaseModal(false)
              setSelectedPackage(null)
            }}
            onSuccess={() => {
              handleRefresh()
              setShowPurchaseModal(false)
            }}
            gradeSlug={gradeSlug}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// مكون بطاقة الباقة
interface PackageCardProps {
  pkg: Package
  isPurchased: boolean
  theme: ThemeType
  index: number
  onPurchase?: () => void
  onEnter?: () => void
  isOffer?: boolean
  expiresAt?: string
}

function PackageCard({ pkg, isPurchased, theme, index, onPurchase, onEnter, isOffer, expiresAt }: PackageCardProps) {
  const getTypeIcon = () => {
    switch (pkg.type) {
      case 'weekly': return <Clock size={20} />
      case 'monthly': return <Calendar size={20} />
      case 'term': return <Medal size={20} />
      case 'offer': return <Crown size={20} />
      default: return <BookOpen size={20} />
    }
  }

  const getTypeLabel = () => {
    switch (pkg.type) {
      case 'weekly': return 'أسبوعي'
      case 'monthly': return 'شهري'
      case 'term': return 'ترم كامل'
      case 'offer': return 'عرض خاص'
      default: return 'عادي'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      className={`${styles.card} ${isOffer ? styles.offerCard : ''} ${isPurchased ? styles.purchasedCard : ''}`}
    >
      {isOffer && (
        <div className={styles.offerBadge}>
          <Sparkles size={16} />
          <span>عرض حصري</span>
        </div>
      )}
      
      {isPurchased && (
        <div className={styles.purchasedBadge}>
          <CheckCircle2 size={16} />
          <span>مشترك</span>
        </div>
      )}

      <div className={styles.cardImage}>
        {pkg.image_url ? (
          <img src={pkg.image_url} alt={pkg.name} />
        ) : (
          <div className={styles.placeholder}>
            {getTypeIcon()}
          </div>
        )}
        <div className={styles.typeTag}>
          {getTypeIcon()}
          <span>{getTypeLabel()}</span>
        </div>
      </div>

      <div className={styles.cardContent}>
        <h3>{pkg.name}</h3>
        <p>{pkg.description || `باقة ${getTypeLabel()} متكاملة`}</p>
        
        <div className={styles.stats}>
          <div className={styles.stat}>
            <PlayCircle size={16} />
            <span>{pkg.lecture_count || 0} محاضرة</span>
          </div>
          <div className={styles.stat}>
            <Clock size={16} />
            <span>{pkg.duration_days || 30} يوم</span>
          </div>
        </div>

        {expiresAt && (
          <div className={styles.expiry}>
            <span>ينتهي: {new Date(expiresAt).toLocaleDateString('ar-EG')}</span>
          </div>
        )}

        <div className={styles.priceRow}>
          <div className={styles.price}>
            <span>{(pkg.price || 0).toLocaleString()}</span>
            <small>جنيه</small>
          </div>
          
          {isPurchased ? (
            <button 
              className={styles.enterBtn} 
              onClick={onEnter}
            >
              دخول
              <ArrowRight size={18} />
            </button>
          ) : (
            <button 
              className={styles.buyBtn} 
              onClick={onPurchase}
            >
              شراء
              <ShoppingCart size={18} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// مكون مودال الشراء
interface PurchaseModalProps {
  pkg: Package
  user: any
  walletBalance: number
  theme: ThemeType
  onClose: () => void
  onSuccess: () => void
  gradeSlug: string
}

function PurchaseModal({ 
  pkg, 
  user, 
  walletBalance, 
  theme, 
  onClose, 
  onSuccess, 
  gradeSlug 
}: PurchaseModalProps) {
  const [method, setMethod] = useState<'wallet' | 'code'>('wallet')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [codeValid, setCodeValid] = useState<any>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') onClose() 
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleValidateCode = async () => {
    if (!code.trim()) { 
      setError('أدخل الكود') 
      return 
    }
    
    setLoading(true)
    setError('')

    try {
      const result = await validateCode(code, gradeSlug, pkg.id)
      
      if (!result.success) throw new Error(result.message)
      setCodeValid(result.data)
    } catch (err: any) {
      setError(err.message)
      setCodeValid(null)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    setLoading(true)
    setError('')

    try {
      if (method === 'wallet') {
        if (walletBalance < pkg.price) throw new Error('رصيد غير كافٍ')
        
        const result = await deductWalletBalance(user.id, pkg.price, pkg.id)
        if (!result.success) throw new Error(result.message)
        
        const pkgResult = await createUserPackage(
          user.id, 
          pkg.id, 
          pkg.duration_days || 30, 
          'wallet'
        )
        
        if (!pkgResult.success) throw new Error(pkgResult.message)
        
      } else {
        if (!codeValid) throw new Error('تحقق من الكود أولاً')
        
        const markResult = await markCodeAsUsed(codeValid.id, user.id)
        if (!markResult.success) throw new Error(markResult.message)
        
        const pkgResult = await createUserPackage(
          user.id, 
          pkg.id, 
          pkg.duration_days || 30, 
          'code'
        )
        
        if (!pkgResult.success) {
          await supabase
            .from('codes')
            .update({ is_used: false, used_by: null, used_at: null })
            .eq('id', codeValid.id)
          throw new Error(pkgResult.message)
        }
      }

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'تم الشراء بنجاح! 🎉',
        message: `تم تفعيل ${pkg.name}`,
        type: 'success'
      })

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }} 
        className={styles.modal}
        onClick={e => e.stopPropagation()}
      >
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>

        <div className={styles.modalHeader}>
          <Gift size={48} />
          <h3>{pkg.name}</h3>
          <p className={styles.modalPrice}>{pkg.price.toLocaleString()} جنيه</p>
        </div>

        <div className={styles.paymentMethods}>
          <button 
            className={`${styles.methodBtn} ${method === 'wallet' ? styles.active : ''}`} 
            onClick={() => setMethod('wallet')}
          >
            <CreditCard size={24} />
            <div>
              <strong>المحفظة</strong>
              <span>رصيد: {walletBalance.toLocaleString()} جنيه</span>
            </div>
          </button>
          
          <button 
            className={`${styles.methodBtn} ${method === 'code' ? styles.active : ''}`} 
            onClick={() => setMethod('code')}
          >
            <Ticket size={24} />
            <div>
              <strong>كود تفعيل</strong>
              <span>ادخل كود الخصم</span>
            </div>
          </button>
        </div>

        {method === 'code' && (
          <div className={styles.codeSection}>
            <div className={styles.codeInput}>
              <input 
                type="text" 
                value={code} 
                onChange={e => setCode(e.target.value.toUpperCase())} 
                placeholder="XXXX-XXXX"
                disabled={!!codeValid}
                maxLength={20}
              />
              <button 
                onClick={handleValidateCode} 
                disabled={loading || !code || !!codeValid}
              >
                {loading ? <Loader2 className={styles.spinner} size={20} /> : 'تحقق'}
              </button>
            </div>
            {codeValid && (
              <div className={styles.codeSuccess}>
                <CheckCircle2 size={16} /> 
                كود صالح! 
                {codeValid.discount_percentage && (
                  <span> (خصم {codeValid.discount_percentage}%)</span>
                )}
              </div>
            )}
          </div>
        )}

        {method === 'wallet' && walletBalance < pkg.price && (
          <div className={styles.errorMsg}>
            <AlertCircle size={16} />
            رصيد غير كافٍ. رصيدك: {walletBalance} جنيه
          </div>
        )}

        {error && (
          <div className={styles.errorMsg}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button 
          className={styles.confirmBtn}
          onClick={handlePurchase}
          disabled={
            loading || 
            (method === 'code' && !codeValid) || 
            (method === 'wallet' && walletBalance < pkg.price)
          }
        >
          {loading ? (
            <><Loader2 className={styles.spinner} size={20} /> جاري المعالجة...</>
          ) : (
            <>تأكيد الشراء <ArrowRight size={20} /></>
          )}
        </button>

        <div className={styles.secureNote}>
          <Shield size={16} />
          معاملة آمنة ومشفرة
        </div>
      </motion.div>
    </div>
  )
}