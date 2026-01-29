'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientBrowser } from '@/lib/supabase/sf-client'
import { 
  Wallet, BookOpen, Clock, Calendar, Loader2, GraduationCap,
  Users, Zap, TrendingUp, Award, Crown, Package, Sparkles,
  AlertCircle, CheckCircle2, PlayCircle, ArrowRight,
  ShoppingCart, RefreshCw, Target, Medal, Star, BookMarked
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
  theme,
  index,
  isOffer = false
}: { 
  pkg: Package, 
  isPurchased: boolean,
  onEnter?: () => void,
  onPurchase?: () => void,
  theme: any,
  index?: number,
  isOffer?: boolean
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
      case 'weekly': return theme.primary
      case 'monthly': return theme.accent
      case 'term': return theme.success
      case 'offer': return theme.warning
      default: return theme.primary
    }
  }

  const getTypeIcon = () => {
    switch (pkg.type) {
      case 'weekly': return <Clock size={20} />
      case 'monthly': return <Calendar size={20} />
      case 'term': return <Medal size={20} />
      case 'offer': return <Crown size={20} />
      default: return <BookOpen size={20} />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: (index || 0) * 0.1, type: 'spring', stiffness: 100 }}
      whileHover={{ y: -12, transition: { duration: 0.2 } }}
      className={`${styles.packageCard} ${isPurchased ? styles.purchasedCard : ''} ${isOffer ? styles.offerCard : ''}`}
    >
      {/* Premium Badge for Offers */}
      {pkg.type === 'offer' && !isPurchased && (
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className={styles.premiumBadge}
          style={{
            background: `linear-gradient(135deg, ${theme.warning}, #d97706)`,
            boxShadow: `0 10px 30px ${theme.warning}60`
          }}
        >
          <Crown size={18} />
          <span>حصري</span>
        </motion.div>
      )}

      {/* Purchased Badge */}
      {isPurchased && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={styles.purchasedCheckmark}
          style={{ background: `linear-gradient(135deg, ${theme.success}, #059669)` }}
        >
          <CheckCircle2 size={20} />
        </motion.div>
      )}

      {/* Card Content */}
      <div className={styles.cardWrapper}>
        {/* Image Section */}
        <div className={styles.imageSection}>
          <div className={styles.imageContainer}>
            {pkg.image_url ? (
              <motion.img
                src={pkg.image_url}
                alt={pkg.name}
                className={styles.packageImage}
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.3 }}
              />
            ) : (
              <motion.div
                className={styles.imagePlaceholder}
                style={{
                  background: `linear-gradient(135deg, ${getTypeColor()}30, ${getTypeColor()}10)`,
                }}
                whileHover={{ backgroundColor: `${getTypeColor()}40` }}
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {getTypeIcon()}
                </motion.div>
              </motion.div>
            )}

            <div className={styles.imageOverlay} />

            {/* Type Badge */}
            <motion.div
              className={styles.typeBadge}
              style={{
                background: `linear-gradient(135deg, ${getTypeColor()}, ${getTypeColor()}CC)`,
                boxShadow: `0 10px 30px ${getTypeColor()}50`
              }}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {getTypeIcon()}
              <span>{getTypeLabel()}</span>
            </motion.div>
          </div>
        </div>

        {/* Content Section */}
        <div className={styles.contentSection}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className={styles.headerContent}
          >
            <h3 className={styles.packageName}>{pkg.name}</h3>
            <p className={styles.packageDescription}>
              {pkg.description || `برنامج تعليمي شامل مع ${pkg.lecture_count} محاضرة متخصصة`}
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            className={styles.statsGrid}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className={styles.statItem}>
              <div className={styles.statIconBg} style={{ background: `${theme.primary}20` }}>
                <PlayCircle size={18} style={{ color: theme.primary }} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{pkg.lecture_count || 0}</span>
                <span className={styles.statLabel}>محاضرة</span>
              </div>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statIconBg} style={{ background: `${theme.accent}20` }}>
                <Clock size={18} style={{ color: theme.accent }} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{pkg.duration_days || 30}</span>
                <span className={styles.statLabel}>يوم</span>
              </div>
            </div>
          </motion.div>

          {/* Price Section */}
          <motion.div
            className={styles.priceSection}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <div className={styles.priceWrapper}>
              <span className={styles.priceAmount}>{(pkg.price || 0).toLocaleString()}</span>
              <span className={styles.priceCurrency}>جنيه</span>
            </div>

            {pkg.type === 'offer' && pkg.price && (
              <motion.span
                className={styles.discountLabel}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                توفير 30%
              </motion.span>
            )}
          </motion.div>

          {/* Action Button */}
          <motion.button
            onClick={isPurchased ? onEnter : onPurchase}
            disabled={!pkg.is_active}
            className={`${styles.actionButton} ${isPurchased ? styles.enterBtn : styles.purchaseBtn}`}
            style={isPurchased ? { background: theme.success } : { background: getTypeColor() }}
            whileHover={{ scale: 1.02, boxShadow: `0 15px 40px ${getTypeColor()}40` }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className={styles.buttonText}>
              {isPurchased ? 'دخول للباقة' : !pkg.is_active ? 'غير متاحة' : 'اشترك الآن'}
            </span>
            {isPurchased ? (
              <ArrowRight size={18} />
            ) : (
              <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <ShoppingCart size={18} />
              </motion.div>
            )}
          </motion.button>

          {/* Features List */}
          <motion.div
            className={styles.featuresList}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <div className={styles.featureItem}>
              <Zap size={14} style={{ color: theme.primary }} />
              <span>محتوى حي</span>
            </div>
            <div className={styles.featureItem}>
              <Target size={14} style={{ color: theme.primary }} />
              <span>موجه للنجاح</span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

// مكون الأمواج المتحركة
const WaveSection = ({ color, className }: { color: string, className?: string }) => (
  <div className={`${styles.waveContainer} ${className || ''}`}>
    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.wave}>
      <motion.path
        initial={{ d: "M0,60 C360,120 1080,0 1440,60 L1440,120 L0,120 Z" }}
        animate={{ 
          d: [
            "M0,60 C360,120 1080,0 1440,60 L1440,120 L0,120 Z",
            "M0,60 C360,0 1080,120 1440,60 L1440,120 L0,120 Z",
            "M0,60 C360,120 1080,0 1440,60 L1440,120 L0,120 Z"
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        fill={color}
        fillOpacity="0.1"
      />
    </svg>
  </div>
)

export default function GradePage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClientBrowser()

  const gradeSlug = params?.grade as 'first' | 'second' | 'third'

  // ألوان مخصصة لكل صف
  const gradeThemes = {
    first: {
      primary: '#3b82f6',
      accent: '#06b6d4',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      text: '#1e293b',
      light: '#f0f9ff',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
      waveColor: '#3b82f6'
    },
    second: {
      primary: '#8b5cf6',
      accent: '#ec4899',
      success: '#10b981',
      warning: '#f97316',
      danger: '#ef4444',
      text: '#1e293b',
      light: '#faf5ff',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
      waveColor: '#8b5cf6'
    },
    third: {
      primary: '#dc2626',
      accent: '#f59e0b',
      success: '#10b981',
      warning: '#ea580c',
      danger: '#991b1b',
      text: '#1e293b',
      light: '#fef2f2',
      gradient: 'linear-gradient(135deg, #dc2626 0%, #f59e0b 100%)',
      waveColor: '#dc2626'
    }
  }

  const theme = gradeThemes[gradeSlug] || gradeThemes.first

  const [grade, setGrade] = useState<any>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [userPackages, setUserPackages] = useState<UserPackage[]>([])
  const [user, setUser] = useState<any>(null)
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshingWallet, setIsRefreshingWallet] = useState(false)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)

  const stats = useMemo(() => ({
    totalStudents: 1250,
    successRate: 94,
    activeCourses: 42,
    expertTeachers: 25
  }), [])

  // إصلاح: جلب بيانات المستخدم والمحفظة بشكل صحيح
  const fetchUserData = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        return null
      }

      if (!session?.user) {
        setUser(null)
        return null
      }

      const currentUser = session.user
      setUser(currentUser)

      // جلب أو إنشاء المحفظة
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', currentUser.id)
        .maybeSingle()

      if (walletError && walletError.code !== 'PGRST116') {
        console.error('Wallet fetch error:', walletError)
      }

      if (!walletData) {
        // إنشاء محفظة جديدة إذا لم ت existed
        const { error: createError } = await supabase
          .from('wallets')
          .insert([{ 
            user_id: currentUser.id, 
            balance: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
        
        if (createError) {
          console.error('Create wallet error:', createError)
        }
        setWalletBalance(0)
      } else {
        setWalletBalance(walletData.balance || 0)
      }

      return currentUser
    } catch (err) {
      console.error('Error in fetchUserData:', err)
      return null
    }
  }, [supabase])

  const fetchPackages = useCallback(async (userId?: string) => {
    try {
      // جلب الباقات المتاحة للصف
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .eq('grade', gradeSlug)
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (packagesError) throw packagesError
      setPackages(packagesData || [])

      // إذا كان هناك مستخدم، جلب باقاته
      if (userId) {
        const { data: userPackagesData, error: userPackagesError } = await supabase
          .from('user_packages')
          .select(`
            *,
            packages:package_id (*)
          `)
          .eq('user_id', userId)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())

        if (userPackagesError) throw userPackagesError
        
        const validUserPackages = (userPackagesData || []).filter((up: any) => up.packages !== null)
        setUserPackages(validUserPackages as UserPackage[])
      }

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

    } catch (err: any) {
      console.error('Error fetching packages:', err)
      setError(err.message)
    }
  }, [gradeSlug, supabase])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const currentUser = await fetchUserData()
      await fetchPackages(currentUser?.id)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }, [fetchUserData, fetchPackages])

  // إضافة listener لتحديث المحفظة في الوقت الفعلي
  useEffect(() => {
    fetchData()

    if (user?.id) {
      const channel = supabase
        .channel(`wallet-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallets',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.new && 'balance' in payload.new) {
              setWalletBalance(payload.new.balance as number)
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [fetchData, user?.id])

  const refreshWalletBalance = useCallback(async () => {
    if (!user?.id) return
    setIsRefreshingWallet(true)
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single()
      
      if (!error && data) {
        setWalletBalance(data.balance)
      }
    } catch (err) {
      console.error('Error refreshing wallet:', err)
    } finally {
      setIsRefreshingWallet(false)
    }
  }, [user, supabase])

  const isPackagePurchased = useCallback((packageId: string) => {
    return userPackages.some(up => up.package_id === packageId)
  }, [userPackages])

  const purchasedPackages = useMemo(() => {
    return userPackages
      .filter(up => up.is_active && up.packages)
      .map(up => up.packages)
      .filter((pkg): pkg is Package => pkg !== null)
  }, [userPackages])

  const availablePackages = useMemo(() => {
    const purchasedIds = new Set(userPackages.map(up => up.package_id))
    return packages.filter(pkg => !purchasedIds.has(pkg.id))
  }, [packages, userPackages])

  const packagesByType = useMemo(() => ({
    weekly: availablePackages.filter(p => p.type === 'weekly'),
    monthly: availablePackages.filter(p => p.type === 'monthly'),
    term: availablePackages.filter(p => p.type === 'term'),
    offer: availablePackages.filter(p => p.type === 'offer')
  }), [availablePackages])

  const handlePurchaseClick = useCallback((pkg: Package) => {
    if (!user) {
      // حفظ URL الحالي للعودة إليه بعد تسجيل الدخول
      const returnUrl = `/grades/${gradeSlug}`
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)
      return
    }

    if (isPackagePurchased(pkg.id)) {
      handleEnterPackage(pkg.id)
      return
    }

    setSelectedPackage(pkg)
    setShowPurchaseModal(true)
  }, [user, gradeSlug, isPackagePurchased, router])

  const handleEnterPackage = useCallback((pkgId: string) => {
    router.push(`/grades/${gradeSlug}/packages/${pkgId}`)
  }, [gradeSlug, router])

  const handlePurchaseSuccess = useCallback(async (packageId: string) => {
    setShowPurchaseModal(false)
    await fetchData() // إعادة تحميل البيانات لتحديث الاشتراكات والمحفظة
    setTimeout(() => {
      router.push(`/grades/${gradeSlug}/packages/${packageId}`)
    }, 500)
  }, [fetchData, gradeSlug, router])

  if (loading) {
    return (
      <div className={styles.loadingContainer} style={{ background: theme.light }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 size={48} style={{ color: theme.primary }} />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={styles.loadingText}
        >
          جاري تحميل البيانات...
        </motion.p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={styles.errorCard}
        >
          <AlertCircle size={48} style={{ color: theme.danger }} />
          <h3 className={styles.errorTitle}>حدث خطأ</h3>
          <p className={styles.errorMessage}>{error}</p>
          <motion.button
            onClick={fetchData}
            className={styles.retryButton}
            style={{ background: theme.primary }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            إعادة المحاولة
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer} style={{ background: theme.light }}>
      {/* Wave Background */}
      <WaveSection color={theme.waveColor} />
      
      {/* Header Section */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          {/* Platform Branding */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.platformInfo}
          >
            <motion.h1
              className={styles.platformTitle}
              style={{
                background: theme.gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              البارع محمود الديب
            </motion.h1>
            <p className={styles.platformSubtitle}>منارة العلم والتميز</p>
            <motion.div
              className={styles.encouragement}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles size={16} />
              <span>رحلتك نحو التميز تبدأ من هنا</span>
              <Sparkles size={16} />
            </motion.div>
          </motion.div>

          {/* Wallet Card - Fixed */}
          {user && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              className={styles.walletCard}
              style={{
                background: `linear-gradient(135deg, ${theme.primary}15, ${theme.accent}15)`,
                border: `2px solid ${theme.primary}30`,
              }}
            >
              <div className={styles.walletContent}>
                <motion.div
                  className={styles.walletIconWrapper}
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Wallet size={24} style={{ color: theme.primary }} />
                </motion.div>

                <div className={styles.walletInfo}>
                  <p className={styles.walletLabel}>رصيد المحفظة</p>
                  <motion.p
                    className={styles.walletBalance}
                    key={walletBalance}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    <span style={{ color: theme.primary, fontWeight: 'bold', fontSize: '1.5rem' }}>
                      {walletBalance.toLocaleString()}
                    </span>
                    <span style={{ color: theme.text, fontSize: '0.9rem' }}> جنيه</span>
                  </motion.p>
                </div>

                <div className={styles.walletActions}>
                  <motion.button
                    className={styles.refreshBtn}
                    onClick={refreshWalletBalance}
                    disabled={isRefreshingWallet}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="تحديث الرصيد"
                  >
                    <motion.div
                      animate={isRefreshingWallet ? { rotate: 360 } : { rotate: 0 }}
                      transition={{ duration: 1, repeat: isRefreshingWallet ? Infinity : 0, ease: "linear" }}
                    >
                      <RefreshCw size={18} />
                    </motion.div>
                  </motion.button>

                  {walletBalance < 100 && (
                    <motion.button
                      className={styles.addBalanceBtn}
                      onClick={() => router.push('/wallet')}
                      style={{ background: theme.warning }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      إضافة رصيد
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Grade Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={styles.gradeCard}
          style={{
            background: theme.gradient,
            boxShadow: `0 20px 40px ${theme.primary}30`
          }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <GraduationCap size={48} className={styles.gradeIcon} />
          </motion.div>
          <div>
            <h2 className={styles.gradeName}>{grade?.name}</h2>
            <p className={styles.gradeDesc}>رحلة نحو التميز الأكاديمي</p>
          </div>
        </motion.div>
      </header>

      {/* Stats Section */}
      <div className={styles.statsContainer}>
        <div className={styles.statsGrid}>
          {[
            { icon: Users, label: 'طالب متفوق', value: stats.totalStudents, suffix: '+', color: theme.primary },
            { icon: TrendingUp, label: 'نسبة النجاح', value: stats.successRate, suffix: '%', color: theme.success },
            { icon: BookOpen, label: 'دورة نشطة', value: stats.activeCourses, suffix: '+', color: theme.accent },
            { icon: Award, label: 'خبير تعليمي', value: stats.expertTeachers, suffix: '+', color: theme.warning },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={styles.statCard}
              style={{
                background: `linear-gradient(135deg, white, ${stat.color}10)`,
                border: `1px solid ${stat.color}20`,
              }}
              whileHover={{
                transform: 'translateY(-8px)',
                boxShadow: `0 20px 40px ${stat.color}20`
              }}
            >
              <div className={styles.statIconContainer} style={{ background: `${stat.color}15` }}>
                <stat.icon size={24} style={{ color: stat.color }} />
              </div>
              <div>
                <motion.p className={styles.statValue} style={{ color: stat.color }}>
                  {stat.value}{stat.suffix}
                </motion.p>
                <p className={styles.statLabel}>{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Purchased Packages Section */}
        <AnimatePresence>
          {purchasedPackages.length > 0 && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={styles.section}
            >
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconContainer} style={{ background: `${theme.success}20` }}>
                  <BookMarked size={24} style={{ color: theme.success }} />
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>اشتراكاتك</h2>
                  <p className={styles.sectionSubtitle}>الباقات التي قمت بشرائها</p>
                </div>
                <span className={styles.badge} style={{ background: theme.success }}>
                  {purchasedPackages.length}
                </span>
              </div>

              <div className={styles.packagesGrid}>
                {purchasedPackages.map((pkg, idx) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    isPurchased={true}
                    onEnter={() => handleEnterPackage(pkg.id)}
                    theme={theme}
                    index={idx}
                  />
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Offer Packages Section */}
        {packagesByType.offer.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={styles.section}
          >
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconContainer} style={{ background: `${theme.warning}20` }}>
                <Crown size={24} style={{ color: theme.warning }} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>عروض VIP حصرية</h2>
                <p className={styles.sectionSubtitle}>فرص ذهبية بخصومات استثنائية</p>
              </div>
              <span className={styles.badge} style={{ background: theme.warning }}>محدودة</span>
            </div>

            <div className={`${styles.packagesGrid} ${styles.offerGrid}`}>
              {packagesByType.offer.map((pkg, idx) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isPurchased={false}
                  onPurchase={() => handlePurchaseClick(pkg)}
                  theme={theme}
                  index={idx}
                  isOffer={true}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Monthly & Term Packages */}
        {(packagesByType.monthly.length > 0 || packagesByType.term.length > 0) && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={styles.section}
          >
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconContainer} style={{ background: `${theme.accent}20` }}>
                <Medal size={24} style={{ color: theme.accent }} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>باقات التميز</h2>
                <p className={styles.sectionSubtitle}>برامج تعليمية متكاملة</p>
              </div>
            </div>

            <div className={styles.packagesGrid}>
              {[...packagesByType.monthly, ...packagesByType.term].map((pkg, idx) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isPurchased={false}
                  onPurchase={() => handlePurchaseClick(pkg)}
                  theme={theme}
                  index={idx}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Weekly Packages */}
        {packagesByType.weekly.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={styles.section}
          >
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconContainer} style={{ background: `${theme.primary}20` }}>
                <Star size={24} style={{ color: theme.primary }} />
              </div>
              <div>
                <h2 className={styles.sectionTitle}>باقات البداية</h2>
                <p className={styles.sectionSubtitle}>ابدأ رحلتك من اليوم</p>
              </div>
            </div>

            <div className={styles.packagesGrid}>
              {packagesByType.weekly.map((pkg, idx) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isPurchased={false}
                  onPurchase={() => handlePurchaseClick(pkg)}
                  theme={theme}
                  index={idx}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Empty State */}
        {packages.length === 0 && purchasedPackages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.emptyState}
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <BookOpen size={64} style={{ color: theme.primary, opacity: 0.5 }} />
            </motion.div>
            <h3 className={styles.emptyTitle}>لا توجد باقات متاحة</h3>
            <p className={styles.emptyText}>سيتم إضافة باقات جديدة قريباً</p>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className={styles.footer} style={{ background: theme.text, color: 'white' }}>
        <div className={styles.footerContent}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.footerBrand}
          >
            <Crown size={24} style={{ color: theme.warning }} />
            <span>البارع محمود الديب</span>
          </motion.div>
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

      {/* Purchase Modal */}
      <AnimatePresence>
        {showPurchaseModal && selectedPackage && (
          <PurchaseModal
            pkg={selectedPackage}
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