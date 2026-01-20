'use client'

import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import './RegisterPage.css'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [errorMessage, setErrorMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const registerContainerRef = useRef<HTMLDivElement>(null)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    grade: '',
    section: '',
    student_phone: '',
    parent_phone: '',
    governorate: '',
    city: '',
    school: ''
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      if (registerContainerRef.current) {
        registerContainerRef.current.classList.add('loaded')
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrorMessage('')
  }

  const nextStep = () => {
    if (step < 3 && validateStep(step)) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const validateStep = (stepNumber: number): boolean => {
    if (stepNumber === 1) {
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        setErrorMessage('يرجى ملء جميع حقول الخطوة الأولى')
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage('كلمة المرور غير متطابقة')
        return false
      }
      if (formData.password.length < 6) {
        setErrorMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
        return false
      }
    }
    return true
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    try {
      console.log('🚀 بدء عملية التسجيل...')

      // 1️⃣ إنشاء المستخدم في Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        console.error('❌ خطأ في المصادقة:', authError)
        setErrorMessage(
          authError.message.includes('User already registered')
            ? 'هذا البريد الإلكتروني مسجل بالفعل'
            : `خطأ في إنشاء الحساب: ${authError.message}`
        )
        setLoading(false)
        return
      }

      const userId = authData.user?.id
      if (!userId) {
        setErrorMessage('فشل إنشاء المستخدم')
        setLoading(false)
        return
      }

      console.log('✅ تم إنشاء المستخدم:', userId)

      // 2️⃣ الانتظار لضمان إنشاء المستخدم في auth.users
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 3️⃣ إنشاء الملف الشخصي
      const profileData = {
        id: userId,
        email: formData.email,
        full_name: formData.full_name,
        grade: formData.grade,
        section: formData.section || null,
        student_phone: formData.student_phone,
        parent_phone: formData.parent_phone || null,
        governorate: formData.governorate || null,
        city: formData.city || null,
        school: formData.school || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: profileError } = await supabase.from('profiles').insert([profileData])
      if (profileError) {
        console.error('❌ خطأ في الملف الشخصي:', profileError)
        setErrorMessage(`حدث خطأ أثناء إنشاء الملف الشخصي: ${profileError.message}`)
        setLoading(false)
        return
      }
      console.log('✅ تم إنشاء الملف الشخصي بنجاح')

      // 4️⃣ إنشاء المحفظة
      const { error: walletError } = await supabase.from('wallets').insert([{
        user_id: userId,
        balance: 0,
        created_at: new Date().toISOString()
      }])
      if (walletError) {
        console.warn('⚠️ خطأ في إنشاء المحفظة:', walletError)
        // لا توقف العملية لأن المحفظة ليست أساسية للتسجيل
      } else {
        console.log('✅ تم إنشاء المحفظة بنجاح')
      }

      // 5️⃣ تسجيل الدخول تلقائي
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (loginError) {
        console.warn('⚠️ فشل تسجيل الدخول تلقائيًا:', loginError)
        setSuccess(true)
        setTimeout(() => {
          router.push(`/login?message=${encodeURIComponent('تم إنشاء الحساب! يرجى تسجيل الدخول يدوياً')}`)
        }, 2000)
      } else {
        console.log('✅ تم تسجيل الدخول بنجاح')
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 1500)
      }

    } catch (error: any) {
      console.error('❌ استثناء غير متوقع:', error)
      setErrorMessage(`حدث خطأ: ${error.message || 'يرجى المحاولة مرة أخرى'}`)
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
    'الصف الأول الثانوي',
    'الصف الثاني الثانوي',
    'الصف الثالث الثانوي'
  ]

  // ✅ واجهة المستخدم عند نجاح التسجيل
  if (success) {
    return (
      <div className="success-page">
        <div className="success-content">
          <div className="success-icon">✓</div>
          <h2>تهانينا! تم إنشاء حسابك بنجاح</h2>
          <p>يتم توجيهك إلى لوحة التحكم...</p>
          <div className="success-loader"></div>
          <p className="success-note">إذا لم يتم توجيهك تلقائياً، <Link href="/dashboard">اضغط هنا</Link></p>
        </div>
      </div>
    )
  }

  // ✅ باقي الكود للخطوات الثلاثة وشاشة التسجيل كما في كودك الأصلي
  return (
    <div className="register-container" ref={registerContainerRef}>
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
          <div className="form-content">
            {step === 1 && (
              <div className="form-step step-1">
                <h3 className="step-title">معلومات الحساب الأساسية</h3>
                
                <div className="form-group">
                  <label htmlFor="email">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="example@email.com"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">كلمة المرور *</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    placeholder="6 أحرف على الأقل"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword">تأكيد كلمة المرور *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    placeholder="أعد إدخال كلمة المرور"
                  />
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="form-step step-2">
                <h3 className="step-title">المعلومات الشخصية</h3>
                
                <div className="form-group">
                  <label htmlFor="full_name">الاسم الكامل *</label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    placeholder="الاسم الثلاثي"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group half">
                    <label htmlFor="student_phone">رقم هاتف الطالب *</label>
                    <input
                      type="tel"
                      id="student_phone"
                      name="student_phone"
                      value={formData.student_phone}
                      onChange={handleInputChange}
                      required
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                  
                  <div className="form-group half">
                    <label htmlFor="parent_phone">رقم هاتف ولي الأمر</label>
                    <input
                      type="tel"
                      id="parent_phone"
                      name="parent_phone"
                      value={formData.parent_phone}
                      onChange={handleInputChange}
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group half">
                    <label htmlFor="governorate">المحافظة</label>
                    <select
                      id="governorate"
                      name="governorate"
                      value={formData.governorate}
                      onChange={handleInputChange}
                    >
                      <option value="">اختر المحافظة</option>
                      {governorates.map((gov, index) => (
                        <option key={index} value={gov}>{gov}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group half">
                    <label htmlFor="city">المدينة</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="اسم المدينة"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="form-step step-3">
                <h3 className="step-title">التفاصيل الدراسية</h3>
                
                <div className="form-row">
                  <div className="form-group half">
                    <label htmlFor="grade">الصف الدراسي *</label>
                    <select
                      id="grade"
                      name="grade"
                      value={formData.grade}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">اختر الصف الدراسي</option>
                      {grades.map((grade, index) => (
                        <option key={index} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group half">
                    <label htmlFor="section">القسم</label>
                    <input
                      type="text"
                      id="section"
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      placeholder="علمي علوم / علمي رياضة / أدبي"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="school">اسم المدرسة</label>
                  <input
                    type="text"
                    id="school"
                    name="school"
                    value={formData.school}
                    onChange={handleInputChange}
                    placeholder="اسم المدرسة"
                  />
                </div>
                
                <div className="form-note">
                  <p>⚠️ <strong>ملاحظة:</strong> سيتم إنشاء محفظة رقمية لك برصيد 0 نقطة يمكنك زيادتها من خلال المشاركة في الأنشطة.</p>
                </div>
              </div>
            )}
          </div>

          <div className="form-actions">
            {step > 1 ? (
              <button type="button" className="btn btn-secondary" onClick={prevStep}>
                <span className="btn-icon">←</span>
                السابق
              </button>
            ) : (
              <div></div>
            )}
            
            {step < 3 ? (
              <button type="button" className="btn btn-primary" onClick={nextStep}>
                التالي
                <span className="btn-icon">→</span>
              </button>
            ) : (
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    جاري إنشاء الحساب...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">✓</span>
                    إنشاء حساب
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}