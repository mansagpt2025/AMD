'use client'

import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import './RegisterPage.css'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
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
    // تأثيرات عند تحميل الصفحة
    const timer = setTimeout(() => {
      document.querySelector('.register-container').classList.add('loaded')
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const nextStep = () => {
    if (step < 3) {
      // إضافة تأثير للمرحلة التالية
      const formContainer = document.querySelector('.form-container')
      formContainer.classList.add('slide-out-left')
      
      setTimeout(() => {
        setStep(step + 1)
        formContainer.classList.remove('slide-out-left')
        formContainer.classList.add('slide-in-right')
        
        setTimeout(() => {
          formContainer.classList.remove('slide-in-right')
        }, 300)
      }, 300)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      // إضافة تأثير للمرحلة السابقة
      const formContainer = document.querySelector('.form-container')
      formContainer.classList.add('slide-out-right')
      
      setTimeout(() => {
        setStep(step - 1)
        formContainer.classList.remove('slide-out-right')
        formContainer.classList.add('slide-in-left')
        
        setTimeout(() => {
          formContainer.classList.remove('slide-in-left')
        }, 300)
      }, 300)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)

    // التحقق من كلمة المرور
    if (formData.password !== formData.confirmPassword) {
      alert('كلمة المرور غير متطابقة')
      setLoading(false)
      return
    }

    // التحقق من صحة البيانات
    if (!validateForm()) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    const user = data.user
    if (!user) {
      setLoading(false)
      return
    }

    // إنشاء profile
    const { error: profileError } = await supabase.from('profiles').insert({
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

    if (profileError) {
      alert('حدث خطأ في إنشاء الملف الشخصي: ' + profileError.message)
      setLoading(false)
      return
    }

    // إنشاء wallet
    const { error: walletError } = await supabase.from('wallets').insert({
      user_id: user.id,
      balance: 0,
    })

    if (walletError) {
      alert('حدث خطأ في إنشاء المحفظة: ' + walletError.message)
      setLoading(false)
      return
    }

    // تأثير النجاح قبل الانتقال
    const successEffect = document.querySelector('.success-effect')
    successEffect.classList.add('active')
    
    setTimeout(() => {
      router.replace('/dashboard')
    }, 1500)
  }

  const validateForm = () => {
    // التحقق من إدخال جميع الحقول المطلوبة
    const requiredFields = ['email', 'password', 'full_name', 'grade', 'student_phone']
    for (const field of requiredFields) {
      if (!formData[field]) {
        alert(`يرجى إدخال ${getFieldName(field)}`)
        return false
      }
    }
    
    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert('يرجى إدخال بريد إلكتروني صحيح')
      return false
    }
    
    // التحقق من قوة كلمة المرور
    if (formData.password.length < 6) {
      alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return false
    }
    
    return true
  }

  const getFieldName = (field) => {
    const fieldNames = {
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      full_name: 'الاسم الكامل',
      grade: 'الصف الدراسي',
      student_phone: 'رقم هاتف الطالب'
    }
    return fieldNames[field] || field
  }

  return (
    <div className="register-container">
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
      <div className="success-effect">
        <div className="success-icon">✓</div>
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
          <div className="form-container">
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
                
                <div className="password-strength">
                  <div className="strength-label">قوة كلمة المرور</div>
                  <div className="strength-meter">
                    <div 
                      className={`strength-bar ${formData.password.length >= 6 ? 'active' : ''}`}
                      style={{'--strength': formData.password.length >= 6 ? '1' : '0'}}
                    ></div>
                    <div 
                      className={`strength-bar ${formData.password.length >= 8 ? 'active' : ''}`}
                      style={{'--strength': formData.password.length >= 8 ? '1' : '0'}}
                    ></div>
                    <div 
                      className={`strength-bar ${/[A-Z]/.test(formData.password) ? 'active' : ''}`}
                      style={{'--strength': /[A-Z]/.test(formData.password) ? '1' : '0'}}
                    ></div>
                    <div 
                      className={`strength-bar ${/[0-9]/.test(formData.password) ? 'active' : ''}`}
                      style={{'--strength': /[0-9]/.test(formData.password) ? '1' : '0'}}
                    ></div>
                  </div>
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
                      <option value=""></option>
                      <option value="القاهرة">القاهرة</option>
                      <option value="الجيزة">الجيزة</option>
                      <option value="الإسكندرية">الإسكندرية</option>
                      <option value="المنصورة">المنصورة</option>
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
                      <option value=""></option>
                      <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                      <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                      <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
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
                
                <div className="terms-container">
                  <label className="checkbox-container">
                    <input type="checkbox" required />
                    <span className="checkmark"></span>
                    <span className="checkbox-label">أوافق على <a href="#" className="terms-link">شروط الاستخدام</a> و <a href="#" className="terms-link">سياسة الخصوصية</a></span>
                  </label>
                </div>
                
                <div className="wallet-preview">
                  <div className="wallet-icon">💼</div>
                  <div className="wallet-info">
                    <div className="wallet-title">سيتم إنشاء محفظة رقمية لك</div>
                    <div className="wallet-balance">الرصيد الأولي: <span className="balance-amount">0</span> نقطة</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* أزرار التنقل */}
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

        {/* تذييل البطاقة */}
        <div className="card-footer">
          <p className="footer-text">
            لديك حساب بالفعل؟ <a href="/login" className="login-link">تسجيل الدخول</a>
          </p>
        </div>
      </div>
    </div>
  )
}