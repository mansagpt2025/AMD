'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, Sparkles, BookOpen, GraduationCap } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabase-client'
import './login-styles.css'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [particles, setParticles] = useState<Array<{ x: number; y: number; size: number; speed: number }>>([])
  
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  })

  // إنشاء تأثير الجسيمات المتحركة
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 1 + 0.5
    }))
    setParticles(newParticles)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      let email = formData.identifier
      
      // التحقق إذا كان المدخل رقم هاتف
      if (formData.identifier.match(/^01\d{9}$/)) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('email')
          .eq('phone', formData.identifier) // تغيير من student_phone إلى phone
          .single()
        
        if (userError || !userData) {
          throw new Error('لا يوجد حساب مرتبط بهذا الرقم')
        }
        
        email = (userData as any).email
      }
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: formData.password
      })
      
      if (authError) {
        throw authError
      }
      
      if (data?.user) {
        // تأثير النجاح قبل التوجيه
        document.body.classList.add('login-success')
        setTimeout(() => {
          router.push('/dashboard')
        }, 800)
      }
      
    } catch (err: any) {
      console.error('Login error:', err)
      setError('البريد الإلكتروني أو رقم الهاتف أو كلمة المرور غير صحيحة')
      document.body.classList.add('login-error')
      setTimeout(() => document.body.classList.remove('login-error'), 1000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      {/* الجسيمات المتحركة */}
      <div className="particles-container">
        {particles.map((particle, index) => (
          <div
            key={index}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${index * 0.1}s`,
              animationDuration: `${particle.speed * 20}s`
            }}
          />
        ))}
      </div>

      {/* الأيقونات العائمة */}
      <div className="floating-icons">
        <BookOpen className="icon-1" />
        <GraduationCap className="icon-2" />
        <Sparkles className="icon-3" />
      </div>

      <div className="login-card-wrapper">
        <div className="login-card">
          {/* الشعار مع أنيميشن */}
          <div className="logo-section">
            <div className="logo-container">
              <Sparkles className="logo-sparkle" />
            </div>
            <div className="welcome-text">
              <h1 className="logo-text">
                <span className="logo-primary">البارع محمود الديب </span>
              </h1>
            </div>
          </div>
          
          <div className="login-form-container">
            <div className="form-header">
              <h2 className="form-title">تسجيل الدخول</h2>
              <p className="form-subtitle">سجل دخولك للوصول إلى حسابك</p>
            </div>
            
            {error && (
              <div className="error-message" role="alert">
                <div className="error-icon">!</div>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="login-form">
              {/* حقل الإيميل/الهاتف */}
              <div className="input-group">
                <label className="input-label">
                  <Mail className="input-icon" />
                  <span>البريد الإلكتروني أو رقم الهاتف *</span>
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    required
                    className="login-input"
                    placeholder="email@example.com أو 01xxxxxxxxx"
                  />
                  <div className="input-border"></div>
                </div>
              </div>
              
              {/* حقل كلمة المرور */}
              <div className="input-group">
                <div className="password-header">
                  <label className="input-label">
                    <Lock className="input-icon" />
                    <span>كلمة المرور *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('لإعادة تعيين كلمة المرور، تواصل مع الدعم الفني')}
                    className="forgot-password"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="login-input password-input"
                    placeholder="أدخل كلمة المرور"
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
              </div>
              
              {/* زر تسجيل الدخول */}
              <button
                type="submit"
                disabled={loading}
                className={`login-button ${loading ? 'loading' : ''}`}
              >
                <span className="button-text">
                  {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </span>
                <span className="button-glow"></span>
                <span className="button-sparkles">
                  <Sparkles className="sparkle-icon" />
                  <Sparkles className="sparkle-icon" />
                </span>
              </button>
              
              <div className="forgot-password-link">
                <p className="forgot-password-button">
                  <Link href="/forgot-password" className="register-cta">
                    <span className="cta-text">نسيت كلمة المرور؟</span>
                    <span className="cta-arrow">→</span>
                  </Link>
                </p>
              </div>
              
              {/* رابط إنشاء حساب */}
              <div className="register-link">
                <p className="register-text">
                  ليس لديك حساب؟{' '}
                  <Link href="/register" className="register-cta">
                    <span className="cta-text">أنشئ حساب الآن</span>
                    <span className="cta-arrow">→</span>
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