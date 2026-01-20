'use client'

import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import './LoginPage.css'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const loginContainerRef = useRef<HTMLDivElement>(null)
  const successEffectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // تأثيرات عند تحميل الصفحة
    const timer = setTimeout(() => {
      if (loginContainerRef.current) {
        loginContainerRef.current.classList.add('loaded')
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const form = e.target as HTMLFormElement
    const email = form.email.value
    const password = form.password.value

    if (!email || !password) {
      alert('يرجى إدخال البريد الإلكتروني وكلمة المرور')
      setLoading(false)
      return
    }

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        alert('خطأ في تسجيل الدخول: ' + error.message)
        setLoading(false)
        return
      }

      // تأثير النجاح قبل الانتقال
      successEffectRef.current?.classList.add('active')
      
      setTimeout(() => {
        router.replace('/dashboard')
      }, 1500)

    } catch (error: any) {
      console.error('Login error:', error)
      alert('حدث خطأ غير متوقع أثناء تسجيل الدخول')
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

      if (error) throw error
    } catch (error: any) {
      console.error('Google login error:', error)
      alert('حدث خطأ أثناء تسجيل الدخول بواسطة جوجل')
    }
  }

  const handleForgotPassword = async () => {
    const email = prompt('أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور:')
    
    if (!email) return
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
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
    <div className="login-container" ref={loginContainerRef}>
      {/* تأثيرات الخلفية المتحركة */}
      <div className="background-effects">
        <div className="effect-circle circle-1"></div>
        <div className="effect-circle circle-2"></div>
        <div className="effect-circle circle-3"></div>
        <div className="effect-circle circle-4"></div>
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      {/* تأثير النجاح */}
      <div className="success-effect" ref={successEffectRef}>
        <div className="success-icon">✓</div>
        <div className="success-message">تم تسجيل الدخول بنجاح!</div>
      </div>

      <div className="login-card">
        {/* رأس البطاقة */}
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

        {/* نموذج تسجيل الدخول */}
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-container">
            
            <div className="input-group floating-input">
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder=" "
              />
              <label htmlFor="email">البريد الإلكتروني</label>
              <div className="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div className="input-underline"></div>
            </div>
            
            <div className="input-group floating-input">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                required
                placeholder=" "
              />
              <label htmlFor="password">كلمة المرور</label>
              <div className="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
              <div className="input-underline"></div>
            </div>

            {/* خيارات إضافية */}
            <div className="login-options">
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkmark"></span>
                <span className="checkbox-label">تذكرني</span>
              </label>
              
              <button 
                type="button"
                className="forgot-password"
                onClick={handleForgotPassword}
              >
                نسيت كلمة المرور؟
              </button>
            </div>

            {/* زر تسجيل الدخول */}
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
                <>
                  <span className="btn-icon">→</span>
                  تسجيل الدخول
                </>
              )}
            </button>

            {/* فاصل أو */}
            <div className="divider">
              <span className="divider-line"></span>
              <span className="divider-text">أو</span>
              <span className="divider-line"></span>
            </div>

            {/* تسجيل الدخول بواسطة جوجل */}
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

            {/* ميزات المنصة */}
            <div className="platform-features">
              <div className="feature">
                <div className="feature-icon">📚</div>
                <div className="feature-text">الوصول إلى جميع الدروس</div>
              </div>
              <div className="feature">
                <div className="feature-icon">🎯</div>
                <div className="feature-text">اختبارات وتقييمات</div>
              </div>
              <div className="feature">
                <div className="feature-icon">💼</div>
                <div className="feature-text">محفظة نقاط خاصة</div>
              </div>
            </div>
          </div>
        </form>

        {/* تذييل البطاقة */}
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