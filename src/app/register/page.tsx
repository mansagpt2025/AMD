'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, User, School, MapPin, Building, Sparkles, BookOpen, GraduationCap, Phone } from 'lucide-react'
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
    phone: '',
    parent_phone: '',
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
    
    // التحقق من البيانات
    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      return
    }
    
    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    
    if (!formData.full_name || !formData.email || !formData.phone) {
      setError('الاسم الكامل والبريد الإلكتروني ورقم الهاتف مطلوبة')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          parent_phone: formData.parent_phone,
          governorate: formData.governorate,
          city: formData.city,
          school: formData.school,
          grade: formData.grade,
          section: formData.section
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'فشل إنشاء الحساب')
      }

      setSuccess(true)
      
      // الانتظار قليلاً ثم التوجيه إلى صفحة تسجيل الدخول
      setTimeout(() => {
        router.push('/login')
      }, 3000)
      
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
                <div className="success-animation">
                  <Sparkles className="success-sparkle" />
                  <div className="checkmark">✓</div>
                </div>
                <h3 className="success-title">!تم إنشاء الحساب بنجاح</h3>
                <p className="success-message">سيتم توجيهك إلى صفحة تسجيل الدخول خلال 3 ثواني...</p>
                <div className="success-timer">
                  <div className="timer-bar"></div>
                </div>
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
                <div className="error-content">
                  <p className="error-title">خطأ في التسجيل</p>
                  <p className="error-detail">{error}</p>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="error-close"
                >
                  ✕
                </button>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="register-form">
              {/* الخطوة 1: المعلومات الشخصية */}
              {step === 1 && (
                <div className="form-step step-1">
                  <div className="step-title">
                    <User className="step-icon" />
                    <h3>المعلومات الشخصية</h3>
                    <p className="step-description">أدخل معلوماتك الشخصية الأساسية</p>
                  </div>
                  
                  <div className="input-grid">
                    <div className="input-group">
                      <label className="input-label">
                        <span className="label-text">الاسم الكامل *</span>
                        <span className="label-hint">كما سيظهر في شهادة الإتمام</span>
                      </label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          required
                          className="register-input"
                          placeholder="أحمد محمد علي"
                        />
                        <div className="input-border"></div>
                      </div>
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">
                        <span className="label-text">البريد الإلكتروني *</span>
                        <span className="label-hint">لن نشاركه مع أي جهة خارجية</span>
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
                        <span className="label-text">رقم هاتف الطالب *</span>
                        <span className="label-hint">يبدأ بـ 01</span>
                      </label>
                      <div className="input-wrapper">
                        <Phone className="field-icon" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          pattern="01[0-9]{9}"
                          className="register-input with-icon"
                          placeholder="01123456789"
                        />
                        <div className="input-border"></div>
                      </div>
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">
                        <span className="label-text">رقم ولي الأمر *</span>
                        <span className="label-hint">للاتصال في حالة الطوارئ</span>
                      </label>
                      <div className="input-wrapper">
                        <Phone className="field-icon" />
                        <input
                          type="tel"
                          name="parent_phone"
                          value={formData.parent_phone}
                          onChange={handleChange}
                          required
                          pattern="01[0-9]{9}"
                          className="register-input with-icon"
                          placeholder="01123456789"
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
                      disabled={!formData.full_name || !formData.email || !formData.phone || !formData.parent_phone}
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
                    <p className="step-description">أدخل معلوماتك الدراسية الحالية</p>
                  </div>
                  
                  <div className="input-grid">
                    <div className="input-group">
                      <label className="input-label">
                        <span className="label-text">الصف الدراسي *</span>
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
                        <div className="select-arrow">▼</div>
                      </div>
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">
                        <span className="label-text">الشعبة *</span>
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
                        <div className="select-arrow">▼</div>
                      </div>
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">
                        <span className="label-text">المحافظة *</span>
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
                        <div className="select-arrow">▼</div>
                      </div>
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label">
                        <span className="label-text">المدينة *</span>
                        <span className="label-hint">المدينة التابع لها مدرستك</span>
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
                        <span className="label-text">المدرسة *</span>
                        <span className="label-hint">الاسم الرسمي للمدرسة</span>
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
                      disabled={!formData.grade || !formData.section || !formData.governorate || !formData.city || !formData.school}
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
                    <p className="step-description">اختر كلمة مرور قوية لحسابك</p>
                  </div>
                  
                  <div className="input-grid">
                    <div className="input-group">
                      <label className="input-label">
                        <span className="label-text">كلمة المرور *</span>
                        <span className="label-hint">6 أحرف على الأقل</span>
                      </label>
                      <div className="input-wrapper">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          minLength={6}
                          className="register-input password-input"
                          placeholder="أدخل كلمة مرور قوية"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="password-toggle"
                          aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
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
                        <span className="label-text">تأكيد كلمة المرور *</span>
                        <span className="label-hint">أعد إدخال كلمة المرور للتأكيد</span>
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
                          aria-label={showConfirmPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                        >
                          {showConfirmPassword ? <EyeOff className="eye-icon" /> : <Eye className="eye-icon" />}
                        </button>
                        <div className="input-border"></div>
                      </div>
                      {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <div className="password-match-error">
                          ✗ كلمات المرور غير متطابقة
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="terms-section">
                    <label className="terms-label">
                      <input 
                        type="checkbox" 
                        required 
                        className="terms-checkbox" 
                        id="terms-agreement"
                      />
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
                      disabled={loading || formData.password !== formData.confirmPassword}
                      className={`register-button ${loading ? 'loading' : ''}`}
                    >
                      {loading ? (
                        <>
                          <span className="loading-spinner"></span>
                          <span className="button-text">جاري إنشاء الحساب...</span>
                        </>
                      ) : (
                        <>
                          <span className="button-text">إنشاء حساب</span>
                          <Sparkles className="button-sparkle" />
                        </>
                      )}
                      <span className="button-glow"></span>
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