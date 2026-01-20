'use client'

import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import './RegisterPage.css'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [success, setSuccess] = useState(false)

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
    const governorate = formData.get('governorate') as string
    const city = formData.get('city') as string
    const school = formData.get('school') as string

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

    if (password.length < 6) {
      setErrorMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      setLoading(false)
      return
    }

    try {
      console.log('بدء عملية إنشاء الحساب...')
      
      // الخطوة 1: إنشاء حساب المصادقة
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            phone: student_phone,
            grade,
          }
        }
      })

      if (authError) {
        console.error('خطأ في المصادقة:', authError)
        setErrorMessage(`خطأ في إنشاء الحساب: ${authError.message}`)
        setLoading(false)
        return
      }

      const user = authData.user
      if (!user) {
        setErrorMessage('لم يتم إنشاء حساب المستخدم')
        setLoading(false)
        return
      }

      console.log('تم إنشاء المستخدم بنجاح:', user.id)
      
      // الانتظار لضمان اكتمال عملية المصادقة
      await new Promise(resolve => setTimeout(resolve, 1000))

      // محاولة إنشاء الملف الشخصي
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name,
            grade,
            section: formData.get('section') as string || '',
            student_phone,
            parent_phone: formData.get('parent_phone') as string || '',
            governorate: governorate || '',
            city: city || '',
            school: school || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.log('ملاحظة: لم يتم إنشاء الملف الشخصي كاملاً:', profileError.message)
          // نستمر رغم ذلك، يمكن للمستخدم إكماله لاحقاً
        }
      } catch (profileErr) {
        console.log('خطأ في إنشاء الملف الشخصي:', profileErr)
      }

      // محاولة إنشاء المحفظة
      try {
        await supabase
          .from('wallets')
          .insert({
            user_id: user.id,
            balance: 0,
            created_at: new Date().toISOString()
          })
      } catch (walletErr) {
        console.log('خطأ في إنشاء المحفظة:', walletErr)
      }

      // تسجيل الدخول تلقائياً
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.log('ملاحظة: لم يتم تسجيل الدخول تلقائياً:', signInError.message)
        setSuccess(true)
        setTimeout(() => {
          router.push('/login?message=تم إنشاء الحساب بنجاح. يرجى تسجيل الدخول')
        }, 2000)
        setLoading(false)
        return
      }

      // إذا نجح تسجيل الدخول، انتقل للداشبورد
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)

    } catch (error: any) {
      console.error('خطأ غير متوقع:', error)
      setErrorMessage(`حدث خطأ غير متوقع: ${error.message || 'يرجى المحاولة مرة أخرى'}`)
      setLoading(false)
    }
  }

  const governorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'المنصورة',
    'بورسعيد', 'السويس', 'دمياط', 'الدقهلية',
    'الشرقية', 'القليوبية', 'كفر الشيخ', 'الغربية',
    'المنوفية', 'البحيرة', 'الوادي الجديد', 'مطروح',
    'شمال سيناء', 'جنوب سيناء', 'البحر الأحمر',
    'الأقصر', 'أسوان', 'سوهاج', 'قنا', 'أسيوط',
    'المنيا', 'بنى سويف', 'الفيوم'
  ]

  const grades = [
    'الصف الأول الابتدائي',
    'الصف الثاني الابتدائي',
    'الصف الثالث الابتدائي',
    'الصف الرابع الابتدائي',
    'الصف الخامس الابتدائي',
    'الصف السادس الابتدائي',
    'الصف الأول الإعدادي',
    'الصف الثاني الإعدادي',
    'الصف الثالث الإعدادي',
    'الصف الأول الثانوي',
    'الصف الثاني الثانوي',
    'الصف الثالث الثانوي'
  ]

  return (
    <div className="register-container">
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

        {success && (
          <div className="success-message-banner">
            <div className="success-icon">✓</div>
            <div className="success-text">
              <strong>تم إنشاء الحساب بنجاح!</strong>
              <p>يتم توجيهك الآن...</p>
            </div>
          </div>
        )}

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
            
            <div className="input-row">
              <div className="input-group half-width">
                <label htmlFor="student_phone">رقم هاتف الطالب *</label>
                <input
                  type="tel"
                  id="student_phone"
                  name="student_phone"
                  required
                  placeholder="01xxxxxxxxx"
                />
              </div>
              
              <div className="input-group half-width">
                <label htmlFor="parent_phone">رقم هاتف ولي الأمر</label>
                <input
                  type="tel"
                  id="parent_phone"
                  name="parent_phone"
                  placeholder="01xxxxxxxxx"
                />
              </div>
            </div>
            
            <div className="input-row">
              <div className="input-group half-width">
                <label htmlFor="governorate">المحافظة</label>
                <select id="governorate" name="governorate">
                  <option value="">اختر المحافظة</option>
                  {governorates.map((gov, index) => (
                    <option key={index} value={gov}>{gov}</option>
                  ))}
                </select>
              </div>
              
              <div className="input-group half-width">
                <label htmlFor="city">المدينة</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  placeholder="اسم المدينة"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>التفاصيل الدراسية</h3>
            
            <div className="input-row">
              <div className="input-group half-width">
                <label htmlFor="grade">الصف الدراسي *</label>
                <select id="grade" name="grade" required>
                  <option value="">اختر الصف الدراسي</option>
                  {grades.map((grade, index) => (
                    <option key={index} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
              
              <div className="input-group half-width">
                <label htmlFor="section">القسم</label>
                <input
                  type="text"
                  id="section"
                  name="section"
                  placeholder="علمي علوم / علمي رياضة / أدبي"
                />
              </div>
            </div>
            
            <div className="input-group">
              <label htmlFor="school">اسم المدرسة</label>
              <input
                type="text"
                id="school"
                name="school"
                placeholder="اسم المدرسة"
              />
            </div>
          </div>

          <div className="form-actions">
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
          </div>
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