'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence, useScroll, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Wallet, BookOpen, GraduationCap, Loader2, AlertCircle,
  Crown, Sparkles, Clock, Calendar, Medal, PlayCircle,
  CheckCircle2, ArrowRight, ShoppingCart, RefreshCw, 
  Ticket, CreditCard, X, Shield, Gift, Zap, Star,
  ChevronLeft, Award, BookMarked, Users, Target, Rocket,
  TrendingUp, ShieldCheck, Headphones, Video, Download,
  BarChart, Globe, Coffee, Moon, Sun, Battery,
  BatteryCharging, Cloud, Cpu, Database, Wifi, ZapOff,
  Layers, Package, Filter, Grid, List, Heart,
  Share2, Eye, EyeOff, Lock, Unlock, Key,
  Bell, BellRing, Home, Search, User, Settings,
  HelpCircle, Info, ExternalLink, Maximize2, Minimize2,
  RotateCcw, Power, Trash2, Edit2, MoreVertical,
  MoreHorizontal, Phone, Mail, MessageSquare,
  Send, ThumbsUp, ThumbsDown, Flag, Bookmark,
  Hash, Percent, DollarSign, Euro, Bitcoin,
  CreditCard as CreditCardIcon, Banknote, Coins,
  Wallet as WalletIcon, Receipt, FileText, Archive,
  Folder, FolderOpen, File, Image, FileImage,
  Music, Film, Camera, Mic, Volume2, VolumeX,
  Headphones as HeadphonesIcon, Radio, Tv, Monitor,
  Smartphone, Tablet, Laptop, Server, Router,
  HardDrive, Cpu as CpuIcon, MemoryStick,
  Mouse, Keyboard, Printer, Webcam,
  MousePointer, Touchpad,
  Bluetooth, WifiOff, Network, Navigation,
  Map, MapPin, Navigation2, Compass, Globe2,
  Earth, Sun as SunIcon, Moon as MoonIcon, CloudRain,
  CloudSnow, CloudLightning, CloudDrizzle, CloudFog,
  Wind, Thermometer, Droplets, Umbrella, Snowflake,
 Flame
} from 'lucide-react'
import styles from './GradePage.module.css'

// استيراد الأكشنز الحقيقية من ملف الأكشنز
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
  original_price?: number
  discount_percentage?: number
  features?: string[]
  instructor?: string
  rating?: number
  students_count?: number
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
}

// الألوان المُحسّنة لكل صف
const themes: Record<string, ThemeType> = {
  first: {
    primary: '#4f46e5',
    secondary: '#4338ca',
    accent: '#06b6d4',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 50%, #06b6d4 100%)',
    light: '#f0f4ff',
    dark: '#1e1b4b'
  },
  second: {
    primary: '#059669',
    secondary: '#047857',
    accent: '#84cc16',
    gradient: 'linear-gradient(135deg, #059669 0%, #047857 50%, #84cc16 100%)',
    light: '#f0fdf4',
    dark: '#064e3b'
  },
  third: {
    primary: '#dc2626',
    secondary: '#b91c1c',
    accent: '#f59e0b',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #f59e0b 100%)',
    light: '#fef2f2',
    dark: '#7f1d1d'
  }
}

// مكون تحميل متقدم
const LoadingScreen = ({ theme }: { theme: ThemeType }) => (
  <div className={styles.loadingScreen} style={{ background: theme.light }}>
    <div className={styles.loadingContent}>
      <motion.div 
        className={styles.neonLoader}
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className={styles.loaderBar}
            style={{ 
              background: theme.gradient,
              transform: `rotate(${i * 45}deg)`
            }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity }}
          />
        ))}
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{ color: theme.dark }}
      >
        جاري تحميل عالم المعرفة
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        نجهز لك تجربة تعليمية استثنائية...
      </motion.p>
    </div>
  </div>
)

// مكون أيقونة بديل للـ Brain
const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
)

// أيقونات وسائل التواصل الاجتماعي
const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.213c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
  </svg>
)

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
)

const YoutubeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
)

