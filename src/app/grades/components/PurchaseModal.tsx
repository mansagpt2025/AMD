'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Package } from '../types'
import './PurchaseModal.css'

interface PurchaseModalProps {
  package: Package
  walletBalance: number
  studentId: string
  gradeId: string
  onClose: () => void
  onSuccess: () => void
}

export default function PurchaseModal({
  package: pkg,
  walletBalance,
  studentId,
  gradeId,
  onClose,
  onSuccess
}: PurchaseModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handlePurchase = async () => {
    try {
      setLoading(true)
      setError('')

      // التحقق من الرصيد
      if (walletBalance < pkg.price) {
        setError('رصيدك غير كافي للشراء')
        return
      }

      // بدء معاملة
      const { data: purchase, error: purchaseError } = await supabase
        .from('student_purchases')
        .insert({
          student_id: studentId,
          package_id: pkg.id,
          purchase_method: 'wallet',
          amount_paid: pkg.price,
          status: 'active'
        })
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // خصم من المحفظة
      const newBalance = walletBalance - pkg.price
      const { error: walletError } = await supabase
        .from('student_wallet')
        .upsert({
          student_id: studentId,
          balance: newBalance,
          last_updated: new Date().toISOString()
        })

      if (walletError) throw walletError

      // إرسال إشعار
      await supabase
        .from('notifications')
        .insert({
          user_id: studentId,
          title: 'شراء ناجح',
          message: `تم شراء باقة ${pkg.name} بنجاح`,
          type: 'purchase'
        })

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الشراء')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="purchase-modal">
      <div className="purchase-modal__overlay" onClick={onClose}></div>
      
      <div className="purchase-modal__container">
        <div className="purchase-modal__content">
          <div className="purchase-modal__header">
            <h3 className="purchase-modal__title">تأكيد الشراء</h3>
            <button
              onClick={onClose}
              className="purchase-modal__close-button"
            >
              ✕
            </button>
          </div>

          <div className="purchase-modal__body">
            <div className="purchase-modal__package-info">
              <h4 className="purchase-modal__package-name">{pkg.name}</h4>
              <p className="purchase-modal__package-description">{pkg.description}</p>
              <div className="purchase-modal__package-details">
                <span className="purchase-modal__package-price">
                  {formatPrice(pkg.price)}
                </span>
                <span className="purchase-modal__package-lectures">
                  {pkg.lectures_count} محاضرة
                </span>
              </div>
            </div>

            <div className="purchase-modal__wallet-info">
              <div className="purchase-modal__balance-row">
                <span className="purchase-modal__balance-label">رصيدك الحالي:</span>
                <span className="purchase-modal__balance-value">
                  {formatPrice(walletBalance)}
                </span>
              </div>
              <div className="purchase-modal__balance-row">
                <span className="purchase-modal__balance-label">الرصيد بعد الشراء:</span>
                <span className="purchase-modal__balance-value">
                  {formatPrice(walletBalance - pkg.price)}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="purchase-modal__error">
              <svg className="purchase-modal__error-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="purchase-modal__error-text">{error}</p>
            </div>
          )}

          <div className="purchase-modal__footer">
            <button
              onClick={onClose}
              className="purchase-modal__cancel-button"
              disabled={loading}
            >
              إلغاء
            </button>
            <button
              onClick={handlePurchase}
              disabled={loading || walletBalance < pkg.price}
              className={`purchase-modal__confirm-button ${
                walletBalance < pkg.price
                  ? 'purchase-modal__confirm-button--disabled'
                  : 'purchase-modal__confirm-button--enabled'
              }`}
            >
              {loading ? 'جاري المعالجة...' : 'تأكيد الشراء'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}