'use client'

import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import './LoginPage.css'

// إنشاء مكون داخلي يستخدم useSearchParams
function LoginFormContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // الحصول على الرسالة من URL مباشرة
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const message = params.get('message')
    if (message) {
      setSuccessMessage(message)
      const timer = setTimeout(() => {
        setSuccessMessage('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    const formData = new FormData(e.target as HTMLFormElement)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage('لم يتم تأكيد البريد الإلكتروني. يرجى التحقق من بريدك')
        } else {
          setErrorMessage(`خطأ في تسجيل الدخول: ${error.message}`)
        }
        setLoading(false)
        return
      }

      // إذا نجح تسجيل الدخول، انتقل للداشبورد
      router.push('/dashboard')

    } catch (error: any) {
      console.error('خطأ غير متوقع:', error)
      setErrorMessage('حدث خطأ غير متوقع أثناء تسجيل الدخول')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) {
        setErrorMessage('خطأ في تسجيل الدخول بواسطة جوجل: ' + error.message)
      }
    } catch (error: any) {
      console.error('Google login error:', error)
      setErrorMessage('حدث خطأ أثناء تسجيل الدخول بواسطة جوجل')
    }
  }

  const handleForgotPassword = async () => {
    const email = prompt('أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور:')
    
    if (!email) return
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      alert('صيغة البريد الإلكتروني غير صحيحة')
      return
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        alert('خطأ: ' + error.message)
      } else {
        alert('تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني')
      }
    } catch (error: any) {
      console.error('Forgot password error:', error)
      alert('حدث خطأ أثناء إرسال رابط إعادة التعيين')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="card-header">
          <div className="logo-container">
            <div className="logo-icon">م</div>
            <div className="logo-text">
              <span className="logo-primary">البارع</span>
              <span className="logo-secondary">محمود الديب</span>
            </div>
          </div>
          <h1 className="page-title">مرحباً بعودتك</h1>
          <p className="page-subtitle">سجل دخولك لتستمر في رحلة التعلم</p>
        </div>

        {successMessage && (
          <div className="success-message-banner">
            <div className="success-icon">✓</div>
            <div className="success-text">{successMessage}</div>
          </div>
        )}

        {errorMessage && (
          <div className="error-message">
            <div className="error-icon">!</div>
            <div className="error-text">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="example@email.com"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">كلمة المرور</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              placeholder="أدخل كلمة المرور"
            />
          </div>

          <div className="login-options">
            <div className="remember-me">
              <input type="checkbox" id="remember" name="remember" />
              <label htmlFor="remember">تذكرني</label>
            </div>
            
            <button 
              type="button"
              className="forgot-password"
              onClick={handleForgotPassword}
            >
              نسيت كلمة المرور؟
            </button>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-login"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                جاري تسجيل الدخول...
              </>
            ) : (
              'تسجيل الدخول'
            )}
          </button>

          <div className="divider">
            <span>أو</span>
          </div>

          <button 
            type="button"
            className="btn btn-google"
            onClick={handleGoogleLogin}
          >
            <div className="google-icon">
              G
            </div>
            <span>تسجيل الدخول بواسطة جوجل</span>
          </button>
        </form>

        <div className="card-footer">
          <p className="footer-text">
            ليس لديك حساب؟{' '}
            <Link href="/register" className="register-link">
              أنشئ حساب جديد
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// المكون الرئيسي مع Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>جاري تحميل صفحة تسجيل الدخول...</p>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  )
}