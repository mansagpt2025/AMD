'use client'

import { supabase } from '@/lib/supabase/client'
import { supabaseAdmin } from '@/lib/supabase/admin'
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
      
      // الخطوة 1: إنشاء حساب المصادقة
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

      console.log('تم إنشاء المستخدم بنجاح:', user.id)
      
      // الخطوة 2: استخدام Service Role Key لإنشاء الملف الشخصي
      if (supabaseAdmin) {
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
            // محاولة باستخدام العميل العادي
            await createProfileWithClient(user.id)
          } else {
            console.log('تم إنشاء الملف الشخصي بنجاح باستخدام Service Role')
          }
        } catch (adminError) {
          console.error('خطأ في Service Role:', adminError)
          await createProfileWithClient(user.id)
        }
      } else {
        await createProfileWithClient(user.id)
      }

      // الخطوة 3: إنشاء المحفظة
      await createWallet(user.id)

      // الخطوة 4: تسجيل الدخول تلقائياً
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) {
        console.log('ملاحظة: لم يتم تسجيل الدخول تلقائياً:', signInError.message)
        setSuccess(true)
        setTimeout(() => {
          router.push('/login?message=تم إنشاء الحساب بنجاح. يرجى تسجيل الدخول')
        }, 3000)
        setLoading(false)
        return
      }

      // إذا نجح تسجيل الدخول، انتقل للداشبورد
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)

    } catch (error: any) {
      console.error('خطأ غير متوقع:', error)
      setErrorMessage(`حدث خطأ غير متوقع: ${error.message || 'يرجى المحاولة مرة أخرى'}`)
      setLoading(false)
    }
  }

  const createProfileWithClient = async (userId: string) => {
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: formData.full_name,
          grade: formData.grade,
          section: formData.section,
          student_phone: formData.student_phone,
          parent_phone: formData.parent_phone,
          governorate: formData.governorate,
          city: formData.city,
          school: formData.school,
        })

      if (profileError) {
        console.error('خطأ في إنشاء الملف الشخصي:', profileError)
        throw profileError
      }
      
      console.log('تم إنشاء الملف الشخصي بنجاح')
    } catch (error) {
      console.error('فشل إنشاء الملف الشخصي:', error)
      // يمكن للمستخدم إكمال الملف الشخصي لاحقاً
    }
  }

  const createWallet = async (userId: string) => {
    try {
      const { error: walletError } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          balance: 0,
        })

      if (walletError) {
        console.error('خطأ في إنشاء المحفظة:', walletError)
        // المحفظة يمكن إنشاؤها لاحقاً
      } else {
        console.log('تم إنشاء المحفظة بنجاح')
      }
    } catch (error) {
      console.error('فشل إنشاء المحفظة:', error)
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

  return (
    <div className="register-container" ref={registerContainerRef}>
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
      <div className="success-effect" ref={successEffectRef} style={{ display: success ? 'flex' : 'none' }}>
        <div className="success-icon">✓</div>
        <div className="success-message">تم إنشاء الحساب بنجاح!</div>
      </div>

      <div className="register-card">
        {/* رأس البطاقة */}
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

        {/* خطوات التسجيل */}
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

        {/* نموذج التسجيل */}
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
                    📧
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
                    🔒
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
                    🔐
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
                    👤
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
                    />
                    <label htmlFor="student_phone" className={formData.student_phone ? 'filled' : ''}>رقم هاتف الطالب</label>
                    <div className="input-icon">
                      📱
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
                    />
                    <label htmlFor="parent_phone" className={formData.parent_phone ? 'filled' : ''}>رقم هاتف ولي الأمر</label>
                    <div className="input-icon">
                      📞
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
                    >
                      <option value="">اختر المحافظة</option>
                      {governorates.map((gov, index) => (
                        <option key={index} value={gov}>{gov}</option>
                      ))}
                    </select>
                    <label htmlFor="governorate" className={formData.governorate ? 'filled' : ''}>المحافظة</label>
                    <div className="input-icon">
                      🗺️
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
                      🏙️
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
                      required
                    >
                      <option value="">اختر الصف الدراسي</option>
                      {grades.map((grade, index) => (
                        <option key={index} value={grade}>{grade}</option>
                      ))}
                    </select>
                    <label htmlFor="grade" className={formData.grade ? 'filled' : ''}>الصف الدراسي</label>
                    <div className="input-icon">
                      📚
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
                      📝
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
                    🏫
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
            لديك حساب بالفعل؟ <Link href="/login" className="login-link">تسجيل الدخول</Link>
          </p>
        </div>
      </div>
    </div>
  )
}