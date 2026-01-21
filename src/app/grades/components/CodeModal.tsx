'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Package } from '../types'
import './CodeModal.css'

interface CodeModalProps {
  package: Package
  studentId: string
  gradeId: string
  onClose: () => void
  onSuccess: () => void
}

export default function CodeModal({
  package: pkg,
  studentId,
  gradeId,
  onClose,
  onSuccess
}: CodeModalProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const supabase = createClient()

  const validateCode = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      // التحقق من صحة الكود
      const { data: codeData, error: codeError } = await supabase
        .from('package_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('grade_id', gradeId)
        .eq('package_id', pkg.id)
        .eq('is_used', false)
        .single()

      if (codeError) {
        if (codeError.code === 'PGRST116') {
          setError('الكود غير صالح أو تم استخدامه من قبل')
        } else {
          setError('حدث خطأ في التحقق من الكود')
        }
        return
      }

      // التحقق إذا كان الطالب اشترى الباقة من قبل
      const { data: existingPurchase } = await supabase
        .from('student_purchases')
        .select('id')
        .eq('student_id', studentId)
        .eq('package_id', pkg.id)
        .eq('status', 'active')
        .single()

      if (existingPurchase) {
        setError('لقد قمت بشراء هذه الباقة من قبل')
        return
      }

      // تنشيط الكود
      const { error: updateError } = await supabase
        .from('package_codes')
        .update({
          is_used: true,
          used_by: studentId,
          used_at: new Date().toISOString()
        })
        .eq('id', codeData.id)

      if (updateError) throw updateError

      // تسجيل الشراء
      const { error: purchaseError } = await supabase
        .from('student_purchases')
        .insert({
          student_id: studentId,
          package_id: pkg.id,
          purchase_method: 'code',
          code_used: code,
          amount_paid: 0,
          status: 'active'
        })

      if (purchaseError) throw purchaseError

      setSuccess('تم تفعيل الباقة بنجاح!')
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التحقق')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="code-modal">
      <div className="code-modal__overlay" onClick={onClose}></div>
      
      <div className="code-modal__container">
        <div className="code-modal__content">
          <div className="code-modal__header">
            <h3 className="code-modal__title">تفعيل الباقة بكود</h3>
            <button
              onClick={onClose}
              className="code-modal__close-button"
            >
              ✕
            </button>
          </div>

          <div className="code-modal__body">
            <div className="code-modal__package-info">
              <h4 className="code-modal__package-name">{pkg.name}</h4>
              <p className="code-modal__package-description">{pkg.description}</p>
            </div>

            <div className="code-modal__code-input">
              <label className="code-modal__code-label">
                أدخل الكود
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="مثال: MAHMOUD2024"
                className="code-modal__code-field"
              />
              <p className="code-modal__code-hint">
                الكود مكون من أحرف وأرقام كبيرة
              </p>
            </div>
          </div>

          {error && (
            <div className="code-modal__error">
              <svg className="code-modal__error-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="code-modal__error-text">{error}</p>
            </div>
          )}

          {success && (
            <div className="code-modal__success">
              <svg className="code-modal__success-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="code-modal__success-text">{success}</p>
            </div>
          )}

          <div className="code-modal__footer">
            <button
              onClick={onClose}
              className="code-modal__cancel-button"
              disabled={loading}
            >
              إلغاء
            </button>
            <button
              onClick={validateCode}
              disabled={loading || !code.trim()}
              className={`code-modal__confirm-button ${
                !code.trim()
                  ? 'code-modal__confirm-button--disabled'
                  : 'code-modal__confirm-button--enabled'
              }`}
            >
              {loading ? 'جاري التحقق...' : 'تفعيل الكود'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}