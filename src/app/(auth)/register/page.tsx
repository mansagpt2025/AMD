'use client'

import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import './RegisterPage.css'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [success, setSuccess] = useState(false)

  // التحقق من تسجيل الدخول أولاً
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      }
    }
    checkUser()
  }, [router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    const formData = new FormData(e.target as HTMLFormElement)
    
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const full_name = formData.get('full_name') as string
    const grade = formData.get('grade') as string
    const student_phone = formData.get('student_phone') as string

    // التحقق من البيانات
    if (!email || !password || !full_name || !grade || !student_phone) {
      setErrorMessage('يرجى ملء جميع الحقول المطلوبة')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('كلمة المرور غير متطابقة')
      setLoading(false)
      return
    }

    try {
      // 1. إنشاء حساب المصادقة
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name, phone: student_phone, grade }
        }
      })

      if (authError) {
        console.error('خطأ في المصادقة:', authError)
        setErrorMessage(`خطأ في إنشاء الحساب: ${authError.message}`)
        setLoading(false)
        return
      }

      if (authData.user) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login?message=تم إنشاء الحساب بنجاح. يرجى تسجيل الدخول')
        }, 3000)
      }

    } catch (error: any) {
      console.error('خطأ غير متوقع:', error)
      setErrorMessage(error.message || 'حدث خطأ أثناء التسجيل')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="success-container">
        <div className="success-icon">✓</div>
        <h2>تم إنشاء الحساب بنجاح!</h2>
        <p>يتم توجيهك إلى صفحة تسجيل الدخول...</p>
      </div>
    )
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="card-header">
          <div className="logo-container">
            <div className="logo-icon">م</div>
            <div className="logo-text">
              <span className="logo-primary">البارع</span>
              <span className="logo-secondary">محمود الديب</span>
            </div>
          </div>
          <h1 className="page-title">إنشاء حساب جديد</h1>
          <p className="page-subtitle">انضم إلى منصتنا التعليمية وابدأ رحلة التعلم</p>
        </div>

        {errorMessage && (
          <div className="error-message">
            <div className="error-icon">!</div>
            <div className="error-text">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleRegister} className="register-form">
          <div className="form-section">
            <h3>معلومات الحساب</h3>
            
            <div className="input-group">
              <label htmlFor="email">البريد الإلكتروني *</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="example@email.com"
              />
            </div>
            
            <div className="input-row">
              <div className="input-group half-width">
                <label htmlFor="password">كلمة المرور *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  minLength={6}
                  placeholder="6 أحرف على الأقل"
                />
              </div>
              
              <div className="input-group half-width">
                <label htmlFor="confirmPassword">تأكيد كلمة المرور *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  minLength={6}
                  placeholder="أعد إدخال كلمة المرور"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>المعلومات الشخصية</h3>
            
            <div className="input-group">
              <label htmlFor="full_name">الاسم الكامل *</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                required
                placeholder="الاسم الثلاثي"
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="student_phone">رقم هاتف الطالب *</label>
              <input
                type="tel"
                id="student_phone"
                name="student_phone"
                required
                placeholder="01xxxxxxxxx"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>التفاصيل الدراسية</h3>
            
            <div className="input-group">
              <label htmlFor="grade">الصف الدراسي *</label>
              <select id="grade" name="grade" required>
                <option value="">اختر الصف الدراسي</option>
                <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-register"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                جاري إنشاء الحساب...
              </>
            ) : (
              'إنشاء حساب'
            )}
          </button>
        </form>

        <div className="card-footer">
          <p className="footer-text">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="login-link">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}