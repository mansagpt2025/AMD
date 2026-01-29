'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Mail, Phone, MessageCircle, Sparkles, BookOpen, GraduationCap, ArrowRight } from 'lucide-react'
import './forgot-password-styles.css'

export default function ForgotPasswordPage() {
  const [isHovering, setIsHovering] = useState(false)
  const [floatingElements, setFloatingElements] = useState<Array<{ x: number; y: number; size: number; delay: number }>>([])
  
  const phoneNumber = '201100196131'
  const whatsappUrl = `https://wa.me/${phoneNumber}?text= مرحبًا فريق الدعم : أريد استعدة كلمة مرور حسابي على منصة البارع محمود الديب `

  // إنشاء العناصر العائمة
  useEffect(() => {
    const elements = Array.from({ length: 12 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 40 + 20,
      delay: Math.random() * 5
    }))
    setFloatingElements(elements)
  }, [])

  const handleWhatsAppClick = () => {
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="forgot-password-container">
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
        <MessageCircle className="edu-icon-3" />
      </div>

      <div className="forgot-card-wrapper">
        <div className="forgot-card">
          {/* الشعار */}
          <div className="forgot-header">
            <div className="forgot-logo">
              <h1 className="forgot-logo-text">
                <span className="logo-primary">البارع محمود الديب</span>
              </h1>
            </div>
            <p className="forgot-subtitle">أفضل منصة في اللغة العربية للثانوية العامة</p>
          </div>

          <div className="forgot-content">
            <div className="forgot-icon-container">
              <div className="icon-circle">
                <Mail className="main-icon" />
                <div className="icon-glow"></div>
              </div>
            </div>

            <h2 className="forgot-title">نسيت كلمة المرور؟</h2>
            
            <div className="support-message">
              <p className="message-text">
                <span className="highlight">لا تقلق</span> نحن هنا لمساعدتك في استعادة حسابك.
              </p>
              <p className="message-subtext">
                للاستفسار عن كلمة المرور أو إعادة تعيينها، يرجى التواصل مباشرة مع الدعم الفني عبر واتساب
              </p>
            </div>

            {/* معلومات التواصل */}
            <div className="contact-info">
              <div className="contact-item">
                <div className="contact-icon-wrapper">
                  <MessageCircle className="contact-icon" />
                </div>
                <div className="contact-details">
                  <h3 className="contact-title">التواصل عبر واتساب</h3>
                  <p className="contact-description">
                    فريق الدعم الفني متاح على مدار الساعة للإجابة على استفساراتك
                  </p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon-wrapper">
                  <Phone className="contact-icon" />
                </div>
                <div className="contact-details">
                  <h3 className="contact-title">رقم الدعم الفني</h3>
                  <a 
                    href={`tel:${phoneNumber}`}
                    className="phone-number"
                  >131 196 00 011</a>
                  <p className="contact-description">
                    التواصل واتساب فقط
                  </p>
                </div>
              </div>
            </div>

            {/* زر التواصل مع الدعم الفني */}
            <button
              onClick={handleWhatsAppClick}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              className={`whatsapp-button ${isHovering ? 'hovering' : ''}`}
            >
              <div className="button-content">
                <div className="whatsapp-icon-container">
                  <div className="icon-pulse"></div>
                </div>
                <div className="button-texts">
                  <span className="button-main-text">تواصل مع الدعم الفني</span>
                  <span className="button-subtext">اضغط للدردشة مباشرة على واتساب</span>
                </div>
              </div>
              <div className="button-glow"></div>
            </button>

            {/* رسالة تأكيد */}
            <div className="confirmation-message">
              <div className="confirmation-icon">✓</div>
              <p className="confirmation-text">
                سيقوم فريق الدعم الفني بالرد عليك في أسرع وقت ممكن
              </p>
            </div>

            <div className="confirmation-message">
              <div className="confirmation-icon">✓</div>
              <p className="confirmation-text">
نعتذر على التأخير نظرًا لضغط الرسائل              </p>
            </div>

            {/* روابط أخرى */}
            <div className="additional-links">
              <Link href="/login" className="back-link">
                <span className="link-arrow">←</span>
                <span>العودة لتسجيل الدخول</span>
                <span className="link-arrow">←</span>
              </Link>
              
              <Link href="/register" className="register-link">
                <span className="link-arrow">←</span>
                <span>إنشاء حساب جديد</span>
                <span className="link-arrow">→</span>
              </Link>
            </div>

            {/* ملاحظة */}
            <div className="note-section">
              <div className="note-icon">!</div>
              <p className="note-text">
                <strong>ملاحظة :</strong> يرجى تقديم رقم الهاتف أو البريد الإلكتروني المسجل عند التواصل مع الدعم الفني
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}