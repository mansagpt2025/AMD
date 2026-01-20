'use client'

import { supabase } from '@/lib/supabase/client'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import './RegisterPage.css'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [errorMessage, setErrorMessage] = useState('')
  const registerContainerRef = useRef<HTMLDivElement>(null)
  const formContainerRef = useRef<HTMLDivElement>(null)
  const successEffectRef = useRef<HTMLDivElement>(null)
  
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setErrorMessage('')
  }

  const nextStep = () => {
    if (step < 3) {
      if (formContainerRef.current) {
        formContainerRef.current.classList.add('slide-out-left')
        
        setTimeout(() => {
          setStep(step + 1)
          formContainerRef.current?.classList.remove('slide-out-left')
          formContainerRef.current?.classList.add('slide-in-right')
          
          setTimeout(() => {
            formContainerRef.current?.classList.remove('slide-in-right')
          }, 300)
        }, 300)
      } else {
        setStep(step + 1)
      }
    }
  }

  const prevStep = () => {
    if (step > 1) {
      if (formContainerRef.current) {
        formContainerRef.current.classList.add('slide-out-right')
        
        setTimeout(() => {
          setStep(step - 1)
          formContainerRef.current?.classList.remove('slide-out-right')
          formContainerRef.current?.classList.add('slide-in-left')
          
          setTimeout(() => {
            formContainerRef.current?.classList.remove('slide-in-left')
          }, 300)
        }, 300)
      } else {
        setStep(step - 1)
      }
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')

    // التحقق من كلمة المرور
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('كلمة المرور غير متطابقة')
      setLoading(false)
      return
    }

    // التحقق من صحة البيانات
    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      console.log('بدء عملية التسجيل...')
      
      // الخطوة 1: إنشاء حساب المصادقة فقط
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.student_phone,
            grade: formData.grade
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

      console.log('تم إنشاء المستخدم:', user.id)
      
      // الخطوة 2: استخدام Service Role Key لإنشاء الملف الشخصي
      try {
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: user.id,
            full_name: formData.full_name,
            grade: formData.grade,
            section: formData.section,
            student_phone: formData.student_phone,
            parent_phone: formData.parent_phone,
            governorate: formData.governorate,
            city: formData.city,
            school: formData.school,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('خطأ في إنشاء الملف الشخصي (Service Role):', profileError)
          // نحاول باستخدام الطريقة العادية إذا فشلت Service Role
          try {
            const { error: normalProfileError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                full_name: formData.full_name,
                grade: formData.grade,
                section: formData.section,
                student_phone: formData.student_phone,
                parent_phone: formData.parent_phone,
                governorate: formData.governorate,
                city: formData.city,
                school: formData.school,
              })
              
            if (normalProfileError) {
              console.error('خطأ في إنشاء الملف الشخصي (Normal):', normalProfileError)
              // نستمر رغم الخطأ
            }
          } catch (normalErr) {
            console.error('استثناء في إنشاء الملف الشخصي:', normalErr)
          }
        }
      } catch (profileErr) {
        console.error('استثناء في إنشاء الملف الشخصي (Service Role):', profileErr)
      }

      // الخطوة 3: إنشاء المحفظة باستخدام Service Role
      try {
        const { error: walletError } = await supabaseAdmin
          .from('wallets')
          .insert({
            user_id: user.id,
            balance: 0,
            created_at: new Date().toISOString()
          })

        if (walletError) {
          console.error('خطأ في إنشاء المحفظة (Service Role):', walletError)
          // نحاول باستخدام الطريقة العادية
          try {
            await supabase
              .from('wallets')
              .insert({
                user_id: user.id,
                balance: 0,
              })
          } catch (walletErr) {
            console.error('استثناء في إنشاء المحفظة:', walletErr)
          }
        }
      } catch (walletErr) {
        console.error('استثناء في إنشاء المحفظة (Service Role):', walletErr)
      }

      // الخطوة 4: تسجيل الدخول تلقائياً
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) {
        console.error('خطأ في تسجيل الدخول:', signInError)
        setErrorMessage('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول يدوياً')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
        setLoading(false)
        return
      }

      // التأكد من وجود جلسة
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // إذا لم تكن هناك جلسة، ننتظر ونحاول مرة أخرى
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })
        
        if (retryError) {
          console.error('فشلت المحاولة الثانية:', retryError)
          router.push('/login')
          setLoading(false)
          return
        }
      }

      // تأثير النجاح والانتقال
      successEffectRef.current?.classList.add('active')
      
      setTimeout(() => {
        router.replace('/dashboard')
      }, 1500)

    } catch (error: any) {
      console.error('خطأ غير متوقع في التسجيل:', error)
      setErrorMessage(`حدث خطأ غير متوقع: ${error.message || 'يرجى المحاولة مرة أخرى'}`)
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    // التحقق من إدخال جميع الحقول المطلوبة
    const requiredFields = ['email', 'password', 'full_name', 'grade', 'student_phone'] as const
    for (const field of requiredFields) {
      if (!formData[field]) {
        setErrorMessage(`يرجى إدخال ${getFieldName(field)}`)
        return false
      }
    }
    
    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('يرجى إدخال بريد إلكتروني صحيح')
      return false
    }
    
    // التحقق من قوة كلمة المرور
    if (formData.password.length < 6) {
      setErrorMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return false
    }
    
    return true
  }

  const getFieldName = (field: string): string => {
    const fieldNames: Record<string, string> = {
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      full_name: 'الاسم الكامل',
      grade: 'الصف الدراسي',
      student_phone: 'رقم هاتف الطالب'
    }
    return fieldNames[field] || field
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

  // JSX
  return (
    <div className="register-container" ref={registerContainerRef}>
      <div className="background-effects">
        <div className="effect-circle circle-1"></div>
        <div className="effect-circle circle-2"></div>
        <div className="effect-circle circle-3"></div>
        <div className="effect-circle circle-4"></div>
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      <div className="success-effect" ref={successEffectRef}>
        <div className="success-icon">✓</div>
        <div className="success-message">تم إنشاء الحساب بنجاح!</div>
      </div>

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

        <div className="step-indicator">
          <div className="step-container">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">الحساب</div>
            </div>
            <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">المعلومات الشخصية</div>
            </div>
            <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">التفاصيل الدراسية</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleRegister} className="register-form">
          <div className="form-container" ref={formContainerRef}>
            {errorMessage && (
              <div className="error-message">
                <div className="error-icon">!</div>
                <div className="error-text">{errorMessage}</div>
              </div>
            )}
            
            {step === 1 && (
              <div className="form-step step-1">
                <h2 className="step-title">معلومات الحساب الأساسية</h2>
                
                <div className="input-group floating-input">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  <label htmlFor="email" className={formData.email ? 'filled' : ''}>البريد الإلكتروني</label>
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
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <label htmlFor="password" className={formData.password ? 'filled' : ''}>كلمة المرور</label>
                  <div className="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <div className="input-underline"></div>
                </div>
                
                <div className="input-group floating-input">
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                  <label htmlFor="confirmPassword" className={formData.confirmPassword ? 'filled' : ''}>تأكيد كلمة المرور</label>
                  <div className="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                    </svg>
                  </div>
                  <div className="input-underline"></div>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="form-step step-2">
                <h2 className="step-title">المعلومات الشخصية</h2>
                
                <div className="input-group floating-input">
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                  />
                  <label htmlFor="full_name" className={formData.full_name ? 'filled' : ''}>الاسم الكامل</label>
                  <div className="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div className="input-underline"></div>
                </div>
                
                <div className="input-row">
                  <div className="input-group floating-input half-width">
                    <input
                      type="tel"
                      id="student_phone"
                      name="student_phone"
                      value={formData.student_phone}
                      onChange={handleInputChange}
                      required
                      pattern="[0-9]{11}"
                    />
                    <label htmlFor="student_phone" className={formData.student_phone ? 'filled' : ''}>رقم هاتف الطالب</label>
                    <div className="input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                    </div>
                    <div className="input-underline"></div>
                  </div>
                  
                  <div className="input-group floating-input half-width">
                    <input
                      type="tel"
                      id="parent_phone"
                      name="parent_phone"
                      value={formData.parent_phone}
                      onChange={handleInputChange}
                      pattern="[0-9]{11}"
                    />
                    <label htmlFor="parent_phone" className={formData.parent_phone ? 'filled' : ''}>رقم هاتف ولي الأمر</label>
                    <div className="input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                    </div>
                    <div className="input-underline"></div>
                  </div>
                </div>
                
                <div className="input-row">
                  <div className="input-group floating-input half-width">
                    <select
                      id="governorate"
                      name="governorate"
                      value={formData.governorate}
                      onChange={handleInputChange}
                      className={formData.governorate ? 'filled' : ''}
                    >
                      <option value="">اختر المحافظة</option>
                      {governorates.map((gov, index) => (
                        <option key={index} value={gov}>{gov}</option>
                      ))}
                    </select>
                    <label htmlFor="governorate" className={formData.governorate ? 'filled' : ''}>المحافظة</label>
                    <div className="input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </div>
                    <div className="input-underline"></div>
                  </div>
                  
                  <div className="input-group floating-input half-width">
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="city" className={formData.city ? 'filled' : ''}>المدينة</label>
                    <div className="input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </div>
                    <div className="input-underline"></div>
                  </div>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="form-step step-3">
                <h2 className="step-title">التفاصيل الدراسية</h2>
                
                <div className="input-row">
                  <div className="input-group floating-input half-width">
                    <select
                      id="grade"
                      name="grade"
                      value={formData.grade}
                      onChange={handleInputChange}
                      className={formData.grade ? 'filled' : ''}
                      required
                    >
                      <option value="">اختر الصف الدراسي</option>
                      {grades.map((grade, index) => (
                        <option key={index} value={grade}>{grade}</option>
                      ))}
                    </select>
                    <label htmlFor="grade" className={formData.grade ? 'filled' : ''}>الصف الدراسي</label>
                    <div className="input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                      </svg>
                    </div>
                    <div className="input-underline"></div>
                  </div>
                  
                  <div className="input-group floating-input half-width">
                    <input
                      type="text"
                      id="section"
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="section" className={formData.section ? 'filled' : ''}>القسم</label>
                    <div className="input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </div>
                    <div className="input-underline"></div>
                  </div>
                </div>
                
                <div className="input-group floating-input">
                  <input
                    type="text"
                    id="school"
                    name="school"
                    value={formData.school}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="school" className={formData.school ? 'filled' : ''}>اسم المدرسة</label>
                  <div className="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
                    </svg>
                  </div>
                  <div className="input-underline"></div>
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

        <div className="card-footer">
          <p className="footer-text">
            لديك حساب بالفعل؟ <a href="/login" className="login-link">تسجيل الدخول</a>
          </p>
        </div>
      </div>
    </div>
  )
}