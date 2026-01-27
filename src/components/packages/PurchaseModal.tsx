'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, CreditCard, Ticket, Loader2, 
  CheckCircle2, Shield, Users, BookOpen,
  AlertCircle, Lock, Sparkles, Gift,
  ShieldCheck, Clock, Zap
} from 'lucide-react'
import styles from './PurchaseModal.module.css'

interface PurchaseModalProps {
  package: any
  user: any
  walletBalance: number
  gradeSlug: string
  onClose: () => void
  onSuccess: (purchasedPackageId: string) => void
  theme: any
}

export default function PurchaseModal({
  package: pkg,
  user,
  walletBalance,
  gradeSlug,
  onClose,
  onSuccess,
  theme
}: PurchaseModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'code'>('wallet')
  const [code, setCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [validationSuccess, setValidationSuccess] = useState('')
  const [validatedCode, setValidatedCode] = useState<any>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  // التحقق من الكود
  const validateCode = async () => {
    if (!code.trim()) {
      setValidationError('يرجى إدخال الكود')
      return
    }

    setIsValidating(true)
    setValidationError('')
    setValidationSuccess('')

    try {
      // محاكاة للتحقق من الكود - يمكن استبدالها بطلب API حقيقي
      await new Promise(resolve => setTimeout(resolve, 1000))

      // محاكاة نجاح التحقق
      setValidationSuccess('الكود صالح ويمكن استخدامه!')
      setValidatedCode({
        id: 'temp-code-id',
        code: code,
        packageId: pkg.id
      })
    } catch (err: any) {
      setValidationError('كود غير صالح أو منتهي الصلاحية')
      setValidatedCode(null)
    } finally {
      setIsValidating(false)
    }
  }

  // إتمام الشراء
  const handlePurchase = async () => {
    setIsPurchasing(true)

    try {
      if (paymentMethod === 'wallet') {
        // التحقق من الرصيد
        if (walletBalance < pkg.price) {
          throw new Error(`رصيد المحفظة غير كافٍ. الرصيد المطلوب: ${pkg.price} جنيه`)
        }

        // محاكاة عملية الشراء
        await new Promise(resolve => setTimeout(resolve, 1500))

        setShowConfetti(true)
        setTimeout(() => {
          onSuccess(pkg.id)
        }, 2000)
      } else {
        // الشراء بالكود
        if (!validatedCode) {
          throw new Error('يرجى التحقق من صحة الكود أولاً')
        }

        // محاكاة عملية الشراء بالكود
        await new Promise(resolve => setTimeout(resolve, 1500))

        setShowConfetti(true)
        setTimeout(() => {
          onSuccess(pkg.id)
        }, 2000)
      }
    } catch (err: any) {
      setValidationError(err.message)
      setIsPurchasing(false)
    }
  }

  const getPackageType = () => {
    switch (pkg.type) {
      case 'weekly': return 'أسبوعية'
      case 'monthly': return 'شهرية'
      case 'term': return 'ترم كامل'
      default: return 'خاص'
    }
  }

  return (
    <>
      <div className={styles.modalOverlay}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={styles.modalContainer}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className={styles.closeButton}
          >
            <X className={styles.closeIcon} />
          </button>

          {/* Header */}
          <div className={styles.modalHeader}>
            <div className={styles.packageIcon} style={{ background: theme.primary }}>
              <Gift className={styles.headerIcon} />
            </div>
            <div className={styles.headerContent}>
              <h3 className={styles.modalTitle}>{pkg.name}</h3>
              <p className={styles.modalSubtitle}>باقة {getPackageType()}</p>
            </div>
          </div>

          {/* Price Section */}
          <div className={styles.priceSection}>
            <div className={styles.priceDisplay}>
              <span className={styles.priceCurrency}>جنيه</span>
              <span className={styles.priceAmount}>{pkg.price.toLocaleString()}</span>
            </div>
            <div className={styles.discountBadge}>
              <Sparkles className={styles.discountIcon} />
              <span>وفر حتى 30%</span>
            </div>
          </div>

          {/* Features */}
          <div className={styles.featuresSection}>
            <div className={styles.featuresGrid}>
              <div className={styles.featureItem}>
                <BookOpen className={styles.featureIcon} style={{ color: theme.primary }} />
                <div>
                  <div className={styles.featureValue}>{pkg.lecture_count}</div>
                  <div className={styles.featureLabel}>محاضرة</div>
                </div>
              </div>
              <div className={styles.featureItem}>
                <Clock className={styles.featureIcon} style={{ color: theme.primary }} />
                <div>
                  <div className={styles.featureValue}>{pkg.duration_days}</div>
                  <div className={styles.featureLabel}>يوم</div>
                </div>
              </div>
              <div className={styles.featureItem}>
                <ShieldCheck className={styles.featureIcon} style={{ color: theme.primary }} />
                <div>
                  <div className={styles.featureValue}>نعم</div>
                  <div className={styles.featureLabel}>ضمان</div>
                </div>
              </div>
              <div className={styles.featureItem}>
                <Zap className={styles.featureIcon} style={{ color: theme.primary }} />
                <div>
                  <div className={styles.featureValue}>24/7</div>
                  <div className={styles.featureLabel}>دعم</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className={styles.paymentSection}>
            <h4 className={styles.sectionTitle}>طريقة الدفع</h4>
            
            <div className={styles.paymentMethods}>
              <button
                onClick={() => setPaymentMethod('wallet')}
                className={`${styles.paymentMethod} ${
                  paymentMethod === 'wallet' ? styles.selectedMethod : ''
                }`}
              >
                <div className={styles.methodIcon}>
                  <CreditCard className={styles.methodSvg} />
                </div>
                <div className={styles.methodInfo}>
                  <div className={styles.methodTitle}>الدفع من المحفظة</div>
                  <div className={styles.methodDescription}>
                    رصيدك: <span className={styles.balanceAmount}>{walletBalance.toLocaleString()}</span> جنيه
                  </div>
                </div>
                {paymentMethod === 'wallet' && (
                  <CheckCircle2 className={styles.checkIcon} style={{ color: theme.primary }} />
                )}
              </button>

              <button
                onClick={() => setPaymentMethod('code')}
                className={`${styles.paymentMethod} ${
                  paymentMethod === 'code' ? styles.selectedMethod : ''
                }`}
              >
                <div className={styles.methodIcon}>
                  <Ticket className={styles.methodSvg} />
                </div>
                <div className={styles.methodInfo}>
                  <div className={styles.methodTitle}>كود تفعيل</div>
                  <div className={styles.methodDescription}>أدخل كود الشراء</div>
                </div>
                {paymentMethod === 'code' && (
                  <CheckCircle2 className={styles.checkIcon} style={{ color: theme.primary }} />
                )}
              </button>
            </div>
          </div>

          {/* Code Input */}
          {paymentMethod === 'code' && (
            <div className={styles.codeSection}>
              <div className={styles.codeInputGroup}>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={styles.codeInput}
                  placeholder="أدخل كود التفعيل"
                  dir="ltr"
                />
                <button
                  onClick={validateCode}
                  disabled={isValidating || !code.trim()}
                  className={styles.validateButton}
                  style={{ background: theme.primary }}
                >
                  {isValidating ? (
                    <Loader2 className={`${styles.buttonIcon} ${styles.spinning}`} />
                  ) : (
                    'التحقق'
                  )}
                </button>
              </div>

              {/* Validation Messages */}
              <AnimatePresence>
                {validationError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`${styles.message} ${styles.errorMessage}`}
                  >
                    <AlertCircle className={styles.messageIcon} />
                    <span>{validationError}</span>
                  </motion.div>
                )}

                {validationSuccess && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`${styles.message} ${styles.successMessage}`}
                  >
                    <CheckCircle2 className={styles.messageIcon} />
                    <span>{validationSuccess}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Code Info */}
              {validatedCode && (
                <div className={styles.codeInfo}>
                  <div className={styles.codeInfoHeader}>
                    <Shield className={styles.infoIcon} />
                    <h5 className={styles.infoTitle}>معلومات الكود</h5>
                  </div>
                  <div className={styles.codeInfoGrid}>
                    <div className={styles.infoItem}>
                      <Lock className={styles.itemIcon} />
                      <span>الكود صالح للاستخدام مرة واحدة</span>
                    </div>
                    <div className={styles.infoItem}>
                      <Users className={styles.itemIcon} />
                      <span>مخصص لمستخدم واحد فقط</span>
                    </div>
                    <div className={styles.infoItem}>
                      <BookOpen className={styles.itemIcon} />
                      <span>مخصص لباقة: {pkg.name}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Purchase Button */}
          <div className={styles.actionSection}>
            <button
              onClick={handlePurchase}
              disabled={isPurchasing || (paymentMethod === 'code' && !validatedCode)}
              className={styles.purchaseButton}
              style={{ 
                background: paymentMethod === 'code' && validatedCode ? theme.success : theme.primary
              }}
            >
              {isPurchasing ? (
                <>
                  <Loader2 className={`${styles.purchaseIcon} ${styles.spinning}`} />
                  جاري المعالجة...
                </>
              ) : paymentMethod === 'code' ? (
                'تفعيل الكود'
              ) : (
                'تأكيد الشراء من المحفظة'
              )}
            </button>

            {/* Terms */}
            <p className={styles.terms}>
              بالشراء أنت توافق على <a href="/terms" className={styles.termsLink}>شروط الاستخدام</a> و <a href="/privacy" className={styles.termsLink}>سياسة الخصوصية</a>
            </p>

            {/* Security Badge */}
            <div className={styles.securityBadge}>
              <ShieldCheck className={styles.securityIcon} />
              <span>معاملة آمنة ومشفرة</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <div className={styles.confettiContainer}>
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className={styles.confetti}
                initial={{ 
                  y: -100,
                  x: Math.random() * 100 - 50,
                  opacity: 1,
                  rotate: 0
                }}
                animate={{
                  y: 1000,
                  x: Math.random() * 200 - 100,
                  opacity: 0,
                  rotate: 360
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 0.5,
                  ease: "easeOut"
                }}
                style={{
                  background: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 5)],
                  width: Math.random() * 10 + 5,
                  height: Math.random() * 10 + 5
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </>
  )
}