export default function GradePageNew() {
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
  const scaleX = useSpring(scrollYProgress, { stiffness: 150, damping: 30, restDelta: 0.001 })
  
  // Mouse position effects
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const spotlightBackground = useMotionTemplate`radial-gradient(800px circle at ${mouseX}px ${mouseY}px, ${theme.primary}20, transparent 50%)`
  
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')

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

      // جلب الباقات
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
          'وصول كامل للمحتوى',
          'دعم فني 24/7',
          'شهادة إتمام معتمدة',
          'تمارين وتطبيقات عملية',
          'مراجعات دورية'
        ],
        original_price: pkg.type === 'offer' ? pkg.price * 1.5 : undefined,
        instructor: pkg.instructor || 'أ. محمود الديب',
        rating: pkg.rating || 4.9,
        students_count: pkg.students_count || 0
      })) || []
      
      setPackages(enhancedPackages)

      // جلب رصيد المحفظة
      const walletResult = await getWalletBalance(currentUser.id)
      if (walletResult.success && walletResult.data) {
        setWalletBalance(walletResult.data.balance || 0)
      }

      // جلب باقات المستخدم
      const { data: userPkgs, error: userPkgsError } = await supabase
        .from('user_packages')
        .select(`*, packages:package_id(*)`)
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

  // Real-time updates
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

  // فلترة الباقات حسب البحث
  const filteredPackages = useMemo(() => {
    let packages = []
    switch (activeTab) {
      case 'purchased': packages = purchased; break
      case 'offers': packages = offers; break
      default: packages = [...purchased, ...available, ...offers]
    }
    
    if (searchQuery.trim()) {
      return packages.filter(pkg =>
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return packages
  }, [purchased, available, offers, activeTab, searchQuery])

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

  if (loading) {
    return <LoadingScreen theme={theme} />
  }

  return (
    <div 
      className={styles.container} 
      ref={containerRef}
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight Effect */}
      <motion.div
        className={styles.spotlight}
        style={{ background: spotlightBackground }}
      />

      {/* شريط التقدم العلوي */}
      <motion.div 
        className={styles.progressBar}
        style={{ 
          scaleX,
          background: theme.gradient
        }}
      />

      {/* خلفية الجزيئات */}
      <div className={styles.particles}>
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className={styles.particle}
            animate={{
              y: [0, -150, 0],
              x: [0, Math.random() * 100 - 50, 0],
              opacity: [0, 0.7, 0],
              scale: [0, 1, 0],
              rotate: [0, 360, 0]
            }}
            transition={{
              duration: Math.random() * 6 + 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: theme.gradient
            }}
          />
        ))}
      </div>

      {/* الهيدر الرئيسي */}
      <header className={styles.header}>
        {/* Glass Effect Overlay */}
        <div className={styles.glassOverlay} />
        
        <div className={styles.headerContent}>
          {/* شريط التنقل العلوي */}
          <nav className={styles.topNav}>
            <motion.button 
              className={styles.backButton}
              onClick={() => router.push('/')}
              whileHover={{ x: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft size={20} />
              <span>الرئيسية</span>
            </motion.button>

            <div className={styles.navActions}>
              <motion.button 
                className={styles.navIconButton}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Bell size={20} />
              </motion.button>
              <motion.button 
                className={styles.navIconButton}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Settings size={20} />
              </motion.button>
            </div>
          </nav>

          {/* محتوى الهيدر */}
          <div className={styles.headerMain}>
            {/* الشعار والعلامة التجارية */}
            <motion.div 
              className={styles.brandSection}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <div className={styles.logoContainer}>
                <div className={styles.logoGlow} style={{ ['--glow-color' as string]: theme.primary }}>
                  <div className={styles.logoInner} style={{ background: theme.gradient }}>
                    <Crown size={32} color="white" />
                  </div>
                </div>
                <div className={styles.brandText}>
                  <h1 className={styles.brandTitle}>البارع محمود الديب</h1>
                  <span className={styles.brandSubtitle}>رحلة التميز تبدأ من هنا</span>
                </div>
              </div>

              {user ? (
                <motion.div 
                  className={styles.userWalletCard}
                  style={{ 
                    ['--theme-gradient' as string]: theme.gradient
                  }}
                  whileHover={{ y: -5 }}
                >
                  <div className={styles.walletIcon} style={{ background: theme.gradient }}>
                    <Wallet size={24} color="white" />
                  </div>
                  <div className={styles.walletInfo}>
                    <span className={styles.walletLabel}>رصيد المحفظة</span>
                    <div className={styles.walletAmount}>
                      <span className={styles.amount} style={{ color: theme.primary }}>
                        {walletBalance.toLocaleString()}
                      </span>
                      <span className={styles.currency} style={{ color: theme.dark }}>ج.م</span>
                    </div>
                  </div>
                  <motion.button 
                    className={styles.refreshButton}
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    whileHover={{ rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <RefreshCw size={18} className={isRefreshing ? styles.spinning : ''} />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div 
                  className={styles.authButtons}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                >
                  <motion.button 
                    className={styles.loginButton}
                    style={{ background: theme.light, color: theme.primary }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push(`/login?returnUrl=/grades/${gradeSlug}`)}
                  >
                    <User size={18} />
                    <span>تسجيل الدخول</span>
                  </motion.button>
                  <motion.button 
                    className={styles.registerButton}
                    style={{ background: theme.gradient }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/register')}
                  >
                    <span>إنشاء حساب</span>
                    <ArrowRight size={18} />
                  </motion.button>
                </motion.div>
              )}
            </motion.div>

            {/* Hero Section */}
            <motion.div 
              className={styles.heroSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className={styles.heroBackground}>
                <div className={styles.heroGradient} style={{ background: theme.gradient }} />
                <div className={styles.heroPattern} style={{ ['--pattern-color' as string]: `${theme.primary}10` }} />
              </div>
              
              <div className={styles.heroContent}>
                <motion.div 
                  className={styles.gradeBadge}
                  style={{ background: theme.gradient }}
                  whileHover={{ scale: 1.1, rotateY: 180 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className={styles.badgeInner}>
                    <GraduationCap size={56} color="white" />
                  </div>
                  <div className={styles.badgeGlow} style={{ background: theme.primary }} />
                </motion.div>
                
                <motion.h2 
                  className={styles.heroTitle}
                  style={{ color: theme.dark }}
                >
                  {getGradeName()}
                  <motion.span 
                    className={styles.titleHighlight}
                    style={{ background: theme.gradient }}
                    animate={{ 
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] 
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </motion.h2>
                
                <p className={styles.heroSubtitle}>
                  انطلق في رحلة التميز مع باقات تعليمية مصممة خصيصًا لك
                </p>
                
                <div className={styles.heroStats}>
                  {[
                    { icon: Package, value: packages.length, label: 'باقة متاحة', color: theme.primary },
                    { icon: Users, value: packages.reduce((acc, p) => acc + (p.students_count || 0), 0), label: 'طالب مسجل', color: theme.secondary },
                    { icon: Star, value: '4.9', label: 'تقييم الخبراء', color: theme.accent }
                  ].map((stat, idx) => (
                    <motion.div 
                      key={idx}
                      className={styles.heroStat}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                    >
                      <div className={styles.statIcon} style={{ background: `${stat.color}15`, color: stat.color }}>
                        <stat.icon size={20} />
                      </div>
                      <div className={styles.statContent}>
                        <span className={styles.statValue} style={{ color: stat.color }}>{stat.value}</span>
                        <span className={styles.statLabel}>{stat.label}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* شريط البحث والفلترة */}
            <motion.div 
              className={styles.searchFilterBar}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className={styles.searchContainer}>
                <div className={styles.searchInputWrapper}>
                  <Search size={20} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="ابحث عن باقة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                  />
                  {searchQuery && (
                    <button 
                      className={styles.clearSearch}
                      onClick={() => setSearchQuery('')}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.filterControls}>
                <div className={styles.viewToggle}>
                  <motion.button 
                    className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
                    onClick={() => setViewMode('grid')}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Grid size={20} />
                  </motion.button>
                  <motion.button 
                    className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
                    onClick={() => setViewMode('list')}
                    whileTap={{ scale: 0.95 }}
                  >
                    <List size={20} />
                  </motion.button>
                </div>

                <div className={styles.filterDropdown}>
                  <Filter size={20} />
                  <span>فلترة</span>
                </div>
              </div>
            </motion.div>

            {/* التبويبات */}
            <motion.div 
              className={styles.tabsContainer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className={styles.tabs}>
                {[
                  { id: 'all', label: 'كل الباقات', icon: Package, count: purchased.length + available.length + offers.length, color: theme.primary },
                  { id: 'purchased', label: 'اشتراكاتي', icon: CheckCircle2, count: purchased.length, color: '#10b981', show: purchased.length > 0 },
                  { id: 'offers', label: 'عروض خاصة', icon: Zap, count: offers.length, color: '#f59e0b', show: offers.length > 0 }
                ].map((tab) => (
                  tab.show !== false && (
                    <motion.button 
                      key={tab.id}
                      className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                      onClick={() => setActiveTab(tab.id as any)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ 
                        ['--active-color' as string]: tab.color
                      }}
                    >
                      <div className={styles.tabContent}>
                        <tab.icon size={20} className={styles.tabIcon} />
                        <span className={styles.tabLabel}>{tab.label}</span>
                        <motion.span 
                          className={styles.tabBadge}
                          style={{ background: tab.color }}
                          layoutId={`badge-${tab.id}`}
                        >
                          {tab.count}
                        </motion.span>
                      </div>
                      {activeTab === tab.id && (
                        <motion.div 
                          className={styles.tabIndicator}
                          style={{ background: tab.color }}
                          layoutId="tabIndicator"
                        />
                      )}
                    </motion.button>
                  )
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className={styles.main}>
        {/* الإحصائيات السريعة */}
        {user && (
          <motion.div 
            className={styles.statsOverview}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className={styles.statsTitle}>نظرة عامة</h3>
            <div className={styles.statsGrid}>
              {[
                { 
                  icon: BookMarked, 
                  label: 'باقاتك النشطة', 
                  value: purchased.length,
                  progress: (purchased.length / packages.length) * 100 || 0,
                  color: theme.primary,
                  description: `من أصل ${packages.length} باقة`
                },
                { 
                  icon: Clock, 
                  label: 'أيام متبقية', 
                  value: Math.max(0, Math.ceil(userPackages.reduce((acc, up) => {
                    const expiry = new Date(up.expires_at).getTime()
                    return acc + (expiry - Date.now())
                  }, 0) / (1000 * 60 * 60 * 24))),
                  color: theme.secondary,
                  description: 'لنهاية الاشتراكات'
                },
                { 
                  icon: TrendingUp, 
                  label: 'نسبة التقدم', 
                  value: '85%',
                  progress: 85,
                  color: theme.accent,
                  description: 'في المواد المشتركة'
                }
              ].map((stat, idx) => (
                <motion.div 
                  key={idx}
                  className={styles.statCard}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className={styles.statHeader}>
                    <div className={styles.statIconWrapper} style={{ background: `${stat.color}15` }}>
                      <stat.icon size={24} color={stat.color} />
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue} style={{ color: stat.color }}>
                        {stat.value}
                      </span>
                      <span className={styles.statLabel}>{stat.label}</span>
                    </div>
                  </div>
                  
                  {'progress' in stat && (
                    <div className={styles.statProgress}>
                      <div className={styles.progressBar}>
                        <motion.div 
                          className={styles.progressFill}
                          style={{ background: stat.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${stat.progress}%` }}
                          transition={{ duration: 1, delay: idx * 0.2 }}
                        />
                      </div>
                      <span className={styles.progressText}>{stat.progress}%</span>
                    </div>
                  )}
                  
                  <p className={styles.statDescription}>{stat.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* رسالة الخطأ */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className={styles.errorAlert}
            >
              <div className={styles.errorContent}>
                <AlertCircle size={24} />
                <div className={styles.errorText}>
                  <strong>حدث خطأ</strong>
                  <p>{error}</p>
                </div>
                <motion.button 
                  className={styles.retryButton}
                  onClick={fetchData}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  إعادة المحاولة
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* عرض الباقات */}
        <div className={`${styles.packagesContainer} ${viewMode === 'list' ? styles.listView : ''}`}>
          {filteredPackages.length > 0 ? (
            <motion.div 
              layout
              className={styles.packagesGrid}
            >
              <AnimatePresence mode="popLayout">
                {filteredPackages.map((pkg: any, index) => (
                  <PackageCardNew 
                    key={pkg.id}
                    pkg={pkg}
                    isPurchased={purchased.some(p => p.id === pkg.id)}
                    theme={theme}
                    index={index}
                    viewMode={viewMode}
                    onPurchase={() => handlePurchaseClick(pkg)}
                    onEnter={() => handleEnterPackage(pkg.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              className={styles.emptyState}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className={styles.emptyIllustration}>
                <BookOpen size={64} />
                <div className={styles.emptyGlow} style={{ ['--glow-color' as string]: theme.primary }} />
              </div>
              <h3 className={styles.emptyTitle}>لا توجد باقات</h3>
              <p className={styles.emptyDescription}>
                {searchQuery ? 'لم نجد باقات تطابق بحثك' : 'سيتم إضافة باقات جديدة قريباً'}
              </p>
              {searchQuery && (
                <motion.button 
                  className={styles.clearSearchButton}
                  onClick={() => setSearchQuery('')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  مسح البحث
                </motion.button>
              )}
            </motion.div>
          )}
        </div>

        {/* نصائح وإحصائيات */}
        <motion.div 
          className={styles.tipsSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className={styles.tipsTitle}>نصائح للنجاح</h3>
          <div className={styles.tipsGrid}>
            {[
              { icon: Clock, title: 'التزم بالجدول', description: 'خصص وقتاً ثابتاً للمذاكرة يومياً' },
              { icon: Target, title: 'حدد الأهداف', description: 'ضع أهدافاً واضحة وقابلة للقياس' },
              { icon: Users, title: 'شارك المعرفة', description: 'ناقش مع زملائك لتثبيت المعلومات' },
              { icon: RefreshCw, title: 'كرر المراجعة', description: 'المراجعة المنتجية تثبت المعلومات' }
            ].map((tip, idx) => (
              <motion.div 
                key={idx}
                className={styles.tipCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + idx * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className={styles.tipIcon} style={{ background: `${theme.primary}15`, color: theme.primary }}>
                  <tip.icon size={24} />
                </div>
                <h4 className={styles.tipTitle}>{tip.title}</h4>
                <p className={styles.tipDescription}>{tip.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* الفوتر */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <GraduationCap size={32} color={theme.primary} />
            </div>
            <div className={styles.footerText}>
              <h4>البارع محمود الديب</h4>
              <p>منصة التعليم الذكي</p>
            </div>
          </div>
          
          <div className={styles.footerLinks}>
            <a href="/about">عن المنصة</a>
            <a href="/contact">اتصل بنا</a>
            <a href="/privacy">الخصوصية</a>
            <a href="/terms">الشروط</a>
          </div>
          
          <div className={styles.footerSocial}>
            <span>تابعنا على:</span>
            <div className={styles.socialIcons}>
              <motion.a 
                href="#"
                className={styles.socialIcon}
                whileHover={{ scale: 1.2, y: -3 }}
                whileTap={{ scale: 0.9 }}
              >
                <FacebookIcon />
              </motion.a>
              <motion.a 
                href="#"
                className={styles.socialIcon}
                whileHover={{ scale: 1.2, y: -3 }}
                whileTap={{ scale: 0.9 }}
              >
                <TwitterIcon />
              </motion.a>
              <motion.a 
                href="#"
                className={styles.socialIcon}
                whileHover={{ scale: 1.2, y: -3 }}
                whileTap={{ scale: 0.9 }}
              >
                <InstagramIcon />
              </motion.a>
              <motion.a 
                href="#"
                className={styles.socialIcon}
                whileHover={{ scale: 1.2, y: -3 }}
                whileTap={{ scale: 0.9 }}
              >
                <YoutubeIcon />
              </motion.a>
            </div>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p>© {new Date().getFullYear()} جميع الحقوق محفوظة لمنصة البارع محمود الديب</p>
        </div>
      </footer>

      {/* مودال الشراء */}
      <AnimatePresence>
        {showPurchaseModal && selectedPackage && user && (
          <PurchaseModalNew 
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

      {/* تأثير الاحتفال */}
      <AnimatePresence>
        {showConfetti && <ConfettiEffectNew theme={theme} />}
      </AnimatePresence>

      {/* زر العودة للأعلى */}
      <AnimatePresence>
        {scrollYProgress.get() > 0.2 && (
          <motion.button 
            className={styles.backToTop}
            style={{ background: theme.gradient }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <ChevronLeft size={24} style={{ transform: 'rotate(90deg)' }} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

// مكون بطاقة الباقة المحسّن
function PackageCardNew({ 
  pkg, 
  isPurchased, 
  theme, 
  index, 
  viewMode,
  onPurchase, 
  onEnter 
}: any) {
  const [isHovered, setIsHovered] = useState(false)
  
  const getTypeIcon = () => {
    switch (pkg.type) {
      case 'weekly': return <Calendar size={18} />
      case 'monthly': return <Calendar size={18} />
      case 'term': return <Award size={18} />
      case 'offer': return <Zap size={18} />
      default: return <Package size={18} />
    }
  }

  const getTypeColor = () => {
    switch (pkg.type) {
      case 'weekly': return theme.primary
      case 'monthly': return theme.secondary
      case 'term': return '#10b981'
      case 'offer': return '#f59e0b'
      default: return theme.accent
    }
  }

  const typeColor = getTypeColor()

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ delay: index * 0.05, type: "spring" }}
        className={styles.listCard}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={styles.listCardContent}>
          {/* Badges */}
          <div className={styles.listCardBadges}>
            {isPurchased && (
              <motion.span 
                className={styles.listBadge}
                style={{ background: '#10b981' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <CheckCircle2 size={12} />
                <span>مشترى</span>
              </motion.span>
            )}
            {pkg.type === 'offer' && (
              <motion.span 
                className={styles.listBadge}
                style={{ background: '#f59e0b' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <Sparkles size={12} />
                <span>عرض خاص</span>
              </motion.span>
            )}
          </div>

          {/* Main Content */}
          <div className={styles.listCardMain}>
            <div className={styles.listCardImage}>
              {pkg.image_url ? (
                <img src={pkg.image_url} alt={pkg.name} />
              ) : (
                <div className={styles.listImagePlaceholder} style={{ background: theme.gradient }}>
                  {getTypeIcon()}
                </div>
              )}
            </div>

            <div className={styles.listCardInfo}>
              <div className={styles.listCardHeader}>
                <h3 className={styles.listCardTitle} style={{ color: theme.dark }}>
                  {pkg.name}
                </h3>
                <span className={styles.listCardType} style={{ color: typeColor }}>
                  {getTypeIcon()}
                  <span>
                    {pkg.type === 'weekly' && 'أسبوعي'}
                    {pkg.type === 'monthly' && 'شهري'}
                    {pkg.type === 'term' && 'ترم كامل'}
                    {pkg.type === 'offer' && 'عرض خاص'}
                  </span>
                </span>
              </div>

              <p className={styles.listCardDescription}>{pkg.description}</p>

              <div className={styles.listCardStats}>
                <div className={styles.listStat}>
                  <PlayCircle size={16} />
                  <span>{pkg.lecture_count} محاضرة</span>
                </div>
                <div className={styles.listStat}>
                  <Clock size={16} />
                  <span>{pkg.duration_days} يوم</span>
                </div>
                <div className={styles.listStat}>
                  <Users size={16} />
                  <span>{pkg.students_count || 0} طالب</span>
                </div>
              </div>

              {pkg.expires_at && (
                <div className={styles.listExpiry}>
                  <Calendar size={14} />
                  <span>ينتهي في {new Date(pkg.expires_at).toLocaleDateString('ar-EG')}</span>
                </div>
              )}
            </div>

            <div className={styles.listCardActions}>
              <div className={styles.listPrice}>
                {pkg.original_price && (
                  <span className={styles.listOldPrice}>{pkg.original_price.toLocaleString()} ج.م</span>
                )}
                <motion.span 
                  className={styles.listCurrentPrice}
                  style={{ color: theme.primary }}
                  animate={{ scale: isHovered ? 1.05 : 1 }}
                >
                  {pkg.price.toLocaleString()} ج.م
                </motion.span>
              </div>

              {isPurchased ? (
                <motion.button
                  className={styles.listActionButton}
                  style={{ background: '#10b981' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onEnter}
                >
                  <span>الدخول</span>
                  <ChevronLeft size={18} />
                </motion.button>
              ) : (
                <motion.button
                  className={styles.listActionButton}
                  style={{ background: theme.gradient }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onPurchase}
                >
                  <span>اشتر الآن</span>
                  <ShoppingCart size={18} />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Grid View
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ delay: index * 0.05, type: "spring" }}
      className={styles.gridCard}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -8 }}
    >
      {/* Card Border Gradient */}
      <div className={styles.cardBorder} style={{ background: theme.gradient }} />
      
      {/* Card Glow Effect */}
      <motion.div 
        className={styles.cardGlow}
        animate={{ 
          opacity: isHovered ? 0.3 : 0.1,
          scale: isHovered ? 1.05 : 1
        }}
        style={{ background: theme.gradient }}
      />

      {/* Badges */}
      <div className={styles.cardBadges}>
        {isPurchased && (
          <motion.div 
            className={styles.purchasedBadge}
            style={{ background: '#10b981' }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500 }}
          >
            <CheckCircle2 size={14} />
            <span>مفعل</span>
          </motion.div>
        )}
        
        {pkg.type === 'offer' && (
          <motion.div 
            className={styles.offerBadge}
            style={{ background: '#f59e0b' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Zap size={14} />
            <span>عرض خاص</span>
          </motion.div>
        )}

        {pkg.original_price && (
          <motion.div 
            className={styles.discountBadge}
            style={{ background: theme.gradient }}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span>خصم {Math.round((1 - pkg.price/pkg.original_price) * 100)}%</span>
          </motion.div>
        )}
      </div>

      {/* Card Image */}
      <div className={styles.cardImageContainer}>
        <div className={styles.cardImageWrapper}>
          {pkg.image_url ? (
            <motion.img 
              src={pkg.image_url} 
              alt={pkg.name}
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ duration: 0.3 }}
            />
          ) : (
            <div className={styles.imagePlaceholder} style={{ background: theme.gradient }}>
              {getTypeIcon()}
            </div>
          )}
        </div>
        
        {/* Type Indicator */}
        <div className={styles.typeIndicator} style={{ background: typeColor }}>
          {getTypeIcon()}
        </div>
      </div>

      {/* Card Content */}
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle} style={{ color: theme.dark }}>
            {pkg.name}
          </h3>
          <div className={styles.cardRating}>
            <Star size={16} fill="#fbbf24" color="#fbbf24" />
            <span>{pkg.rating || 4.9}</span>
          </div>
        </div>

        <p className={styles.cardDescription}>
          {pkg.description}
        </p>

        {/* Features */}
        <div className={styles.cardFeatures}>
          {pkg.features?.slice(0, 4).map((feature: string, i: number) => (
            <motion.div 
              key={i}
              className={styles.featureItem}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className={styles.featureIcon} style={{ background: `${theme.primary}15` }}>
                <CheckCircle2 size={14} color={theme.primary} />
              </div>
              <span>{feature}</span>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div className={styles.cardStats}>
          <div className={styles.statItem}>
            <PlayCircle size={18} color={theme.primary} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{pkg.lecture_count}</span>
              <span className={styles.statLabel}>محاضرة</span>
            </div>
          </div>
          <div className={styles.statItem}>
            <Clock size={18} color={theme.secondary} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{pkg.duration_days}</span>
              <span className={styles.statLabel}>يوم</span>
            </div>
          </div>
          <div className={styles.statItem}>
            <Users size={18} color={theme.accent} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{pkg.students_count || 0}</span>
              <span className={styles.statLabel}>طالب</span>
            </div>
          </div>
        </div>

        {/* Expiry (if purchased) */}
        {pkg.expires_at && (
          <div className={styles.expiryInfo}>
            <Calendar size={14} color={theme.primary} />
            <span>تنتهي: {new Date(pkg.expires_at).toLocaleDateString('ar-EG')}</span>
          </div>
        )}

        {/* Footer */}
        <div className={styles.cardFooter}>
          <div className={styles.priceSection}>
            {pkg.original_price && (
              <span className={styles.originalPrice}>{pkg.original_price.toLocaleString()} ج.م</span>
            )}
            <motion.span 
              className={styles.currentPrice}
              style={{ color: theme.primary }}
              animate={{ scale: isHovered ? 1.1 : 1 }}
            >
              {pkg.price.toLocaleString()}
              <small> ج.م</small>
            </motion.span>
          </div>

          {isPurchased ? (
            <motion.button
              className={styles.enterButton}
              style={{ background: '#10b981' }}
              whileHover={{ scale: 1.05, boxShadow: '0 10px 25px #10b98150' }}
              whileTap={{ scale: 0.95 }}
              onClick={onEnter}
            >
              <span>الدخول</span>
              <ChevronLeft size={18} />
            </motion.button>
          ) : (
            <motion.button
              className={styles.buyButton}
              style={{ background: theme.gradient }}
              whileHover={{ 
                scale: 1.05, 
                boxShadow: `0 10px 25px ${theme.primary}50` 
              }}
              whileTap={{ scale: 0.95 }}
              onClick={onPurchase}
            >
              <span>اشتر الآن</span>
              <ShoppingCart size={18} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// مكون مودال الشراء المتقدم
function PurchaseModalNew({ 
  pkg, 
  user, 
  walletBalance, 
  theme, 
  onClose, 
  onSuccess, 
  gradeSlug 
}: any) {
  const [method, setMethod] = useState<'wallet' | 'code'>('wallet')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'method' | 'confirm' | 'success'>('method')
  const [codeDetails, setCodeDetails] = useState<any>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleValidateCode = async () => {
    if (!code.trim()) {
      setError('الرجاء إدخال كود التفعيل')
      return
    }

    setLoading(true)
    try {
      const validateResult = await validateCode(code.toUpperCase(), gradeSlug, pkg.id)
      if (!validateResult.success) {
        throw new Error(validateResult.message || 'كود غير صالح')
      }
      setCodeDetails(validateResult.data)
      setStep('confirm')
      setError('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
        if (!codeDetails) {
          throw new Error('الرجاء التحقق من الكود أولاً')
        }

        const markResult = await markCodeAsUsed(codeDetails.id, user.id)
        if (!markResult.success) {
          throw new Error(markResult.message || 'فشل في استخدام الكود')
        }

        const pkgResult = await createUserPackage(user.id, pkg.id, pkg.duration_days || 30, 'code')
        if (!pkgResult.success) {
          throw new Error(pkgResult.message || 'فشل في تفعيل الباقة')
        }
      }

      setStep('success')
      
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: '🎉 تم الشراء بنجاح!',
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

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        className={styles.modalNew}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.modalGlow} style={{ background: theme.gradient }} />

        {step === 'success' ? (
          <SuccessScreen theme={theme} onClose={onClose} />
        ) : (
          <>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleSection}>
                <h3 style={{ color: theme.dark }}>شراء الباقة</h3>
                <span className={styles.modalSubtitle}>اختر طريقة الدفع المناسبة</span>
              </div>
              <motion.button 
                className={styles.modalClose}
                onClick={onClose}
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={24} />
              </motion.button>
            </div>

            <div className={styles.modalContent}>
              {/* Package Info */}
              <div className={styles.modalPackageInfo}>
                <div className={styles.packageImage} style={{ background: theme.gradient }}>
                  <Package size={32} color="white" />
                </div>
                <div className={styles.packageDetails}>
                  <h4 style={{ color: theme.dark }}>{pkg.name}</h4>
                  <div className={styles.packagePrice}>
                    <span className={styles.currentPrice} style={{ color: theme.primary }}>
                      {pkg.price.toLocaleString()} ج.م
                    </span>
                    {pkg.original_price && (
                      <span className={styles.originalPrice}>{pkg.original_price.toLocaleString()} ج.م</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className={styles.steps}>
                <div className={`${styles.step} ${step === 'method' ? styles.active : ''}`}>
                  <div className={styles.stepNumber}>1</div>
                  <span>طريقة الدفع</span>
                </div>
                <div className={styles.stepLine} />
                <div className={`${styles.step} ${step === 'confirm' ? styles.active : ''}`}>
                  <div className={styles.stepNumber}>2</div>
                  <span>تأكيد</span>
                </div>
              </div>

              {step === 'method' ? (
                <>
                  {/* Payment Methods */}
                  <div className={styles.paymentMethods}>
                    <motion.div 
                      className={`${styles.methodCard} ${method === 'wallet' ? styles.active : ''}`}
                      onClick={() => {setMethod('wallet'); setError('')}}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={styles.methodIcon} style={{ background: theme.gradient }}>
                        <CreditCard size={24} color="white" />
                      </div>
                      <div className={styles.methodInfo}>
                        <strong>المحفظة</strong>
                        <span>
                          الرصيد الحالي: 
                          <b style={{color: walletBalance >= pkg.price ? '#10b981' : '#ef4444'}}>
                            {' '}{walletBalance.toLocaleString()} ج.م
                          </b>
                        </span>
                      </div>
                      {walletBalance >= pkg.price ? (
                        <CheckCircle2 size={20} color="#10b981" />
                      ) : (
                        <AlertCircle size={20} color="#ef4444" />
                      )}
                    </motion.div>

                    <motion.div 
                      className={`${styles.methodCard} ${method === 'code' ? styles.active : ''}`}
                      onClick={() => {setMethod('code'); setError('')}}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={styles.methodIcon} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                        <Ticket size={24} color="white" />
                      </div>
                      <div className={styles.methodInfo}>
                        <strong>كود التفعيل</strong>
                        <span>أدخل كود التفعيل الخاص بك</span>
                      </div>
                    </motion.div>
                  </div>

                  {method === 'code' && (
                    <div className={styles.codeSection}>
                      <div className={styles.codeInputWrapper}>
                        <input 
                          type="text" 
                          value={code}
                          onChange={(e) => setCode(e.target.value.toUpperCase())}
                          placeholder="أدخل كود التفعيل"
                          className={styles.codeInput}
                          disabled={loading}
                        />
                        <motion.button 
                          className={styles.validateButton}
                          style={{ background: theme.gradient }}
                          onClick={handleValidateCode}
                          disabled={loading || !code.trim()}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {loading ? <Loader2 className={styles.spinning} size={16} /> : 'التحقق'}
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {method === 'wallet' && walletBalance < pkg.price && (
                    <div className={styles.insufficientFunds}>
                      <AlertCircle size={20} color="#ef4444" />
                      <div>
                        <strong>رصيد غير كافٍ</strong>
                        <span>أنت بحاجة إلى {(pkg.price - walletBalance).toLocaleString()} ج.م إضافية</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Confirmation Step */}
                  <div className={styles.confirmationSection}>
                    <div className={styles.confirmationHeader}>
                      <ShieldCheck size={24} color={theme.primary} />
                      <h4>تأكيد الشراء</h4>
                    </div>
                    
                    <div className={styles.orderSummary}>
                      <div className={styles.summaryRow}>
                        <span>الباقة</span>
                        <strong>{pkg.name}</strong>
                      </div>
                      <div className={styles.summaryRow}>
                        <span>المدة</span>
                        <strong>{pkg.duration_days} يوم</strong>
                      </div>
                      <div className={styles.summaryRow}>
                        <span>طريقة الدفع</span>
                        <strong>{method === 'wallet' ? 'المحفظة' : 'كود التفعيل'}</strong>
                      </div>
                      <div className={styles.summaryDivider} />
                      <div className={styles.summaryRow}>
                        <span>الإجمالي</span>
                        <strong style={{ color: theme.primary, fontSize: '1.2rem' }}>
                          {pkg.price.toLocaleString()} ج.م
                        </strong>
                      </div>
                    </div>

                    {method === 'code' && codeDetails && (
                      <div className={styles.codeInfo}>
                        <div className={styles.codeInfoHeader}>
                          <Ticket size={20} color="#f59e0b" />
                          <span>معلومات الكود</span>
                        </div>
                        <div className={styles.codeDetails}>
                          <span>{codeDetails.code}</span>
                          <span>صالح حتى: {new Date(codeDetails.expires_at).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {error && (
                <div className={styles.errorMessage}>
                  <AlertCircle size={18} color="#ef4444" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className={styles.modalActions}>
                {step === 'method' ? (
                  <motion.button 
                    className={styles.nextButton}
                    style={{ background: theme.gradient }}
                    onClick={() => {
                      if (method === 'wallet') {
                        if (walletBalance >= pkg.price) {
                          setStep('confirm')
                        } else {
                          setError('رصيد غير كافٍ')
                        }
                      } else {
                        if (codeDetails) {
                          setStep('confirm')
                        } else {
                          setError('الرجاء التحقق من الكود أولاً')
                        }
                      }
                    }}
                    disabled={method === 'code' && !codeDetails}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>التالي</span>
                    <ChevronLeft size={20} />
                  </motion.button>
                ) : (
                  <div className={styles.confirmationActions}>
                    <motion.button 
                      className={styles.backButton}
                      onClick={() => setStep('method')}
                      whileHover={{ x: -5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronLeft size={20} />
                      <span>رجوع</span>
                    </motion.button>
                    <motion.button 
                      className={styles.confirmButton}
                      style={{ background: theme.gradient }}
                      onClick={handlePurchase}
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? (
                        <>
                          <Loader2 className={styles.spinning} size={20} />
                          <span>جاري المعالجة...</span>
                        </>
                      ) : (
                        <>
                          <span>تأكيد الشراء</span>
                          <Lock size={20} />
                        </>
                      )}
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Security Badge */}
              <div className={styles.securityBadge}>
                <Shield size={16} color={theme.primary} />
                <span>معاملة آمنة • مشفرة بنسبة 100%</span>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

// شاشة النجاح
function SuccessScreen({ theme, onClose }: any) {
  return (
    <motion.div 
      className={styles.successScreen}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className={styles.successContent}>
        <motion.div 
          className={styles.successIcon}
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ duration: 0.5 }}
        >
          <CheckCircle2 size={64} color={theme.primary} />
          <div className={styles.successGlow} style={{ background: theme.primary }} />
        </motion.div>
        
        <motion.h3 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ color: theme.dark }}
        >
          تم الشراء بنجاح! 🎉
        </motion.h3>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          يمكنك الآن الوصول إلى جميع محتويات الباقة من قسم اشتراكاتي
        </motion.p>
        
        <motion.button
          className={styles.successButton}
          style={{ background: theme.gradient }}
          onClick={onClose}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>ممتاز!</span>
          <ChevronLeft size={20} />
        </motion.button>
      </div>
    </motion.div>
  )
}

// تأثير الاحتفال المتقدم
function ConfettiEffectNew({ theme }: { theme: ThemeType }) {
  return (
    <div className={styles.confettiContainer}>
      {[...Array(80)].map((_, i) => {
        const colors = [theme.primary, theme.secondary, theme.accent, '#f59e0b', '#10b981', '#ec4899', '#8b5cf6']
        const color = colors[Math.floor(Math.random() * colors.length)]
        const shape = Math.random() > 0.7 ? 'circle' : Math.random() > 0.5 ? 'triangle' : 'square'
        
        return (
          <motion.div
            key={i}
            className={`${styles.confettiPiece} ${styles[shape]}`}
            initial={{ 
              top: -20, 
              left: Math.random() * 100 + '%',
              rotate: 0,
              scale: 0
            }}
            animate={{ 
              top: '120%', 
              left: `${Math.random() * 100}%`,
              rotate: Math.random() * 720,
              scale: Math.random() * 0.5 + 0.5
            }}
            transition={{ 
              duration: Math.random() * 4 + 3,
              ease: "linear"
            }}
            style={{
              backgroundColor: color,
              width: Math.random() * 16 + 8,
              height: Math.random() * 16 + 8
            }}
          />
        )
      })}
      
      {/* تأثيرات إضافية */}
      <motion.div 
        className={styles.confettiSparkle}
        animate={{ 
          scale: [0, 1, 0],
          rotate: [0, 180, 360]
        }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ borderColor: theme.primary }}
      />
      
      <motion.div 
        className={styles.confettiSparkle}
        animate={{ 
          scale: [0, 1, 0],
          rotate: [360, 180, 0]
        }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        style={{ borderColor: theme.secondary }}
      />
    </div>
  )
}