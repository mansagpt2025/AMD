'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import './RegisterPage.css'

export default function RegisterPage() {
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const validateForm = () => {
    if (!phone.trim()) {
      setError('يرجى إدخال رقم الهاتف')
      return false
    }
    
    if (!name.trim()) {
      setError('يرجى إدخال الاسم الكامل')
      return false
    }
    
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return false
    }
    
    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      return false
    }
    
    return true
  }

  const register = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!validateForm()) return
    
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: `${phone}@temp.com`, // نستخدم رقم الهاتف كجزء من الإيميل
        password,
        options: {
          data: {
            full_name: name,
            phone: phone
          }
        }
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        // يمكن إعادة التوجيه بعد فترة أو البقاء في الصفحة لعرض رسالة النجاح
        setTimeout(() => {
          router.replace('/dashboard')
        }, 3000)
      }
    } catch (err) {
      setError('حدث خطأ أثناء إنشاء الحساب')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    setPhone(value)
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // السماح فقط بالأحرف العربية والفراغات
    if (/^[\u0600-\u06FF\s]*$/.test(value) || value === '') {
      setName(value)
    }
  }

  return (
    <main className="register-container">
      <div className="register-card">
        {/* شعار */}
        <div className="logo-container">
          <div className="logo-circle">
            <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* العنوان الرئيسي */}
        <div className="header">
          <h1 className="title">إنشاء حساب جديد</h1>
          <p className="subtitle">
            سجل بياناتك لإنشاء حساب جديد والتمتع بجميع الخدمات
          </p>
        </div>

        {/* رسالة النجاح */}
        {success && (
          <div className="success-message">
            <svg className="success-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18457 2.99721 7.13633 4.39828 5.49707C5.79935 3.85782 7.69279 2.71538 9.79619 2.24015C11.8996 1.76491 14.1003 1.98234 16.07 2.86" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            تم إنشاء الحساب بنجاح! سيتم توجيهك خلال 3 ثوانٍ...
          </div>
        )}

        {/* عرض الخطأ */}
        {error && !success && (
          <div className="error-message">
            <span className="error-icon">!</span>
            {error}
          </div>
        )}

        {/* نموذج إنشاء الحساب */}
        {!success && (
          <form onSubmit={register} className="register-form">
            {/* حقل الاسم الكامل */}
            <div className="input-group">
              <label className="input-label" htmlFor="name">
                الاسم الكامل
              </label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  id="name"
                  type="text"
                  placeholder="أدخل اسمك الكامل"
                  value={name}
                  onChange={handleNameChange}
                  className="input-field"
                  required
                />
              </div>
            </div>

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
                كلمة المرور
              </label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  id="password"
                  type="password"
                  placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  required
                  minLength={6}
                />
              </div>
              <div className="password-hint">
                كلمة المرور يجب أن تكون 6 أحرف على الأقل
              </div>
            </div>

            {/* حقل تأكيد كلمة المرور */}
            <div className="input-group">
              <label className="input-label" htmlFor="confirmPassword">
                تأكيد كلمة المرور
              </label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="أعد إدخال كلمة المرور"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <div className="password-mismatch">
                  ⚠ كلمات المرور غير متطابقة
                </div>
              )}
              {password && confirmPassword && password === confirmPassword && (
                <div className="password-match">
                  ✓ كلمات المرور متطابقة
                </div>
              )}
            </div>

            {/* شروط الاستخدام */}
            <div className="terms-container">
              <label className="terms-checkbox">
                <input type="checkbox" required />
                <span className="checkbox-custom"></span>
                <span className="terms-text">
                  أوافق على <Link href="/terms" className="terms-link">شروط الاستخدام</Link> و <Link href="/privacy" className="terms-link">سياسة الخصوصية</Link>
                </span>
              </label>
            </div>

            {/* زر إنشاء الحساب */}
            <button
              type="submit"
              className={`register-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  جاري إنشاء الحساب...
                </>
              ) : (
                'إنشاء حساب'
              )}
            </button>
          </form>
        )}

        {/* روابط إضافية */}
        <div className="links-container">
          {/* رابط تسجيل الدخول */}
          <div className="login-link-section">
            <p className="login-text">
              لديك حساب بالفعل؟
            </p>
            <Link href="/login" className="login-button">
              <svg className="login-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              تسجيل الدخول
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
      <footer className="register-footer">
        <p>© 2024 جميع الحقوق محفوظة</p>
      </footer>
    </main>
  )
}