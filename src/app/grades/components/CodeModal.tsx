'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function CodeModal({
  package: pkg,
  studentId,
  gradeId,
  onClose,
  onSuccess
}: any) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">تفعيل الباقة بكود</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-4 mb-4">
              <h4 className="font-medium text-gray-800 mb-1">{pkg.name}</h4>
              <p className="text-gray-600 text-sm">{pkg.description}</p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                أدخل الكود
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="مثال: MAHMOUD2024"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-lg font-mono tracking-wider"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                الكود مكون من أحرف وأرقام كبيرة
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 space-x-reverse">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 space-x-reverse">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            </div>
          )}

          <div className="flex space-x-3 space-x-reverse">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              إلغاء
            </button>
            <button
              onClick={validateCode}
              disabled={loading || !code.trim()}
              className={`flex-1 py-3 rounded-lg font-medium text-white transition-colors ${
                !code.trim()
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700'
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