'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { createClientBrowser } from '@/lib/supabase/sf-client'
import { 
  Lock, 
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
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal State
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'code'>('wallet')
  const [codeInput, setCodeInput] = useState('')
  const [purchaseError, setPurchaseError] = useState('')
  const [purchaseSuccess, setPurchaseSuccess] = useState('')
  const [isPurchasing, setIsPurchasing] = useState(false)

  // ================== Auth Protection ==================
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !currentUser) {
        router.push(`/login?returnUrl=/grades/${gradeSlug}`)
        return
      }

      setUser(currentUser)
      setCheckingAuth(false)
      
      if (gradeSlug) {
        fetchData()
        loadUserData(currentUser.id)
      }
    } catch (err) {
      console.error('Auth error:', err)
      router.push('/login')
    }
  }

  // ================== Data Fetching ==================
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

  const loadUserData = async (userId: string) => {
    try {
      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle()

      if (walletData) setWalletBalance(walletData.balance)

      const { data: userPackagesData } = await supabase
        .from('user_packages')
        .select(`*, packages (*)`)
        .eq('user_id', userId)
        .eq('is_active', true)

      if (userPackagesData) {
        const filtered = userPackagesData.filter((up: any) => up.packages?.grade === gradeSlug)
        setUserPackages(filtered)
      }
    } catch (err) {
      console.error('Error loading user data:', err)
    }
  }

  // ================== Purchase Handlers ==================
  const handlePurchaseClick = (pkg: Package) => {
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
        await loadUserData(user.id)
        
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
        await loadUserData(user.id)
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

  // ================== Loading States ==================
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <Lock className="absolute inset-0 m-auto w-8 h-8 text-purple-400" />
          </div>
          <p className="text-white text-lg">جاري التحقق من تسجيل الدخول...</p>
        </motion.div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative w-full h-full border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-white text-xl font-semibold">جاري تحميل البيانات...</p>
        </motion.div>
      </div>
    )
  }

  if (error || !grade) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">عذراً</h2>
          <p className="text-gray-300 mb-6">{error || 'الصف غير موجود'}</p>
          <button 
            onClick={() => router.push('/')}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/50 border-b border-white/10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  {grade.name}
                </h1>
                <p className="text-sm text-gray-400">اختر باقتك وابدأ رحلة التعلم</p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2"
              whileHover={{ scale: 1.05 }}
            >
              <Wallet className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-xs text-gray-400">رصيدك</p>
                <p className="font-bold text-purple-300">{walletBalance} جنيه</p>
              </div>
            </motion.div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-16"
          >
            {/* Offers Section */}
            {offerPackages.length > 0 && (
              <section>
                <motion.div variants={itemVariants} className="flex items-center gap-3 mb-8">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    عروض خاصة محدودة
                  </h2>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <section>
                <motion.div variants={itemVariants} className="flex items-center gap-3 mb-8">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                  <h2 className="text-3xl font-bold text-white">باقات الترم الكامل</h2>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <section>
                <motion.div variants={itemVariants} className="flex items-center gap-3 mb-8">
                  <Calendar className="w-6 h-6 text-green-400" />
                  <h2 className="text-3xl font-bold text-white">الباقات الشهرية</h2>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <section>
                <motion.div variants={itemVariants} className="flex items-center gap-3 mb-8">
                  <Clock className="w-6 h-6 text-purple-400" />
                  <h2 className="text-3xl font-bold text-white">الباقات الأسبوعية</h2>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                className="text-center py-20"
              >
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-xl text-gray-400">لا توجد باقات متاحة حالياً</p>
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowPurchaseModal(false)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-purple-500/20"
              onClick={e => e.stopPropagation()}
            >
              {purchaseSuccess ? (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-8"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" as const, stiffness: 200 }}
                    className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">تهانينا!</h3>
                  <p className="text-gray-300">{purchaseSuccess}</p>
                </motion.div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">{selectedPackage.name}</h3>
                      <p className="text-purple-400 text-lg font-semibold">{selectedPackage.price} جنيه</p>
                    </div>
                    <button 
                      onClick={() => setShowPurchaseModal(false)}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethod('wallet')}
                      className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                        paymentMethod === 'wallet' 
                          ? 'border-purple-500 bg-purple-500/20' 
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <CreditCard className={`w-6 h-6 ${paymentMethod === 'wallet' ? 'text-purple-400' : 'text-gray-400'}`} />
                      <div className="flex-1 text-right">
                        <p className="font-semibold text-white">الدفع من المحفظة</p>
                        <p className="text-sm text-gray-400">رصيدك: {walletBalance} جنيه</p>
                      </div>
                      {paymentMethod === 'wallet' && <div className="w-4 h-4 bg-purple-500 rounded-full"></div>}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethod('code')}
                      className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                        paymentMethod === 'code' 
                          ? 'border-purple-500 bg-purple-500/20' 
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <Ticket className={`w-6 h-6 ${paymentMethod === 'code' ? 'text-purple-400' : 'text-gray-400'}`} />
                      <div className="flex-1 text-right">
                        <p className="font-semibold text-white">كود تفعيل</p>
                        <p className="text-sm text-gray-400">أدخل كود الشراء</p>
                      </div>
                      {paymentMethod === 'code' && <div className="w-4 h-4 bg-purple-500 rounded-full"></div>}
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
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors mb-4"
                    />
                  )}

                  {purchaseError && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl mb-4 flex items-center gap-2"
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
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      className={`relative group rounded-3xl overflow-hidden ${
        highlight 
          ? 'bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 border-2 border-yellow-500/50' 
          : 'bg-white/5 border border-white/10'
      } backdrop-blur-sm`}
    >
      {highlight && (
        <div className="absolute top-4 right-4 z-10">
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            عرض خاص
          </span>
        </div>
      )}

      {isPurchased && (
        <div className="absolute inset-0 bg-green-500/10 z-10 flex items-center justify-center backdrop-blur-[2px]">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-green-500 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg"
          >
            <CheckCircle2 className="w-5 h-5" />
            تم الشراء
          </motion.div>
        </div>
      )}

      <div className="relative h-48 overflow-hidden">
        {pkg.image_url ? (
          <img 
            src={pkg.image_url} 
            alt={pkg.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-white/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
          {pkg.name}
        </h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{pkg.description}</p>

        <div className="flex items-center gap-4 mb-6 text-sm text-gray-300">
          <div className="flex items-center gap-1">
            <PlayCircle className="w-4 h-4 text-purple-400" />
            <span>{pkg.lecture_count} محاضرة</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>{pkg.duration_days} يوم</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">السعر</p>
            <p className={`text-2xl font-bold ${highlight ? 'text-yellow-400' : 'text-white'}`}>
              {pkg.price} <span className="text-sm text-gray-400">جنيه</span>
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isPurchased ? onEnter : onPurchase}
            className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
              isPurchased
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                : highlight
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black shadow-lg shadow-orange-500/30'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
            }`}
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