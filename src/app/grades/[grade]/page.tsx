'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClientBrowser } from '@/lib/supabase/sf-client'
import { 
  Wallet, BookOpen, Clock, Calendar, Sparkles, CheckCircle2, 
  X, CreditCard, Ticket, Loader2, ArrowRight, GraduationCap,
  PlayCircle, Users, Zap, Star, Shield, TrendingUp, Crown,
  Award, Target, Brain, Rocket, Gem, Moon, Sun, Package,
  ShoppingCart, Lock, Unlock, Tag, Percent, Gift
} from 'lucide-react'
import PurchaseModal from '@/components/packages/PurchaseModal'
import PackageCard from '@/components/packages/PackageCard'
import { getGradeTheme } from '@/lib/utils/grade-themes'

// الأنواع
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

export default function GradePage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClientBrowser()
  
  const gradeSlug = params?.grade as 'first' | 'second' | 'third'
  
  // الحصول على الثيم الخاص بالصف
  const gradeTheme = getGradeTheme(gradeSlug)
  const [theme, setTheme] = useState(gradeTheme)

  // State
  const [grade, setGrade] = useState<any>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [userPackages, setUserPackages] = useState<UserPackage[]>([])
  const [user, setUser] = useState<any>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal State
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)

  // إحصائيات مزيفة مؤقتاً
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
      // جلب بيانات الصف
      const { data: gradeData } = await supabase
        .from('grades')
        .select('*')
        .eq('slug', gradeSlug)
        .single()

      setGrade(gradeData || { name: `الصف ${gradeSlug === 'first' ? 'الأول' : gradeSlug === 'second' ? 'الثاني' : 'الثالث'} الثانوي` })

      // جلب الباقات
      const { data: packagesData } = await supabase
        .from('packages')
        .select('*')
        .eq('grade', gradeSlug)
        .eq('is_active', true)
        .order('price', { ascending: true })

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
        
        // جلب رصيد المحفظة
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', currentUser.id)
          .single()

        if (walletData) setWalletBalance(walletData.balance)

        // جلب باقات المستخدم
        const { data: userPackagesData } = await supabase
          .from('user_packages')
          .select(`*, packages (*)`)
          .eq('user_id', currentUser.id)
          .eq('is_active', true)

        if (userPackagesData) {
          const filtered = userPackagesData.filter((up: any) => 
            up.packages?.grade === gradeSlug
          )
          setUserPackages(filtered)
        }
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
      router.push(`/grades/${gradeSlug}/packages/${pkg.id}`)
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
    await checkUser()
    fetchData()
    setShowPurchaseModal(false)
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme.background}`}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: theme.primary }} />
          <p className="text-lg" style={{ color: theme.text }}>جاري تحميل بيانات الصف...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ 
      background: `linear-gradient(135deg, ${theme.background} 0%, ${theme.backgroundLight} 100%)`
    }}>
      {/* Header */}
      <header className="relative overflow-hidden py-8 px-4" style={{ background: theme.header }}>
        <div className="max-w-7xl mx-auto">
          {/* Platform Branding */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center md:text-right mb-6 md:mb-0"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                الأبــارع محمود الـديــب
              </h1>
              <p className="text-xl text-white/90">منارة العلم والتميز</p>
            </motion.div>

            {user && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-4"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-8 h-8 text-white" />
                    <div>
                      <p className="text-sm text-white/80">رصيد المحفظة</p>
                      <p className="text-2xl font-bold text-white">
                        {walletBalance.toLocaleString()} <span className="text-lg">جنيه</span>
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Grade Title */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <GraduationCap className="w-16 h-16 text-white" />
              <div className="text-right">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {grade?.name || `الصف ${gradeSlug === 'first' ? 'الأول' : gradeSlug === 'second' ? 'الثاني' : 'الثالث'} الثانوي`}
                </h2>
                <p className="text-xl text-white/90">رحلة نحو التميز الأكاديمي</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full opacity-10"
              style={{
                background: theme.accent,
                width: Math.random() * 100 + 50,
                height: Math.random() * 100 + 50,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.sin(i) * 20, 0],
              }}
              transition={{
                duration: Math.random() * 5 + 3,
                repeat: Infinity,
              }}
            />
          ))}
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              className="bg-white rounded-2xl p-6 shadow-lg border"
              style={{ borderColor: theme.border }}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl" style={{ background: `${theme.primary}20` }}>
                  <stat.icon className="w-8 h-8" style={{ color: theme.primary }} />
                </div>
                <div>
                  <p className="text-3xl font-bold" style={{ color: theme.text }}>
                    {stat.value}{stat.suffix}
                  </p>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Section 1: اشتراكاتك */}
        {purchasedPackages.length > 0 && (
          <section className="mb-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="p-3 rounded-xl" style={{ background: `${theme.primary}20` }}>
                <Package className="w-7 h-7" style={{ color: theme.primary }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: theme.text }}>اشتراكاتك</h2>
                <p className="text-gray-600">الباقات التي قمت بشرائها</p>
              </div>
              <div className="mr-auto px-4 py-2 rounded-full text-sm font-bold text-white" style={{ background: theme.primary }}>
                {purchasedPackages.length} باقة
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchasedPackages.map((pkg, index) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  index={index}
                  isPurchased={true}
                  onEnter={() => handleEnterPackage(pkg.id)}
                  theme={theme}
                />
              ))}
            </div>
          </section>
        )}

        {/* Section 2: العروض */}
        {offerPackages.length > 0 && (
          <section className="mb-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="p-3 rounded-xl" style={{ background: `${theme.accent}20` }}>
                <Crown className="w-7 h-7" style={{ color: theme.accent }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: theme.text }}>عروض VIP حصرية</h2>
                <p className="text-gray-600">فرص ذهبية بخصومات استثنائية</p>
              </div>
              <div className="mr-auto px-4 py-2 rounded-full text-sm font-bold text-white" style={{ background: theme.accent }}>
                محدودة
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offerPackages.map((pkg, index) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  index={index}
                  isPurchased={false}
                  onPurchase={() => handlePurchaseClick(pkg)}
                  theme={theme}
                  isHighlighted={true}
                />
              ))}
            </div>
          </section>
        )}

        {/* Section 3: الباقات الشهرية والترم */}
        {(monthlyPackages.length > 0 || termPackages.length > 0) && (
          <section className="mb-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="p-3 rounded-xl" style={{ background: `${theme.secondary}20` }}>
                <Calendar className="w-7 h-7" style={{ color: theme.secondary }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: theme.text }}>باقات التميز</h2>
                <p className="text-gray-600">برامج تعليمية متكاملة</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...monthlyPackages, ...termPackages].map((pkg, index) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  index={index}
                  isPurchased={false}
                  onPurchase={() => handlePurchaseClick(pkg)}
                  theme={theme}
                />
              ))}
            </div>
          </section>
        )}

        {/* Section 4: الباقات الأسبوعية */}
        {weeklyPackages.length > 0 && (
          <section className="mb-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="p-3 rounded-xl" style={{ background: `${theme.success}20` }}>
                <Clock className="w-7 h-7" style={{ color: theme.success }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: theme.text }}>باقات البداية</h2>
                <p className="text-gray-600">ابدأ رحلتك من اليوم</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {weeklyPackages.map((pkg, index) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  index={index}
                  isPurchased={false}
                  onPurchase={() => handlePurchaseClick(pkg)}
                  theme={theme}
                />
              ))}
            </div>
          </section>
        )}

        {/* حالة عدم وجود باقات */}
        {packages.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <BookOpen className="w-24 h-24 mx-auto mb-6 text-gray-400" />
            <h3 className="text-2xl font-bold mb-4" style={{ color: theme.text }}>جاري التحضير</h3>
            <p className="text-gray-600 mb-2">يتم إعداد محتوى مميز للصف حالياً</p>
            <p className="text-gray-500">سيتم إطلاق الباقات قريباً</p>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-8" style={{ borderColor: theme.border }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8" style={{ color: theme.primary }} />
              <span className="text-xl font-bold" style={{ color: theme.text }}>الابارع محمود الديب</span>
            </div>
            <p className="text-gray-600">منارة العلم والتميز منذ 2010</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>+{stats.totalStudents} طالب متفوق</span>
              <span>•</span>
              <span>{stats.successRate}% نسبة نجاح</span>
              <span>•</span>
              <span>{stats.expertTeachers} خبير تعليمي</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Purchase Modal */}
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