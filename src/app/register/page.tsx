'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, User, School, MapPin, Building, Sparkles, BookOpen, GraduationCap, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase-client'
import './register-styles.css'

const governorates = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة',
  'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية',
  'الوادي الجديد', 'السويس', 'اسوان', 'أسيوط', 'بني سويف', 'بورسعيد',
  'دمياط', 'سوهاج', 'جنوب سينا', 'كفر الشيخ', 'مطروح', 'الأقصر', 'قنا',
  'شمال سينا', 'الشرقية'
]

const grades = [
  { id: 'first', name: 'الصف الأول الثانوي' },
  { id: 'second', name: 'الصف الثاني الثانوي' },
  { id: 'third', name: 'الصف الثالث الثانوي' }
]

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState(1)
  const [floatingElements, setFloatingElements] = useState<Array<{ x: number; y: number; size: number; delay: number }>>([])
  
  const [formData, setFormData] = useState({
    full_name: '',
    grade: '',
    section: '',
    email: '',
    phone: '', // تغيير من studentPhone إلى phone
    parent_phone: '', // تغيير من parentPhone إلى parent_phone
    governorate: '',
    city: '',
    school: '',
    password: '',
    confirmPassword: ''
  })

  // إنشاء العناصر العائمة
  useEffect(() => {
    const elements = Array.from({ length: 15 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 30 + 20,
      delay: Math.random() * 5
    }))
    setFloatingElements(elements)
  }, [])

  const sections = {
    first: [{ id: 'general', name: 'عام' }],
    second: [
      { id: 'scientific', name: 'علمي' },
      { id: 'literary', name: 'أدبي' }
    ],
    third: [
      { id: 'science', name: 'علمي علوم' },
      { id: 'math', name: 'علمي رياضة' },
      { id: 'literary', name: 'أدبي' }
    ]
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      return
    }
    
    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    
    setLoading(true)
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone
          }
        }
      })
      
      if (authError) throw authError
      
      if (authData.user) {
        const profileData = {
          id: authData.user.id,
          full_name: formData.full_name,
          grade: formData.grade,
          section: formData.section,
          email: formData.email,
          phone: formData.phone,
          parent_phone: formData.parent_phone,
          governorate: formData.governorate,
          city: formData.city,
          school: formData.school
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)
        
        if (profileError) throw profileError
        
        // إنشاء محفظة للمستخدم الجديد
        const { error: walletError } = await supabase
          .from('wallets')
          .insert({
            user_id: authData.user.id,
            balance: 0
          })
        
        if (walletError) throw walletError
        
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'حدث خطأ أثناء إنشاء الحساب')
    } finally {
      setLoading(false)
    }
  }

  const currentSections = formData.grade ? sections[formData.grade as keyof typeof sections] || [] : []

  return (
    <div className="register-container">
      {/* العناصر العائمة */}
      <div className="floating-shapes">
        {floatingElements.map((el, index) => (
          <div
            key={index}
            className="floating-shape"
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              width: `${el.size}px`,
              height: `${el.size}px`,
              animationDelay: `${el.delay}s`
            }}
          />
        ))}
      </div>

      {/* الأيقونات التعليمية */}
      <div className="education-icons">
        <BookOpen className="edu-icon-1" />
        <GraduationCap className="edu-icon-2" />
        <School className="edu-icon-3" />
      </div>

      <div className="register-card-wrapper">
        <div className="register-card">
          {/* خطوات التسجيل */}
          <div className="steps-container">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="step-wrapper">
                <div className={`step-circle ${step === stepNumber ? 'active' : step > stepNumber ? 'completed' : ''}`}>
                  {step > stepNumber ? (
                    <Sparkles className="step-check" />
                  ) : (
                    <span className="step-number">{stepNumber}</span>
                  )}
                </div>
                <div className="step-line"></div>
              </div>
            ))}
            <div className="step-labels">
              <span>المعلومات الشخصية</span>
              <span>المعلومات الدراسية</span>
              <span>إنشاء الحساب</span>
            </div>
          </div>

          {/* الرسالة الناجحة */}
          {success && (
            <div className="success-overlay">
              <div className="success-content">
                <Sparkles className="success-sparkle" />
                <h3 className="success-title">!تم إنشاء الحساب بنجاح</h3>
                <p className="success-message">يتم توجيهك إلى صفحة تسجيل الدخول...</p>
              </div>
            </div>
          )}

          {/* الشعار */}
          <div className="register-header">
            <div className="register-logo">
              <Sparkles className="logo-sparkle" />
              <h1 className="register-logo-text">
                <span className="logo-primary">محمود</span>
                <span className="logo-secondary">الديب</span>
              </h1>
            </div>
            <p className="register-subtitle">انضم إلى مجتمعنا التعليمي المتميز</p>
          </div>

          <div className="register-form-container">
            <div className="form-header-section">
              <h2 className="register-form-title">إنشاء حساب جديد</h2>
              <p className="register-form-subtitle">املأ النموذج للبدء في رحلتك التعليمية</p>
            </div>
            
            {error && (
              <div className="register-error-message" role="alert">
                <div className="error-icon">!</div>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="register-form">
              {/* الخطوة 1: المعلومات الشخصية */}
              {step === 1 && (
                <div className="form-step step-1">
                  <div className="step-title">
                    <User className="step-icon" />
                    <h3>المعلومات الشخصية</h3>
                  </div>
                  
                  <div className="input-grid">
                    <div className="input-group">
                      <label className="input-label">
                        <span>الاسم الكامل *</span>
                      </label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          required
                          className="register-input"
                          placeholder="أدخل الاسم الكامل"
                        />
                        <div className="input-border"></div>
                      </div>
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">
                        <span>البريد الإلكتروني *</span>
                      </label>
                      <div className="input-wrapper">
                        <Mail className="field-icon" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="register-input with-icon"
                          placeholder="example@email.com"
                        />
                        <div className="input-border"></div>
                      </div>
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">
                        <span>رقم هاتف الطالب *</span>
                      </label>
                      <div className="input-wrapper">
                        <Phone className="field-icon" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className="register-input with-icon"
                          placeholder="01xxxxxxxxx"
                        />
                        <div className="input-border"></div>
                      </div>
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">
                        <span>رقم ولي الأمر *</span>
                      </label>
                      <div className="input-wrapper">
                        <Phone className="field-icon" />
                        <input
                          type="tel"
                          name="parent_phone"
                          value={formData.parent_phone}
                          onChange={handleChange}
                          required
                          className="register-input with-icon"
                          placeholder="01xxxxxxxxx"
                        />
                        <div className="input-border"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="step-buttons">
                    <button
                      type="button"
                      onClick={nextStep}
                      className="next-button"
                    >
                      <span>التالي</span>
                      <span className="button-arrow">→</span>
                    </button>
                  </div>
                </div>
              )}
              
              {/* الخطوة 2: المعلومات الدراسية */}
              {step === 2 && (
                <div className="form-step step-2">
                  <div className="step-title">
                    <School className="step-icon" />
                    <h3>المعلومات الدراسية</h3>
                  </div>
                  
                  <div className="input-grid">
                    <div className="input-group">
                      <label className="input-label">
                        <span>الصف الدراسي *</span>
                      </label>
                      <div className="select-wrapper">
                        <select
                          name="grade"
                          value={formData.grade}
                          onChange={handleChange}
                          required
                          className="register-select"
                        >
                          <option value="">اختر الصف</option>
                          {grades.map(grade => (
                            <option key={grade.id} value={grade.id}>
                              {grade.name}
                            </option>
                          ))}
                        </select>
                        <div className="select-border"></div>
                      </div>
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">
                        <span>الشعبة *</span>
                      </label>
                      <div className="select-wrapper">
                        <select
                          name="section"
                          value={formData.section}
                          onChange={handleChange}
                          required
                          disabled={!formData.grade}
                          className="register-select"
                        >
                          <option value="">اختر الشعبة</option>
                          {currentSections.map(section => (
                            <option key={section.id} value={section.id}>
                              {section.name}
                            </option>
                          ))}
                        </select>
                        <div className="select-border"></div>
                      </div>
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">
                        <span>المحافظة *</span>
                      </label>
                      <div className="select-wrapper">
                        <select
                          name="governorate"
                          value={formData.governorate}
                          onChange={handleChange}
                          required
                          className="register-select"
                        >
                          <option value="">اختر المحافظة</option>
                          {governorates.map(gov => (
                            <option key={gov} value={gov}>
                              {gov}
                            </option>
                          ))}
                        </select>
                        <div className="select-border"></div>
                      </div>
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">
                        <span>المدينة *</span>
                      </label>
                      <div className="input-wrapper">
                        <MapPin className="field-icon" />
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          required
                          className="register-input with-icon"
                          placeholder="أدخل المدينة"
                        />
                        <div className="input-border"></div>
                      </div>
                    </div>
                    
                    <div className="input-group full-width">
                      <label className="input-label">
                        <span>المدرسة *</span>
                      </label>
                      <div className="input-wrapper">
                        <Building className="field-icon" />
                        <input
                          type="text"
                          name="school"
                          value={formData.school}
                          onChange={handleChange}
                          required
                          className="register-input with-icon"
                          placeholder="أدخل اسم المدرسة"
                        />
                        <div className="input-border"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="step-buttons">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="prev-button"
                    >
                      <span className="button-arrow">←</span>
                      <span>السابق</span>
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="next-button"
                    >
                      <span>التالي</span>
                      <span className="button-arrow">→</span>
                    </button>
                  </div>
                </div>
              )}
              
              {/* الخطوة 3: إنشاء الحساب */}
              {step === 3 && (
                <div className="form-step step-3">
                  <div className="step-title">
                    <Sparkles className="step-icon" />
                    <h3>إنشاء الحساب</h3>
                  </div>
                  
                  <div className="input-grid">
                    <div className="input-group">
                      <label className="input-label">
                        <span>كلمة المرور *</span>
                      </label>
                      <div className="input-wrapper">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          className="register-input password-input"
                          placeholder="6 أحرف على الأقل"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="password-toggle"
                        >
                          {showPassword ? <EyeOff className="eye-icon" /> : <Eye className="eye-icon" />}
                        </button>
                        <div className="input-border"></div>
                      </div>
                      <div className="password-strength">
                        <div className={`strength-bar ${formData.password.length >= 6 ? 'strong' : formData.password.length >= 4 ? 'medium' : 'weak'}`}>
                          <div className="strength-fill"></div>
                        </div>
                        <span className="strength-text">
                          {formData.password.length >= 6 ? 'قوية' : formData.password.length >= 4 ? 'متوسطة' : 'ضعيفة'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">
                        <span>تأكيد كلمة المرور *</span>
                      </label>
                      <div className="input-wrapper">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          className="register-input password-input"
                          placeholder="أعد إدخال كلمة المرور"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="password-toggle"
                        >
                          {showConfirmPassword ? <EyeOff className="eye-icon" /> : <Eye className="eye-icon" />}
                        </button>
                        <div className="input-border"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="terms-section">
                    <label className="terms-label">
                      <input type="checkbox" required className="terms-checkbox" />
                      <span className="terms-text">
                        أوافق على <Link href="/terms" className="terms-link">الشروط والأحكام</Link> و <Link href="/privacy" className="terms-link">سياسة الخصوصية</Link>
                      </span>
                    </label>
                  </div>
                  
                  <div className="step-buttons">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="prev-button"
                    >
                      <span className="button-arrow">←</span>
                      <span>السابق</span>
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`register-button ${loading ? 'loading' : ''}`}
                    >
                      <span className="button-text">
                        {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
                      </span>
                      <span className="button-glow"></span>
                      <Sparkles className="button-sparkle" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* رابط تسجيل الدخول */}
              <div className="login-link">
                <p className="login-text">
                  لديك حساب بالفعل؟{' '}
                  <Link href="/login" className="login-cta">
                    <span className="cta-text">سجل الدخول هنا</span>
                    <span className="cta-arrow">↗</span>
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}