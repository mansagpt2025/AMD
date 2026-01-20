'use client'

import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import './LoginPage.css'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // قراءة الرسالة من URL عند تحميل الصفحة
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const message = params.get('message')
      if (message) {
        setSuccessMessage(decodeURIComponent(message))
      }
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
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