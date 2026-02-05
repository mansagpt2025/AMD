"use client"

import React from "react"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen,
  Calendar,
  Clock,
  CreditCard,
  Gift,
  GraduationCap,
  Key,
  Layers,
  Package,
  Play,
  ShoppingCart,
  Sparkles,
  Star,
  Timer,
  Wallet,
  X,
  Check,
  AlertCircle,
  Shield,
  CheckCircle2,
  ChevronLeft,
  Users,
  TrendingUp,
} from "lucide-react"
import { use } from "react"
import styles from "./GradePage.module.css"

// Types
interface PackageData {
  id: string
  name: string
  description: string | null
  price: number
  original_price: number | null
  image_url: string | null
  grade: string
  type: "weekly" | "monthly" | "term" | "offer"
  lecture_count: number
  duration_days: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface UserPackage {
  id: string
  package_id: string
  purchased_at: string
  expires_at: string | null
  is_active: boolean
}

// Mock Data for Demo
const MOCK_PACKAGES: PackageData[] = [
  {
    id: "1",
    name: "باقة الأسبوع الأول",
    description: "محتوى تعليمي متكامل للأسبوع الأول من الفصل الدراسي",
    price: 50,
    original_price: 75,
    image_url: null,
    grade: "first",
    type: "weekly",
    lecture_count: 4,
    duration_days: 7,
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-02-01T14:30:00Z",
  },
  {
    id: "2",
    name: "باقة الأسبوع الثاني",
    description: "استمر في رحلة التعلم مع محتوى الأسبوع الثاني",
    price: 50,
    original_price: null,
    image_url: null,
    grade: "first",
    type: "weekly",
    lecture_count: 5,
    duration_days: 7,
    is_active: true,
    created_at: "2024-01-20T10:00:00Z",
    updated_at: "2024-02-03T09:15:00Z",
  },
  {
    id: "3",
    name: "باقة شهر يناير",
    description: "كل محتوى شهر يناير في باقة واحدة بسعر مميز",
    price: 150,
    original_price: 200,
    image_url: null,
    grade: "first",
    type: "monthly",
    lecture_count: 16,
    duration_days: 30,
    is_active: true,
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-28T16:45:00Z",
  },
  {
    id: "4",
    name: "باقة شهر فبراير",
    description: "محتوى شهر فبراير الشامل",
    price: 150,
    original_price: null,
    image_url: null,
    grade: "first",
    type: "monthly",
    lecture_count: 14,
    duration_days: 30,
    is_active: true,
    created_at: "2024-02-01T10:00:00Z",
    updated_at: "2024-02-05T11:20:00Z",
  },
  {
    id: "5",
    name: "باقة الترم الأول",
    description: "الباقة الشاملة للترم الأول بالكامل - وفر أكثر من 40%",
    price: 400,
    original_price: 700,
    image_url: null,
    grade: "first",
    type: "term",
    lecture_count: 48,
    duration_days: 120,
    is_active: true,
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-02-04T13:00:00Z",
  },
  {
    id: "6",
    name: "عرض البداية",
    description: "عرض خاص للطلاب الجدد - خصم 50% على أول باقة",
    price: 75,
    original_price: 150,
    image_url: null,
    grade: "first",
    type: "offer",
    lecture_count: 8,
    duration_days: 14,
    is_active: true,
    created_at: "2024-02-01T10:00:00Z",
    updated_at: "2024-02-05T08:00:00Z",
  },
  {
    id: "7",
    name: "عرض المتفوقين",
    description: "باقة خاصة للطلاب المتميزين مع محتوى إضافي حصري",
    price: 200,
    original_price: 350,
    image_url: null,
    grade: "first",
    type: "offer",
    lecture_count: 20,
    duration_days: 45,
    is_active: true,
    created_at: "2024-01-25T10:00:00Z",
    updated_at: "2024-02-02T17:30:00Z",
  },
]

const MOCK_USER_PACKAGES: UserPackage[] = [
  {
    id: "up1",
    package_id: "1",
    purchased_at: "2024-02-01T10:00:00Z",
    expires_at: "2024-02-08T10:00:00Z",
    is_active: true,
  },
]

const MOCK_WALLET_BALANCE = 250

// Grade configuration
const GRADE_CONFIG: Record<string, { name: string; icon: React.ReactNode; color: string; students: number }> = {
  first: {
    name: "الصف الأول الثانوي",
    icon: <GraduationCap size={32} />,
    color: "#3b82f6",
    students: 1250,
  },
  second: {
    name: "الصف الثاني الثانوي",
    icon: <GraduationCap size={32} />,
    color: "#8b5cf6",
    students: 980,
  },
  third: {
    name: "الصف الثالث الثانوي",
    icon: <GraduationCap size={32} />,
    color: "#f59e0b",
    students: 1420,
  },
}

// Tab configuration
const TABS = [
  { id: "weekly", label: "الأسبوعية", icon: <Calendar size={18} /> },
  { id: "monthly", label: "الشهرية", icon: <Layers size={18} /> },
  { id: "term", label: "الترم", icon: <BookOpen size={18} /> },
  { id: "offer", label: "العروض", icon: <Gift size={18} /> },
]

// Helper functions
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "اليوم"
  if (diffDays === 1) return "أمس"
  if (diffDays < 7) return `منذ ${diffDays} أيام`
  if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`
  return date.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })
}

function getRemainingDays(expiresAt: string | null): number | null {
  if (!expiresAt) return null
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffMs = expiry.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

function getTypeIcon(type: string) {
  switch (type) {
    case "weekly":
      return <Calendar size={16} />
    case "monthly":
      return <Layers size={16} />
    case "term":
      return <BookOpen size={16} />
    case "offer":
      return <Gift size={16} />
    default:
      return <Package size={16} />
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case "weekly":
      return "أسبوعية"
    case "monthly":
      return "شهرية"
    case "term":
      return "ترم"
    case "offer":
      return "عرض"
    default:
      return type
  }
}

// Confetti Component
function Confetti() {
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"][Math.floor(Math.random() * 5)],
    size: 8 + Math.random() * 8,
  }))

  return (
    <div className={styles.confettiContainer}>
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          className={styles.confettiPiece}
          initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
          animate={{
            y: window.innerHeight + 100,
            x: (Math.random() - 0.5) * 200,
            rotate: Math.random() * 720 - 360,
            opacity: 0,
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeOut",
          }}
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  )
}

// Package Card Component
function PackageCard({
  pkg,
  isOwned,
  userPackage,
  onPurchase,
  onEnter,
}: {
  pkg: PackageData
  isOwned: boolean
  userPackage?: UserPackage
  onPurchase: () => void
  onEnter: () => void
}) {
  const remainingDays = userPackage ? getRemainingDays(userPackage.expires_at) : null
  const discount = pkg.original_price ? Math.round(((pkg.original_price - pkg.price) / pkg.original_price) * 100) : null

  return (
    <motion.div
      className={`${styles.packageCard} ${isOwned ? styles.ownedCard : ""}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      {/* Card Image/Header */}
      <div className={styles.cardImageSection}>
        <div className={styles.cardImageOverlay} />
        <div className={styles.cardImageContent}>
          {getTypeIcon(pkg.type)}
          <span>{getTypeLabel(pkg.type)}</span>
        </div>
        {discount && (
          <div className={styles.discountBadge}>
            <Sparkles size={12} />
            <span>خصم {discount}%</span>
          </div>
        )}
        {isOwned && (
          <div className={styles.ownedBadge}>
            <Check size={14} />
            <span>مشترك</span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{pkg.name}</h3>
        {pkg.description && <p className={styles.cardDescription}>{pkg.description}</p>}

        {/* Stats */}
        <div className={styles.cardStats}>
          <div className={styles.cardStat}>
            <Play size={14} />
            <span>{pkg.lecture_count} محاضرة</span>
          </div>
          <div className={styles.cardStat}>
            <Timer size={14} />
            <span>{pkg.duration_days} يوم</span>
          </div>
          <div className={styles.cardStat}>
            <Clock size={14} />
            <span>{formatDate(pkg.updated_at)}</span>
          </div>
        </div>

        {/* Expiry Info for Owned Packages */}
        {isOwned && remainingDays !== null && (
          <div className={styles.expiryInfo}>
            <Clock size={14} />
            <span>
              {remainingDays > 0 ? `متبقي ${remainingDays} يوم` : "انتهت الصلاحية"}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className={styles.cardFooter}>
          <div className={styles.priceSection}>
            {pkg.original_price && <span className={styles.originalPrice}>{pkg.original_price} ج.م</span>}
            <span className={styles.currentPrice}>
              {pkg.price} <small>ج.م</small>
            </span>
          </div>

          {isOwned ? (
            <motion.button
              className={styles.enterButton}
              onClick={onEnter}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play size={18} />
              <span>دخول</span>
            </motion.button>
          ) : (
            <motion.button
              className={styles.purchaseButton}
              onClick={onPurchase}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ShoppingCart size={18} />
              <span>اشتراك</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Purchase Modal Component
function PurchaseModal({
  pkg,
  walletBalance,
  onClose,
  onSuccess,
}: {
  pkg: PackageData
  walletBalance: number
  onClose: () => void
  onSuccess: () => void
}) {
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "code">("wallet")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const canPayWithWallet = walletBalance >= pkg.price

  const handlePurchase = async () => {
    setLoading(true)
    setError("")

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    if (paymentMethod === "code") {
      if (!code.trim()) {
        setError("يرجى إدخال كود الاشتراك")
        setLoading(false)
        return
      }
      // Demo: Accept any code that starts with "CODE"
      if (!code.toUpperCase().startsWith("CODE")) {
        setError("كود الاشتراك غير صحيح أو مستخدم مسبقاً")
        setLoading(false)
        return
      }
    } else {
      if (!canPayWithWallet) {
        setError("رصيد المحفظة غير كافي")
        setLoading(false)
        return
      }
    }

    setSuccess(true)
    setLoading(false)

    // Auto close after success
    setTimeout(() => {
      onSuccess()
    }, 2000)
  }

  return (
    <AnimatePresence>
      <motion.div
        className={styles.modalOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {success && <Confetti />}
        <motion.div
          className={styles.modalContent}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {!success ? (
            <>
              <button className={styles.modalClose} onClick={onClose}>
                <X size={20} />
              </button>

              {/* Header */}
              <div className={styles.modalHeader}>
                <div className={styles.modalIconWrapper}>
                  <CreditCard size={28} />
                </div>
                <h3>{pkg.name}</h3>
                <div className={styles.modalPrice}>
                  <span className={styles.priceValue}>{pkg.price}</span>
                  <span className={styles.priceCurrency}>جنيه مصري</span>
                  {pkg.original_price && (
                    <span className={styles.modalOriginalPrice}>بدلاً من {pkg.original_price} ج.م</span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className={styles.modalBody}>
                {/* Payment Methods */}
                <div className={styles.paymentMethods}>
                  {/* Wallet Option */}
                  <button
                    className={`${styles.methodCard} ${paymentMethod === "wallet" ? styles.methodActive : ""}`}
                    onClick={() => setPaymentMethod("wallet")}
                  >
                    <div className={styles.methodIcon}>
                      <Wallet size={20} />
                    </div>
                    <div className={styles.methodInfo}>
                      <strong>الدفع من المحفظة</strong>
                      <span className={canPayWithWallet ? styles.sufficient : styles.insufficient}>
                        رصيدك: {walletBalance} ج.م
                      </span>
                    </div>
                    <div className={styles.methodCheck}>
                      {paymentMethod === "wallet" &&
                        (canPayWithWallet ? (
                          <CheckCircle2 size={24} className={styles.checkSuccess} />
                        ) : (
                          <AlertCircle size={24} className={styles.checkError} />
                        ))}
                    </div>
                  </button>

                  {/* Code Option */}
                  <button
                    className={`${styles.methodCard} ${paymentMethod === "code" ? styles.methodActive : ""}`}
                    onClick={() => setPaymentMethod("code")}
                  >
                    <div className={`${styles.methodIcon} ${styles.methodIconCode}`}>
                      <Key size={20} />
                    </div>
                    <div className={styles.methodInfo}>
                      <strong>كود اشتراك</strong>
                      <span>لديك كود؟ أدخله هنا</span>
                    </div>
                    <div className={styles.methodCheck}>
                      {paymentMethod === "code" && <CheckCircle2 size={24} className={styles.checkSuccess} />}
                    </div>
                  </button>
                </div>

                {/* Code Input */}
                {paymentMethod === "code" && (
                  <motion.div
                    className={styles.codeInputSection}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <input
                      type="text"
                      className={styles.codeInput}
                      placeholder="أدخل كود الاشتراك"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      dir="ltr"
                    />
                  </motion.div>
                )}

                {/* Insufficient Balance Warning */}
                {paymentMethod === "wallet" && !canPayWithWallet && (
                  <div className={styles.insufficientWarning}>
                    <AlertCircle size={20} />
                    <div>
                      <strong>رصيد غير كافي</strong>
                      <span>تحتاج {pkg.price - walletBalance} ج.م إضافية</span>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div
                    className={styles.errorMessage}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Confirm Button */}
                <motion.button
                  className={styles.confirmButton}
                  onClick={handlePurchase}
                  disabled={loading || (paymentMethod === "wallet" && !canPayWithWallet)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Clock size={20} />
                    </motion.div>
                  ) : (
                    <>
                      <ShoppingCart size={20} />
                      <span>تأكيد الاشتراك</span>
                    </>
                  )}
                </motion.button>

                {/* Security Note */}
                <div className={styles.securityNote}>
                  <Shield size={14} />
                  <span>معاملة آمنة ومشفرة</span>
                </div>
              </div>
            </>
          ) : (
            <motion.div
              className={styles.successView}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className={styles.successIcon}>
                <CheckCircle2 size={48} />
              </div>
              <h3>تم الاشتراك بنجاح!</h3>
              <p>يمكنك الآن الوصول إلى محتوى الباقة</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Main Page Component
export default function GradePage({ params }: { params: Promise<{ grade: string }> }) {
  const resolvedParams = use(params)
  const gradeSlug = resolvedParams.grade

  const [activeTab, setActiveTab] = useState<string>("weekly")
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null)
  const [userPackages, setUserPackages] = useState<UserPackage[]>(MOCK_USER_PACKAGES)
  const [walletBalance, setWalletBalance] = useState(MOCK_WALLET_BALANCE)

  // Get grade config
  const gradeConfig = GRADE_CONFIG[gradeSlug] || GRADE_CONFIG.first

  // Filter packages by current grade and active tab
  const filteredPackages = useMemo(() => {
    return MOCK_PACKAGES.filter((pkg) => pkg.grade === gradeSlug && pkg.type === activeTab && pkg.is_active)
  }, [gradeSlug, activeTab])

  // Check if user owns a package
  const isPackageOwned = (packageId: string) => {
    return userPackages.some((up) => up.package_id === packageId && up.is_active)
  }

  // Get user package data
  const getUserPackage = (packageId: string) => {
    return userPackages.find((up) => up.package_id === packageId)
  }

  // Handle purchase success
  const handlePurchaseSuccess = () => {
    if (selectedPackage) {
      // Add to user packages
      setUserPackages((prev) => [
        ...prev,
        {
          id: `up${Date.now()}`,
          package_id: selectedPackage.id,
          purchased_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + selectedPackage.duration_days * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
        },
      ])
      // Deduct from wallet
      setWalletBalance((prev) => prev - selectedPackage.price)
    }
    setSelectedPackage(null)
  }

  // Stats
  const totalPackages = MOCK_PACKAGES.filter((p) => p.grade === gradeSlug && p.is_active).length
  const totalLectures = MOCK_PACKAGES.filter((p) => p.grade === gradeSlug && p.is_active).reduce(
    (sum, p) => sum + p.lecture_count,
    0
  )
  const ownedCount = userPackages.filter((up) =>
    MOCK_PACKAGES.some((p) => p.id === up.package_id && p.grade === gradeSlug)
  ).length

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerInner}>
            {/* Logo */}
            <div className={styles.brand}>
              <div className={styles.logoMark}>
                <GraduationCap size={24} />
              </div>
              <div className={styles.brandText}>
                <span className={styles.brandName}>منصة محمود الديب</span>
                <span className={styles.brandTagline}>التعليمية</span>
              </div>
            </div>

            {/* Wallet Widget */}
            <div className={styles.walletWidget}>
              <div className={styles.walletIconWrapper}>
                <Wallet size={18} />
              </div>
              <div className={styles.walletInfo}>
                <span className={styles.walletLabel}>المحفظة</span>
                <span className={styles.walletBalance}>{walletBalance} ج.م</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <motion.div
          className={styles.heroContent}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.gradeIcon} style={{ background: `linear-gradient(135deg, ${gradeConfig.color}, ${gradeConfig.color}dd)` }}>
            {gradeConfig.icon}
          </div>
          <h1 className={styles.heroTitle}>{gradeConfig.name}</h1>
          <p className={styles.heroSubtitle}>اختر الباقة المناسبة لك وابدأ رحلة التفوق</p>

          {/* Hero Stats */}
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{totalPackages}</span>
              <span className={styles.heroStatLabel}>باقة متاحة</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{totalLectures}</span>
              <span className={styles.heroStatLabel}>محاضرة</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{gradeConfig.students}+</span>
              <span className={styles.heroStatLabel}>طالب</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Quick Stats */}
      <section className={styles.quickStatsSection}>
        <div className={styles.quickStats}>
          <motion.div
            className={styles.quickStatCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className={styles.quickStatIcon} style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}>
              <Package size={20} />
            </div>
            <div className={styles.quickStatInfo}>
              <span className={styles.quickStatValue}>{totalPackages}</span>
              <span className={styles.quickStatLabel}>إجمالي الباقات</span>
            </div>
          </motion.div>

          <motion.div
            className={styles.quickStatCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className={styles.quickStatIcon} style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              <Star size={20} />
            </div>
            <div className={styles.quickStatInfo}>
              <span className={styles.quickStatValue}>{ownedCount}</span>
              <span className={styles.quickStatLabel}>باقاتك</span>
            </div>
          </motion.div>

          <motion.div
            className={styles.quickStatCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={styles.quickStatIcon} style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
              <Users size={20} />
            </div>
            <div className={styles.quickStatInfo}>
              <span className={styles.quickStatValue}>{gradeConfig.students}+</span>
              <span className={styles.quickStatLabel}>طالب مشترك</span>
            </div>
          </motion.div>

          <motion.div
            className={styles.quickStatCard}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className={styles.quickStatIcon} style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
              <TrendingUp size={20} />
            </div>
            <div className={styles.quickStatInfo}>
              <span className={styles.quickStatValue}>{totalLectures}</span>
              <span className={styles.quickStatLabel}>محاضرة</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <nav className={styles.tabsNav}>
        <div className={styles.tabsContainer}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {filteredPackages.length > 0 ? (
              <div className={styles.packagesGrid}>
                {filteredPackages.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    isOwned={isPackageOwned(pkg.id)}
                    userPackage={getUserPackage(pkg.id)}
                    onPurchase={() => setSelectedPackage(pkg)}
                    onEnter={() => {
                      // Navigate to package content
                      window.location.href = `/grades/${gradeSlug}/packages/${pkg.id}`
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Package size={40} />
                </div>
                <h3>لا توجد باقات متاحة</h3>
                <p>لا توجد باقات {getTypeLabel(activeTab)} متاحة حالياً</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Purchase Modal */}
      {selectedPackage && (
        <PurchaseModal
          pkg={selectedPackage}
          walletBalance={walletBalance}
          onClose={() => setSelectedPackage(null)}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  )
}
