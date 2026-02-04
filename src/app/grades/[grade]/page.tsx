'use client'

import React from "react"
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence, useScroll, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import {
  Wallet, BookOpen, GraduationCap, Loader2, AlertCircle,
  Crown, Sparkles, Clock, Calendar, Medal, PlayCircle,
  CheckCircle2, ArrowRight, ShoppingCart, RefreshCw,
  Ticket, CreditCard, X, Shield, Gift, Zap, Star,
  ChevronLeft, Award, BookMarked, ArrowLeft, Users,
  Award as AwardIcon, Book, Video, FileText, Check
} from 'lucide-react'
import styles from './GradePage.module.css'

// Import actions
import {
  deductWalletBalance,
  markCodeAsUsed,
  createUserPackage,
  validateCode,
  getWalletBalance
} from './actions'

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
  original_price?: number
  discount_percentage?: number
  features?: string[]
  instructor?: string
  rating?: number
  students_count?: number
  created_at?: string
  updated_at?: string
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
  gradient: string
  light: string
  dark: string
  glow: string
}

const themes: Record<string, ThemeType> = {
  first: {
    primary: '#1a1a2e',
    secondary: '#16213e',
    accent: '#e94560',
    gradient: 'from-slate-900 via-slate-800 to-rose-900',
    light: '#f8fafc',
    dark: '#0f172a',
    glow: 'rgba(233, 69, 96, 0.3)'
  },
  second: {
    primary: '#1a1a2e',
    secondary: '#0f3460',
    accent: '#00b4d8',
    gradient: 'from-slate-900 via-blue-900 to-cyan-900',
    light: '#f0f9ff',
    dark: '#0c4a6e',
    glow: 'rgba(0, 180, 216, 0.3)'
  },
  third: {
    primary: '#1a1a2e',
    secondary: '#2d132c',
    accent: '#ee6c4d',
    gradient: 'from-slate-900 via-rose-900 to-orange-900',
    light: '#fff7ed',
    dark: '#7c2d12',
    glow: 'rgba(238, 108, 77, 0.3)'
  }
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

  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ container: containerRef })
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const spotlightBackground = useMotionTemplate`radial-gradient(800px circle at ${mouseX}px ${mouseY}px, ${theme.accent}15, transparent 40%)`

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }, [mouseX, mouseY])

  const [packages, setPackages] = useState<Package[]>([])
  const [userPackages, setUserPackages] = useState<UserPackage[]>([])
  const [user, setUser] = useState<any>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'purchased' | 'offers'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

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

      // Fetch packages for this grade
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .eq('grade', gradeSlug)
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (packagesError) throw packagesError

      const enhancedPackages = packagesData?.map(pkg => ({
        ...pkg,
        features: pkg.features || [
          `${pkg.lecture_count} محاضرة تفاعلية`,
          'وصول كامل لمدة ' + pkg.duration_days + ' يوم',
          'دعم فني على مدار الساعة',
          'شهادة إتمام'
        ],
        original_price: pkg.type === 'offer' ? Math.round(pkg.price * 1.3) : undefined,
        instructor: pkg.instructor || 'أستاذ محمود الديب',
        rating: pkg.rating || 4.9,
        students_count: pkg.students_count || 1500,
        created_at: pkg.created_at,
        updated_at: pkg.updated_at
      })) || []

      setPackages(enhancedPackages)

      // Fetch wallet balance
      const walletResult = await getWalletBalance(currentUser.id)
      if (walletResult.success && walletResult.data) {
        setWalletBalance(walletResult.data.balance || 0)
      }

      // Fetch user packages
      const { data: userPkgs, error: userPkgsError } = await supabase
        .from('user_packages')
        .select('*, packages:package_id(*)')
        .eq('user_id', currentUser.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())

      if (userPkgsError) throw userPkgsError
      setUserPackages(userPkgs as UserPackage[] || [])

    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(err.message || 'حدث خطأ أثناء جلب البيانات')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [gradeSlug, supabase, isRefreshing])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`wallet-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wallets',
        filter: `user_id=eq.${user.id}`
      }, async (payload: any) => {
        if (payload.new?.balance !== undefined) {
          setWalletBalance(payload.new.balance)
        } else {
          const result = await getWalletBalance(user.id)
          if (result.success && result.data) {
            setWalletBalance(result.data.balance ?? 0)
          }
        }
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id, supabase])

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

  const filteredPackages = useMemo(() => {
    switch (activeTab) {
      case 'purchased': return purchased
      case 'offers': return offers
      default: return [...purchased, ...available, ...offers]
    }
  }, [purchased, available, offers, activeTab])

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

  const getGradeName = () => {
    switch(gradeSlug) {
      case 'first': return 'الصف الأول الثانوي'
      case 'second': return 'الصف الثاني الثانوي'
      case 'third': return 'الصف الثالث الثانوي'
      default: return 'الصف الدراسي'
    }
  }

  const getGradeSubtitle = () => {
    switch(gradeSlug) {
      case 'first': return 'المرحلة الأولى من التعليم الثانوي - بناء أساس قوي'
      case 'second': return 'المرحلة المتوسطة - تطوير المهارات والمعرفة'
      case 'third': return 'المرحلة النهائية - الاستعداد للجامعة'
      default: return 'اختر باقتك المثالية'
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingLogo}>
            <motion.div 
              className={styles.loadingRing} 
              animate={{ rotate: 360 }} 
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }} 
            />
            <Crown className={styles.loadingIcon} size={32} />
          </div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }}
          >
            جاري تحميل البيانات
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.5 }}
          >
            نحضر لك أفضل المحتوى التعليمي...
          </motion.p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pageWrapper} ref={containerRef} onMouseMove={handleMouseMove}>
      <motion.div className={styles.spotlight} style={{ background: spotlightBackground }} />
      <motion.div
        className={styles.progressIndicator}
        style={{ scaleX }}
      />

      {/* Floating Elements */}
      <div className={styles.floatingElements}>
        {[...Array(6)].map((_, i) => (
          <motion.div 
            key={i} 
            className={styles.floatingOrb}
            animate={{ 
              y: [0, -30, 0], 
              x: [0, Math.sin(i) * 20, 0], 
              scale: [1, 1.1, 1], 
            }}
            transition={{ 
              duration: 4 + i, 
              repeat: Infinity, 
              delay: i * 0.5, 
              ease: "easeInOut" 
            }}
            style={{ 
              left: `${15 + i * 15}%`, 
              top: `${20 + (i % 3) * 25}%`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerContent}>
            {/* Logo */}
            <motion.div 
              initial={{ x: -30, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              className={styles.brand}
            >
              <div className={styles.logoMark}>
                <Crown size={24} />
              </div>
              <div className={styles.brandInfo}>
                <span className={styles.brandName}>البارع محمود الديب</span>
                <span className={styles.brandTagline}>منارة العلم والتميز</span>
              </div>
            </motion.div>

            {/* Wallet or Login */}
            {user ? (
              <motion.div 
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={styles.walletWidget}
              >
                <div className={styles.walletContent}>
                  <div className={styles.walletIconWrapper}>
                    <Wallet size={18} />
                  </div>
                  <div className={styles.walletInfo}>
                    <span className={styles.walletLabel}>رصيدك</span>
                    <span className={styles.walletAmount}>{walletBalance.toLocaleString()} ج.م</span>
                  </div>
                </div>
                <motion.button 
                  className={styles.refreshButton}
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  whileHover={{ rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <RefreshCw size={16} className={isRefreshing ? styles.spinning : ''} />
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={styles.loginButton}
                onClick={() => router.push(`/login?returnUrl=/grades/${gradeSlug}`)}
              >
                <span>تسجيل الدخول</span>
                <ArrowLeft size={18} />
              </motion.button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContainer}>
          <motion.div 
            initial={{ y: 40, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.1 }} 
            className={styles.heroContent}
          >
            <div className={styles.gradeIconWrapper}>
              <motion.div 
                className={styles.gradeIcon} 
                whileHover={{ scale: 1.1, rotate: 5 }} 
              >
                <GraduationCap size={40} />
              </motion.div>
            </div>
            <h1 className={styles.heroTitle}>{getGradeName()}</h1>
            <p className={styles.heroSubtitle}>{getGradeSubtitle()}</p>
            
            <div className={styles.heroStats}>
              <div className={styles.heroStatItem}>
                <span className={styles.heroStatValue}>{packages.length}+</span>
                <span className={styles.heroStatLabel}>باقة متاحة</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStatItem}>
                <span className={styles.heroStatValue}>{purchased.length}</span>
                <span className={styles.heroStatLabel}>اشتراك نشط</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStatItem}>
                <span className={styles.heroStatValue}>{offers.length}</span>
                <span className={styles.heroStatLabel}>عرض خاص</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav className={styles.tabsNav}>
        <div className={styles.tabsContainer}>
          <div className={styles.tabsList}>
            {[
              { id: 'all', label: 'جميع الباقات', icon: BookOpen, count: purchased.length + available.length + offers.length },
              { id: 'purchased', label: 'اشتراكاتي', icon: CheckCircle2, count: purchased.length, show: purchased.length > 0 },
              { id: 'offers', label: 'العروض', icon: Sparkles, count: offers.length, show: offers.length > 0 }
            ].map((tab) => (
              tab.show !== false && (
                <motion.button 
                  key={tab.id} 
                  className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab.id as any)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
                  <span className={styles.tabCount}>{tab.count}</span>
                  {activeTab === tab.id && (
                    <motion.div className={styles.tabIndicator} layoutId="activeTab" />
                  )}
                </motion.button>
              )
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.contentContainer}>
          {/* Quick Stats for logged in users */}
          {user && purchased.length > 0 && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              className={styles.quickStats}
            >
              {[
                { icon: BookMarked, label: 'باقة نشطة', value: purchased.length },
                { icon: PlayCircle, label: 'محاضرة متاحة', value: purchased.reduce((acc, p) => acc + (p.lecture_count || 0), 0) },
                { icon: Clock, label: 'يوم متبقي', value: Math.max(0, Math.ceil(userPackages.reduce((acc, up) => acc + (new Date(up.expires_at).getTime() - Date.now()), 0) / (1000 * 60 * 60 * 24))) }
              ].map((stat, idx) => (
                <motion.div 
                  key={idx} 
                  className={styles.quickStatCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className={styles.quickStatIcon}>
                    <stat.icon size={22} />
                  </div>
                  <div className={styles.quickStatInfo}>
                    <span className={styles.quickStatValue}>{stat.value}</span>
                    <span className={styles.quickStatLabel}>{stat.label}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Error Alert */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={styles.errorAlert}
              >
                <AlertCircle size={20} />
                <span>{error}</span>
                <button onClick={fetchData}>إعادة المحاولة</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Packages Grid */}
          <motion.div layout className={styles.packagesGrid}>
            <AnimatePresence mode="popLayout">
              {filteredPackages.map((pkg: any, index) => (
                <PackageCard 
                  key={pkg.id}
                  pkg={pkg}
                  isPurchased={purchased.some(p => p.id === pkg.id)}
                  theme={theme}
                  index={index}
                  onPurchase={() => handlePurchaseClick(pkg)}
                  onEnter={() => handleEnterPackage(pkg.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Empty State */}
          {filteredPackages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={styles.emptyState}
            >
              <div className={styles.emptyIcon}>
                <BookOpen size={48} />
              </div>
              <h3>لا توجد باقات متاحة</h3>
              <p>سيتم إضافة باقات جديدة قريباً</p>
            </motion.div>
          )}
        </div>
      </main>

      {/* Purchase Modal */}
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
              setShowConfetti(true)
              setTimeout(() => setShowConfetti(false), 5000)
            }}
            gradeSlug={gradeSlug}
          />
        )}
      </AnimatePresence>

      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && <ConfettiEffect theme={theme} />}
      </AnimatePresence>
    </div>
  )
}

// Package Card Component
function PackageCard({ pkg, isPurchased, theme, index, onPurchase, onEnter }: any) {
  const getTypeLabel = () => {
    switch (pkg.type) {
      case 'weekly': return 'أسبوعي'
      case 'monthly': return 'شهري'
      case 'term': return 'ترم كامل'
      case 'offer': return 'عرض خاص'
      default: return pkg.type
    }
  }

  const getTypeIcon = () => {
    switch (pkg.type) {
      case 'weekly': return <Clock size={14} />
      case 'monthly': return <Calendar size={14} />
      case 'term': return <Medal size={14} />
      case 'offer': return <Zap size={14} />
      default: return <BookOpen size={14} />
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-EG', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 100, damping: 20 }}
      className={`${styles.packageCard} ${isPurchased ? styles.cardPurchased : ''} ${pkg.type === 'offer' ? styles.cardOffer : ''}`}
    >
      {/* Status Badge */}
      {(isPurchased || pkg.type === 'offer') && (
        <motion.div
          className={`${styles.statusBadge} ${isPurchased ? styles.badgePurchased : styles.badgeOffer}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
        >
          {isPurchased ? <CheckCircle2 size={12} /> : <Zap size={12} />}
          <span>{isPurchased ? 'مفعّل' : 'عرض خاص'}</span>
        </motion.div>
      )}

      {/* Discount Badge */}
      {pkg.original_price && (
        <motion.div
          className={styles.discountBadge}
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Sparkles size={12} />
          <span>خصم {Math.round((1 - pkg.price/pkg.original_price) * 100)}%</span>
        </motion.div>
      )}

      {/* Card Image */}
      <div className={styles.cardImageSection}>
        {pkg.image_url ? (
          <img src={pkg.image_url} alt={pkg.name} className={styles.cardImage} loading="lazy" />
        ) : (
          <div className={styles.cardImagePlaceholder}>
            <GraduationCap size={48} />
          </div>
        )}
        <div className={styles.cardImageOverlay} />
        
        {/* Type Badge */}
        <div className={`${styles.typeBadge} ${styles[`type${pkg.type.charAt(0).toUpperCase() + pkg.type.slice(1)}`]}`}>
          {getTypeIcon()}
          <span>{getTypeLabel()}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{pkg.name}</h3>
        <p className={styles.cardDescription}>{pkg.description}</p>

        {/* Features */}
        <ul className={styles.featureList}>
          {pkg.features?.slice(0, 3).map((feature: string, i: number) => (
            <li key={i}>
              <CheckCircle2 size={14} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* Stats Row */}
        <div className={styles.cardStatsRow}>
          <div className={styles.cardStat}>
            <PlayCircle size={16} />
            <span>{pkg.lecture_count} محاضرة</span>
          </div>
          <div className={styles.cardStat}>
            <Clock size={16} />
            <span>{pkg.duration_days} يوم</span>
          </div>
        </div>

        {/* Metadata */}
        <div className={styles.metadataRow}>
          <div className={styles.metadataItem}>
            <Users size={14} />
            <span>{pkg.students_count?.toLocaleString() || 0} طالب</span>
          </div>
          <div className={styles.metadataItem}>
            <Star size={14} className={styles.starIcon} />
            <span>{pkg.rating}</span>
          </div>
        </div>

        {/* Last Updated */}
        {pkg.updated_at && (
          <div className={styles.updatedInfo}>
            <RefreshCw size={12} />
            <span>آخر تحديث: {formatDate(pkg.updated_at)}</span>
          </div>
        )}

        {/* Footer */}
        <div className={styles.cardFooter}>
          <div className={styles.priceSection}>
            {pkg.original_price && (
              <span className={styles.originalPrice}>{pkg.original_price.toLocaleString()} ج.م</span>
            )}
            <span className={styles.currentPrice}>
              {pkg.price.toLocaleString()}
              <small> ج.م</small>
            </span>
          </div>

          {isPurchased ? (
            <motion.button
              className={styles.enterButton}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onEnter}
            >
              <span>دخول</span>
              <ChevronLeft size={18} />
            </motion.button>
          ) : (
            <motion.button
              className={styles.purchaseButton}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onPurchase}
            >
              <span>اشترك الآن</span>
              <ShoppingCart size={18} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Purchase Modal Component
function PurchaseModal({ pkg, user, walletBalance, theme, onClose, onSuccess, gradeSlug }: any) {
  const [method, setMethod] = useState<'wallet' | 'code'>('wallet')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [codeDetails, setCodeDetails] = useState<any>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handlePurchase = async () => {
    setLoading(true)
    setError('')

    try {
      if (method === 'wallet') {
        if (walletBalance < pkg.price) {
          throw new Error('رصيد غير كافٍ. يرجى شحن المحفظة أولاً.')
        }

        const deductResult = await deductWalletBalance(user.id, pkg.price, pkg.id)
        if (!deductResult.success) {
          throw new Error(deductResult.message || 'فشل في خصم المبلغ من المحفظة')
        }

        const pkgResult = await createUserPackage(user.id, pkg.id, pkg.duration_days || 30, 'wallet')
        if (!pkgResult.success) {
          throw new Error(pkgResult.message || 'فشل في تفعيل الباقة')
        }
      } else if (method === 'code') {
        if (!code.trim()) {
          throw new Error('الرجاء إدخال كود التفعيل')
        }

        const validateResult = await validateCode(code.toUpperCase(), gradeSlug, pkg.id)
        if (!validateResult.success) {
          throw new Error(validateResult.message || 'كود غير صالح')
        }

        const markResult = await markCodeAsUsed(validateResult.data.id, user.id)
        if (!markResult.success) {
          throw new Error(markResult.message || 'فشل في استخدام الكود')
        }

        const pkgResult = await createUserPackage(user.id, pkg.id, pkg.duration_days || 30, 'code')
        if (!pkgResult.success) {
          throw new Error(pkgResult.message || 'فشل في تفعيل الباقة')
        }

        setCodeDetails(validateResult.data)
      }

      setShowSuccess(true)

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'تم الشراء بنجاح!',
        message: `تم تفعيل ${pkg.name} بنجاح`,
        type: 'success'
      })

      setTimeout(() => {
        onSuccess()
      }, 2000)

    } catch (err: any) {
      console.error('Purchase error:', err)
      setError(err.message || 'حدث خطأ أثناء عملية الشراء')
    } finally {
      setLoading(false)
    }
  }

  const canPurchase = () => {
    if (method === 'wallet') {
      return walletBalance >= pkg.price
    } else {
      return code.trim().length > 0
    }
  }

  return (
    <motion.div
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={styles.modalContent}
        onClick={e => e.stopPropagation()}
      >
        {showSuccess ? (
          <motion.div
            className={styles.successView}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              className={styles.successIcon}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5 }}
            >
              <CheckCircle2 size={64} />
            </motion.div>
            <h3>تم الشراء بنجاح!</h3>
            <p>يمكنك الآن الوصول إلى جميع محتويات الباقة</p>
          </motion.div>
        ) : (
          <>
            <button className={styles.modalClose} onClick={onClose}>
              <X size={24} />
            </button>

            <div className={styles.modalHeader}>
              <div className={styles.modalIconWrapper}>
                <Gift size={28} />
              </div>
              <h3>{pkg.name}</h3>
              <div className={styles.modalPrice}>
                <span className={styles.priceValue}>{pkg.price.toLocaleString()}</span>
                <span className={styles.priceCurrency}>جنيه مصري</span>
              </div>
              {pkg.original_price && (
                <span className={styles.modalOriginalPrice}>{pkg.original_price.toLocaleString()} ج.م</span>
              )}
            </div>

            <div className={styles.modalBody}>
              <div className={styles.paymentMethods}>
                <motion.button 
                  className={`${styles.methodCard} ${method === 'wallet' ? styles.methodActive : ''}`}
                  onClick={() => {setMethod('wallet'); setError('')}}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={styles.methodIcon}>
                    <CreditCard size={22} />
                  </div>
                  <div className={styles.methodInfo}>
                    <strong>الدفع من المحفظة</strong>
                    <span>رصيدك: <b className={walletBalance >= pkg.price ? styles.sufficient : styles.insufficient}>{walletBalance.toLocaleString()} ج.م</b></span>
                  </div>
                  <div className={styles.methodCheck}>
                    {walletBalance >= pkg.price ? (
                      <CheckCircle2 size={20} className={styles.checkSuccess} />
                    ) : (
                      <AlertCircle size={20} className={styles.checkError} />
                    )}
                  </div>
                </motion.button>

                <motion.button 
                  className={`${styles.methodCard} ${method === 'code' ? styles.methodActive : ''}`}
                  onClick={() => {setMethod('code'); setError('')}}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`${styles.methodIcon} ${styles.methodIconCode}`}>
                    <Ticket size={22} />
                  </div>
                  <div className={styles.methodInfo}>
                    <strong>كود التفعيل</strong>
                    <span>أدخل الكود للتفعيل الفوري</span>
                  </div>
                </motion.button>
              </div>

              {method === 'code' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={styles.codeInputSection}
                >
                  <input 
                    type="text" 
                    value={code} 
                    onChange={e => setCode(e.target.value.toUpperCase())} 
                    placeholder="أدخل الكود هنا"
                    maxLength={20}
                    disabled={loading}
                    className={styles.codeInput}
                  />
                </motion.div>
              )}

              {method === 'wallet' && walletBalance < pkg.price && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={styles.insufficientWarning}
                >
                  <AlertCircle size={18} />
                  <div>
                    <strong>رصيد غير كافٍ</strong>
                    <span>يرجى شحن محفظتك أولاً</span>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.errorMessage}
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </motion.div>
              )}

              <motion.button 
                className={styles.confirmButton}
                onClick={handlePurchase}
                disabled={!canPurchase() || loading}
                whileHover={canPurchase() && !loading ? { scale: 1.02 } : {}}
                whileTap={canPurchase() && !loading ? { scale: 0.98 } : {}}
              >
                {loading ? (
                  <><Loader2 className={styles.spinning} size={20} /> جاري المعالجة...</>
                ) : (
                  <><span>تأكيد الشراء</span><ArrowLeft size={20} /></>
                )}
              </motion.button>

              <div className={styles.securityNote}>
                <Shield size={16} />
                <span>معاملة آمنة ومشفرة 100%</span>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// Confetti Effect
function ConfettiEffect({ theme }: { theme: ThemeType }) {
  return (
    <div className={styles.confettiContainer}>
      {[...Array(50)].map((_, i) => {
        const colors = [theme.primary, theme.accent, theme.secondary, '#f59e0b', '#10b981', '#ec4899']
        const color = colors[Math.floor(Math.random() * colors.length)]
        
        return (
          <motion.div
            key={i}
            className={styles.confettiPiece}
            initial={{ 
              top: -10, 
              left: Math.random() * 100 + '%',
              rotate: 0,
              scale: 0
            }}
            animate={{ 
              top: '110%', 
              left: `${Math.random() * 100}%`,
              rotate: Math.random() * 720,
              scale: Math.random() * 0.5 + 0.5
            }}
            transition={{ 
              duration: Math.random() * 3 + 2,
              ease: "linear"
            }}
            style={{
              backgroundColor: color,
              width: Math.random() * 12 + 6,
              height: Math.random() * 12 + 6,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px'
            }}
          />
        )
      })}
    </div>
  )
}