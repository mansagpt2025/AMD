'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, CreditCard, Ticket, Loader2, 
  CheckCircle2, AlertCircle, Sparkles,
  ShieldCheck, Clock, Zap, AlertTriangle,
  PlayCircle, Wallet
} from 'lucide-react'
import { createClientBrowser } from '@/lib/supabase/sf-client'
import { deductWalletBalance, markCodeAsUsed, createUserPackage } from '@/app/grades/[grade]/actions'
import styles from './PurchaseModal.module.css'

interface PurchaseModalProps {
  pkg: any
  user: any
  walletBalance: number
  gradeSlug: string
  onClose: () => void
  onSuccess: (packageId: string) => void
  theme: any
}

export default function PurchaseModal({
  pkg,
  user,
  walletBalance,
  gradeSlug,
  onClose,
  onSuccess,
  theme
}: PurchaseModalProps) {
  const supabase = createClientBrowser()
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'code'>('wallet')
  const [code, setCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [validatedCode, setValidatedCode] = useState<any>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  // إغلاق النافذة عند الضغط على ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const validateCode = async () => {
    if (!code.trim()) {
      setError('يرجى إدخال الكود')
      return
    }

    setIsValidating(true)
    setError('')
    setSuccess('')
    setValidatedCode(null)

    try {
      const trimmedCode = code.trim().toUpperCase()
      
      // التحقق من تنسيق الكود
      if (!trimmedCode.match(/^[A-Z0-9]{6,20}$/)) {
        throw new Error('تنسيق الكود غير صحيح')
      }

      // جلب بيانات الكود
      const { data: codeData, error: codeError } = await supabase
        .from('codes')
        .select('*')
        .eq('code', trimmedCode)
        .single()

      if (codeError || !codeData) {
        throw new Error('الكود غير موجود في النظام')
      }

      // التحقق من الحالة
      if (codeData.is_used) {
        throw new Error('هذا الكود مستخدم بالفعل')
      }

      if (codeData.grade !== gradeSlug) {
        throw new Error(`هذا الكود مخصص للصف ${codeData.grade}`)
      }

      if (codeData.package_id && codeData.package_id !== pkg.id) {
        throw new Error('هذا الكود مخصص لباقة أخرى')
      }

      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        throw new Error('هذا الكود منتهي الصلاحية')
      }

      // التحقق من عدم الشراء مسبقاً
      const { data: existingPurchase } = await supabase
        .from('user_packages')
        .select('id')
        .eq('user_id', user.id)
        .eq('package_id', pkg.id)
        .maybeSingle()

      if (existingPurchase) {
        throw new Error('لقد قمت بشراء هذه الباقة من قبل')
      }

      setSuccess('✅ الكود صالح للاستخدام!')
      setValidatedCode(codeData)

    } catch (err: any) {
      setError(err.message || 'حدث خطأ في التحقق')
    } finally {
      setIsValidating(false)
    }
  }

  const handlePurchase = async () => {
    setError('')
    setIsPurchasing(true)

    try {
      if (paymentMethod === 'wallet') {
        await handleWalletPurchase()
      } else {
        await handleCodePurchase()
      }
    } catch (err: any) {
      setError(err.message)
      setIsPurchasing(false)
    }
  }

  const handleWalletPurchase = async () => {
    if (walletBalance < pkg.price) {
      throw new Error(`رصيد غير كافٍ. المطلوب: ${pkg.price} جنيه، المتاح: ${walletBalance} جنيه`)
    }

    // تنفيذ الشراء
    const deductResult = await deductWalletBalance(user.id, pkg.price, pkg.id, 'wallet')
    
    if (!deductResult.success) {
      throw new Error(deductResult.message)
    }

    const packageResult = await createUserPackage(user.id, pkg.id, pkg.duration_days || 30, 'wallet')
    
    if (!packageResult.success) {
      // استرجاع الرصيد في حالة الفشل
      throw new Error(packageResult.message)
    }

    setShowConfetti(true)
    setTimeout(() => {
      onSuccess(pkg.id)
    }, 2000)
  }

  const handleCodePurchase = async () => {
    if (!validatedCode) {
      throw new Error('يرجى التحقق من الكود أولاً')
    }

    // التحقق النهائي قبل الاستخدام
    const { data: finalCheck } = await supabase
      .from('codes')
      .select('*')
      .eq('id', validatedCode.id)
      .eq('is_used', false)
      .single()

    if (!finalCheck) {
      throw new Error('الكود غير متاح للاستخدام الآن')
    }

    // استخدام الكود
    const codeResult = await markCodeAsUsed(validatedCode.id, user.id)
    
    if (!codeResult.success) {
      throw new Error(codeResult.message)
    }

    // إضافة الباقة
    const packageResult = await createUserPackage(user.id, pkg.id, pkg.duration_days || 30, 'code')
    
    if (!packageResult.success) {
      // محاولة إرجاع الكود في حالة الفشل
      await supabase
        .from('codes')
        .update({ is_used: false, used_by: null, used_at: null })
        .eq('id', validatedCode.id)
      
      throw new Error(packageResult.message)
    }

    setShowConfetti(true)
    setTimeout(() => {
      onSuccess(pkg.id)
    }, 2000)
  }

  const canPurchase = 
    paymentMethod === 'wallet' 
      ? walletBalance >= pkg.price
      : validatedCode !== null

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          className={styles.modalContainer}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>

          {/* Header */}
          <div className={styles.modalHeader} style={{ background: theme.gradient }}>
            <Sparkles className={styles.headerIcon} />
            <div>
              <h3 className={styles.modalTitle}>{pkg.name}</h3>
              <p className={styles.modalSubtitle}>شراء آمن وسهل</p>
            </div>
          </div>

          <div className={styles.modalBody}>
            {/* Features */}
            <div className={styles.featuresGrid}>
              <div className={styles.feature}>
                <PlayCircle size={20} style={{ color: theme.primary }} />
                <span>{pkg.lecture_count || 0} محاضرة</span>
              </div>
              <div className={styles.feature}>
                <Clock size={20} style={{ color: theme.primary }} />
                <span>{pkg.duration_days || 30} يوم صلاحية</span>
              </div>
              <div className={styles.feature}>
                <ShieldCheck size={20} style={{ color: theme.primary }} />
                <span>ضمان استعادة المبلغ</span>
              </div>
            </div>

            {/* Price */}
            <div className={styles.priceBox} style={{ borderColor: theme.primary }}>
              <span className={styles.priceLabel}>السعر الإجمالي</span>
              <span className={styles.priceValue} style={{ color: theme.primary }}>
                {(pkg.price || 0).toLocaleString()} جنيه
              </span>
            </div>

            {/* Payment Methods */}
            <div className={styles.paymentSection}>
              <h4 className={styles.sectionTitle}>اختر طريقة الدفع</h4>
              
              <div className={styles.methodsGrid}>
                <button
                  onClick={() => setPaymentMethod('wallet')}
                  className={`${styles.methodBtn} ${paymentMethod === 'wallet' ? styles.active : ''}`}
                  style={paymentMethod === 'wallet' ? { borderColor: theme.primary } : {}}
                >
                  <div className={styles.methodIcon} style={{ background: `${theme.primary}15` }}>
                    <Wallet size={24} style={{ color: theme.primary }} />
                  </div>
                  <div className={styles.methodInfo}>
                    <span className={styles.methodName}>المحفظة الإلكترونية</span>
                    <span className={styles.methodDesc}>الرصيد: {walletBalance.toLocaleString()} جنيه</span>
                  </div>
                  {paymentMethod === 'wallet' && (
                    <CheckCircle2 size={20} style={{ color: theme.primary }} />
                  )}
                </button>

                <button
                  onClick={() => setPaymentMethod('code')}
                  className={`${styles.methodBtn} ${paymentMethod === 'code' ? styles.active : ''}`}
                  style={paymentMethod === 'code' ? { borderColor: theme.primary } : {}}
                >
                  <div className={styles.methodIcon} style={{ background: `${theme.warning}15` }}>
                    <Ticket size={24} style={{ color: theme.warning }} />
                  </div>
                  <div className={styles.methodInfo}>
                    <span className={styles.methodName}>كود تفعيل</span>
                    <span className={styles.methodDesc}>أدخل كود الخصم</span>
                  </div>
                  {paymentMethod === 'code' && (
                    <CheckCircle2 size={20} style={{ color: theme.primary }} />
                  )}
                </button>
              </div>
            </div>

            {/* Code Input */}
            {paymentMethod === 'code' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={styles.codeSection}
              >
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className={styles.codeInput}
                    placeholder="XXXX-XXXX-XXXX"
                    dir="ltr"
                    disabled={isValidating || isPurchasing}
                  />
                  <button
                    onClick={validateCode}
                    disabled={isValidating || !code.trim() || isPurchasing}
                    className={styles.validateBtn}
                    style={{ background: theme.primary }}
                  >
                    {isValidating ? <Loader2 className={styles.spinner} size={20} /> : 'تحقق'}
                  </button>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={styles.errorMessage}
                    >
                      <AlertCircle size={18} />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={styles.successMessage}
                    >
                      <CheckCircle2 size={18} />
                      <span>{success}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {validatedCode && (
                  <div className={styles.codeInfo}>
                    <ShieldCheck size={16} style={{ color: theme.success }} />
                    <span>الكود صالح ولم يُستخدم من قبل</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Purchase Button */}
            <motion.button
              onClick={handlePurchase}
              disabled={isPurchasing || !canPurchase}
              className={styles.purchaseBtn}
              style={{ 
                background: canPurchase ? theme.gradient : '#cbd5e1',
                opacity: isPurchasing ? 0.7 : 1
              }}
              whileHover={canPurchase ? { scale: 1.02 } : {}}
              whileTap={canPurchase ? { scale: 0.98 } : {}}
            >
              {isPurchasing ? (
                <>
                  <Loader2 className={styles.spinner} size={24} />
                  جاري معالجة الطلب...
                </>
              ) : paymentMethod === 'wallet' && walletBalance < pkg.price ? (
                <>
                  <AlertTriangle size={20} />
                  الرصيد غير كافٍ
                </>
              ) : (
                <>
                  <Zap size={20} />
                  تأكيد الشراء الآن
                </>
              )}
            </motion.button>

            {paymentMethod === 'wallet' && walletBalance < pkg.price && (
              <p className={styles.helperText}>
                <button 
                  onClick={() => window.location.href = '/wallet'} 
                  className={styles.link}
                  style={{ color: theme.primary }}
                >
                  إضافة رصيد للمحفظة
                </button>
              </p>
            )}

            <div className={styles.securityBadge}>
              <ShieldCheck size={16} />
              <span>معاملة آمنة ومشفرة 256-bit</span>
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
                initial={{ 
                  y: -100, 
                  x: Math.random() * window.innerWidth,
                  rotate: 0,
                  opacity: 1 
                }}
                animate={{ 
                  y: window.innerHeight + 100,
                  rotate: 360 * Math.random(),
                  opacity: 0
                }}
                transition={{ 
                  duration: 2 + Math.random() * 2,
                  ease: "easeOut"
                }}
                style={{
                  position: 'fixed',
                  width: 10 + Math.random() * 10,
                  height: 10 + Math.random() * 10,
                  background: [theme.primary, theme.accent, theme.success, theme.warning][Math.floor(Math.random() * 4)],
                  borderRadius: Math.random() > 0.5 ? '50%' : '0',
                  zIndex: 9999,
                  top: 0
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </>
  )
}