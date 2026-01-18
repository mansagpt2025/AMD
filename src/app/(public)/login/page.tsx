'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import './LoginPage.css'

export default function LoginPage() {
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // يمكنك تغيير هذا الجزء إذا كان النظام يستخدم رقم الهاتف بدلاً من الإيميل
      const { error } = await supabase.auth.signInWithPassword({
        email: phone, // استخدام رقم الهاتف كإيميل (افتراضي)
        password,
      })

      if (error) {
        setError('رقم الهاتف أو كلمة المرور غير صحيحة')
      } else {
        router.replace('/dashboard')
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدخول')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    setPhone(value)
  }

  return (
    <main className="login-container">
      <div className="login-card">
        {/* شعار أو أيقونة */}
        <div className="logo-container">
          <div className="logo-circle">
            <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* العنوان الرئيسي */}
        <div className="header">
          <h1 className="title">سجل الدخول بحسابك</h1>
          <p className="subtitle">
            اكتب رقم تليفونك والباسورد إلى استخدامه علناس تعمل الحساب في الأول
          </p>
        </div>

        {/* عرض الخطأ */}
        {error && (
          <div className="error-message">
            <span className="error-icon">!</span>
            {error}
          </div>
        )}

        {/* نموذج تسجيل الدخول */}
        <form onSubmit={login} className="login-form">
          {/* حقل رقم الهاتف */}
          <div className="input-group">
            <label className="input-label" htmlFor="phone">
              رقم التليفون
            </label>
            <div className="input-with-icon">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 16.92V19.92C22 20.47 21.55 20.92 21 20.92H19C10.16 20.92 3 13.76 3 4.92V2.92C3 2.37 3.45 1.92 4 1.92H7C7.55 1.92 8 2.37 8 2.92V8.92C8 9.24 7.85 9.54 7.59 9.71L5.31 11.2C6.41 14.23 9.2 16.99 12.27 18.08L13.79 15.8C13.96 15.54 14.26 15.39 14.58 15.39H20C20.55 15.39 21 15.84 21 16.39V16.92H22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                id="phone"
                type="tel"
                placeholder="مثال: 01234567890"
                value={phone}
                onChange={handlePhoneChange}
                className="input-field"
                required
                dir="ltr"
              />
            </div>
          </div>

          {/* حقل كلمة المرور */}
          <div className="input-group">
            <label className="input-label" htmlFor="password">
              الباسورد
            </label>
            <div className="input-with-icon">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                id="password"
                type="password"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          {/* زر الدخول */}
          <button
            type="submit"
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                جاري الدخول...
              </>
            ) : (
              'ادخل على حسابك'
            )}
          </button>
        </form>

        {/* روابط إضافية */}
        <div className="links-container">
          {/* رابط نسيت كلمة المرور */}
          <div className="forgot-password-link">
            <Link href="/forgot-password" className="link-text">
              <svg className="link-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8H12.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              لو نسيت الباسورد اضغط هنا
            </Link>
          </div>

          {/* رابط إنشاء حساب جديد */}
          <div className="signup-section">
            <p className="signup-text">
              طالب جديد ومعالجتك حساباً:
            </p>
            <Link href="/signup" className="signup-button">
              <svg className="signup-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              اضغط هنا واعلم حساب!
            </Link>
          </div>
        </div>

        {/* رابط العودة للرئيسية */}
        <div className="home-link">
          <Link href="/" className="home-link-text">
            <svg className="home-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 19L9 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            الرئيس
          </Link>
        </div>
      </div>

      {/* تذييل الصفحة */}
      <footer className="login-footer">
        <p>© 2024 جميع الحقوق محفوظة</p>
      </footer>
    </main>
  )
}