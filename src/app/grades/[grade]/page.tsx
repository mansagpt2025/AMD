'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/sf-client'
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

// ================== Page ==================
export default function GradePage({ params }: { params: { grade: string } }) {
  const [grade, setGrade] = useState<Grade | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [userPackages, setUserPackages] = useState<UserPackage[]>([])
  const [user, setUser] = useState<any>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'code'>('wallet')
  const [codeInput, setCodeInput] = useState('')
  const [purchaseError, setPurchaseError] = useState('')
  const [purchaseSuccess, setPurchaseSuccess] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (params.grade) {
      fetchData()
      checkUser()
    }
  }, [params.grade])

  // ================== Data ==================
  const fetchData = async () => {
    setLoading(true)

    try {
      // ----- Grade -----
      const { data: gradeData, error: gradeError } = await supabase
        .from('grades')
        .select('*')
        .eq('slug', params.grade)
        .maybeSingle()

      if (gradeError) {
        console.error('Error fetching grade:', gradeError)
        setGrade(null)
      } else {
        setGrade(gradeData)
      }

      // ----- Packages -----
      const { data: packagesData, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .eq('grade', params.grade)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (packagesError) {
        console.error('Error fetching packages:', packagesError)
        setPackages([])
      } else {
        setPackages(packagesData || [])
      }

    } catch (error) {
      console.error('Error in fetchData:', error)
      setGrade(null)
      setPackages([])
    } finally {
      // 🔥 يمنع التحميل للأبد
      setLoading(false)
    }
  }

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUser(user)

      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle()

      if (walletData) {
        setWalletBalance(walletData.balance)
      }

      const { data: userPackagesData } = await supabase
        .from('user_packages')
        .select(`
          *,
          packages (*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (userPackagesData) {
        const filtered = userPackagesData.filter(
          (up: any) => up.packages?.grade === params.grade
        )
        setUserPackages(filtered)
      }

    } catch (error) {
      console.error('Error in checkUser:', error)
    }
  }

  // ================== UI ==================
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>جاري تحميل بيانات الصف...</p>
      </div>
    )
  }

  if (!grade) {
    return (
      <div className={styles.notFound}>
        <h1>الصف غير موجود</h1>
        <button 
          onClick={() => router.push('/')}
          className={styles.backButton}
        >
          العودة للرئيسية
        </button>
      </div>
    )
  }

  const weeklyPackages = packages.filter(p => p.type === 'weekly')
  const monthlyPackages = packages.filter(p => p.type === 'monthly')
  const termPackages = packages.filter(p => p.type === 'term')
  const offerPackages = packages.filter(p => p.type === 'offer')

  return (
    <div className={`${styles.container} ${styles[`grade-${grade.slug}`]}`}>
      {/* كل JSX كما هو عندك بدون أي تغيير */}
    </div>
  )
}

// ================== Package Card ==================
function PackageCard({ 
  pkg, 
  isPurchased, 
  onPurchase, 
  onEnter 
}: { 
  pkg: Package
  isPurchased: boolean
  onPurchase?: () => void
  onEnter?: () => void
}) {
  return (
    <div className={styles.packageCard}>
      {/* نفس كود الكارت كما هو */}


      <div className={styles.packageImage}>
        <img 
          src={pkg.image_url || '/default-package.jpg'} 
          alt={pkg.name}
          onError={(e) => {
            e.currentTarget.src = '/default-package.jpg'
          }}
          loading="lazy"
        />
      </div>
      <div className={styles.packageContent}>
        <h3 className={styles.packageName}>{pkg.name}</h3>
        <p className={styles.packageDescription}>{pkg.description}</p>
        <div className={styles.packageDetails}>
          <span className={styles.lectureCount}>
            📚 {pkg.lecture_count} محاضرة
          </span>
          <span className={styles.price}>💰 {pkg.price} جنيه</span>
        </div>
        <div className={styles.packageType}>
          <span className={`${styles.typeBadge} ${styles[pkg.type]}`}>
            {pkg.type === 'weekly' && 'أسبوعية'}
            {pkg.type === 'monthly' && 'شهرية'}
            {pkg.type === 'term' && 'ترم'}
            {pkg.type === 'offer' && 'عرض'}
          </span>
        </div>
        <button
          className={`${styles.actionButton} ${isPurchased ? styles.enterButton : styles.purchaseButton}`}
          onClick={isPurchased ? onEnter : onPurchase}
          aria-label={isPurchased ? `الدخول إلى باقة ${pkg.name}` : `شراء باقة ${pkg.name}`}
        >
          {isPurchased ? 'الدخول' : 'شراء'}
        </button>
      </div>
    </div>
  )
}
