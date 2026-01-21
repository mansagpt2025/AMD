'use client'

import { useState, useEffect } from 'react'
import { 
  Phone, Mail, MessageCircle, Instagram, Facebook, Youtube, 
  MapPin, Clock, Send, Users, Sparkles, Award, Shield, Zap,
  BookOpen, GraduationCap, Star, ChevronLeft, ChevronRight,
  CheckCircle, Globe, Heart, ThumbsUp, Target, Brain
} from 'lucide-react'
import Link from 'next/link'
import './contact-styles.css'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('تم إرسال رسالتك بنجاح! سنتواصل معك قريبًا.')
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="contact-container">
      {/* شريط التنقل العلوي */}
      <nav className="navbar">
        <div className="nav-container">
          <Link href="/" className="logo">
            <div className="logo-icon">
              <GraduationCap />
            </div>
            <span className="logo-text">منصة محمود الديب</span>
          </Link>
          
          <div className="nav-links">
            <Link href="/" className="nav-link">الرئيسية</Link>
            <Link href="/courses" className="nav-link">الكورسات</Link>
            <Link href="/about" className="nav-link">عن المنصة</Link>
            <Link href="/contact" className="nav-link active">تواصل معنا</Link>
          </div>
          
          <button className="try-free-btn">جرب مجاناً</button>
        </div>
      </nav>

      {/* الهيدر الرئيسي */}
      <header className="header">
        <div className="header-content">
          <div className="icon-container float-animation">
            <MessageCircle />
          </div>
          
          <h1 className="fade-in">تواصل معنا</h1>
          <p className="header-subtitle slide-in-up">نحن هنا لنساعدك في رحلتك التعليمية</p>
          <p className="header-description slide-in-up">
            نجاحك هو هدفنا الأول والأخير، فريقنا المتخصص جاهز للإجابة على جميع استفساراتك
          </p>
          
          <div className="features-container">
            <div className="feature-tag pulse-animation">
              <Shield />
              <span>دعم فني 24/7</span>
            </div>
            <div className="feature-tag pulse-animation" style={{ animationDelay: '0.2s' }}>
              <Users />
              <span>فريق من الخبراء المتخصصين</span>
            </div>
            <div className="feature-tag pulse-animation" style={{ animationDelay: '0.4s' }}>
              <Award />
              <span>خبرة 15 عاماً في التعليم</span>
            </div>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="main-content">
        {/* إحصائيات سريعة */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card slide-in-up">
              <div className="stat-icon gradient-blue">
                <Award />
              </div>
              <div className="stat-value">15+</div>
              <div className="stat-label">سنوات الخبرة</div>
            </div>
            
            <div className="stat-card slide-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="stat-icon gradient-amber">
                <GraduationCap />
              </div>
              <div className="stat-value">10K+</div>
              <div className="stat-label">طالب متفوق</div>
            </div>
            
            <div className="stat-card slide-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="stat-icon gradient-green">
                <Heart />
              </div>
              <div className="stat-value">98%</div>
              <div className="stat-label">رضا العملاء</div>
            </div>
            
            <div className="stat-card slide-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="stat-icon gradient-purple">
                <Shield />
              </div>
              <div className="stat-value">24/7</div>
              <div className="stat-label">دعم فني</div>
            </div>
          </div>
        </section>

        {/* المحتوى الرئيسي */}
        <div className="content-grid">
          {/* الجزء الأيسر */}
          <div>
            {/* بطاقة المدرس */}
            <div className="teacher-card fade-in">
              <div className="teacher-content">
                <div className="teacher-avatar">
                  <div className="avatar-image float-animation">
                    <span className="avatar-text">م.د</span>
                  </div>
                  <div className="badge">
                    <Award />
                  </div>
                </div>
                
                <div className="teacher-info">
                  <h1 className="teacher-name">محمود الديب</h1>
                  <p className="teacher-title">مدرس الثانوية العامة - خبرة 15 عاماً</p>
                  
                  <div className="badges-container">
                    <div className="badge-item">
                      <CheckCircle />
                      <span>مدرس معتمد من وزارة التربية والتعليم</span>
                    </div>
                  </div>
                  
                  <div className="message-card">
                    <div className="message-content">
                      <div className="message-icon">
                        <MessageCircle />
                      </div>
                      <div className="message-text">
                        <h3>رسالة من المدرس</h3>
                        <p>
                          أهلاً بكم في منصتنا التعليمية، حيث نسعى لتقديم أفضل الخدمات التعليمية 
                          لطلاب الثانوية العامة في جميع أنحاء مصر. نجاحكم هو هدفنا الأول والأخير، 
                          ونعمل جاهدين لتوفير كل ما تحتاجونه لتحقيق التفوق الدراسي.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* وسائل التواصل الاجتماعي */}
            <div className="social-card fade-in">
              <div className="social-header">
                <div className="social-header-icon">
                  <Globe />
                </div>
                <h3>تواصل معنا على وسائل التواصل</h3>
              </div>
              
              <div className="social-grid">
                <a href="https://wa.me/201012345678" target="_blank" rel="noopener noreferrer" className="social-button" style={{ background: '#25D366' }}>
                  <MessageCircle />
                  <span>واتساب</span>
                </a>
                
                <a href="https://instagram.com/mahmoudeeldeeb" target="_blank" rel="noopener noreferrer" className="social-button" style={{ background: 'linear-gradient(135deg, #833AB4, #E1306C)' }}>
                  <Instagram />
                  <span>انستجرام</span>
                </a>
                
                <a href="https://facebook.com/mahmoudeeldeeb" target="_blank" rel="noopener noreferrer" className="social-button" style={{ background: '#1877F2' }}>
                  <Facebook />
                  <span>فيسبوك</span>
                </a>
                
                <a href="https://youtube.com/@mahmoudeeldeeb" target="_blank" rel="noopener noreferrer" className="social-button" style={{ background: '#FF0000' }}>
                  <Youtube />
                  <span>يوتيوب</span>
                </a>
                
                <a href="https://tiktok.com/@mahmoudeeldeeb" target="_blank" rel="noopener noreferrer" className="social-button" style={{ background: '#000000' }}>
                  <Sparkles />
                  <span>تيك توك</span>
                </a>
              </div>
              
              <p className="social-description">
                تابعنا للحصول على آخر التحديثات، الدروس المجانية، والنصائح التعليمية
              </p>
            </div>
          </div>

          {/* الجزء الأيمن - بطاقات الاتصال */}
          <div className="contact-cards">
            {/* بطاقة الدعم الفني */}
            <div className="contact-card fade-in">
              <div className="contact-header">
                <div className="contact-icon bg-blue-100">
                  <Shield className="text-blue-600" />
                </div>
                <div className="contact-header-text">
                  <h4>الدعم الفني</h4>
                  <p>متاح 24/7 لحل المشاكل الفنية</p>
                </div>
              </div>
              
              <div className="contact-items">
                <div className="contact-item">
                  <div className="contact-item-content">
                    <div className="item-icon bg-green-100">
                      <MessageCircle className="text-green-600" />
                    </div>
                    <div className="item-text">
                      <h5>واتساب فقط</h5>
                      <p>01012345678</p>
                    </div>
                  </div>
                </div>
                
                <div className="contact-item">
                  <div className="contact-item-content">
                    <div className="item-icon bg-blue-100">
                      <Mail className="text-blue-600" />
                    </div>
                    <div className="item-text">
                      <h5>البريد الإلكتروني</h5>
                      <p>support@mahmoudeeldeeb.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* بطاقة الدعم العلمي */}
            <div className="contact-card fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="contact-header">
                <div className="contact-icon bg-amber-100">
                  <BookOpen className="text-amber-600" />
                </div>
                <div className="contact-header-text">
                  <h4>الدعم العلمي</h4>
                  <p>للاستفسارات العلمية والمنهجية</p>
                </div>
              </div>
              
              <div className="contact-items">
                <div className="contact-item">
                  <div className="contact-item-content">
                    <div className="item-icon bg-amber-100">
                      <Phone className="text-amber-600" />
                    </div>
                    <div className="item-text">
                      <h5>هاتف الدعم العلمي</h5>
                      <p>01198765432</p>
                    </div>
                  </div>
                </div>
                
                <div className="contact-item">
                  <div className="contact-item-content">
                    <div className="item-icon bg-amber-100">
                      <Mail className="text-amber-600" />
                    </div>
                    <div className="item-text">
                      <h5>البريد الإلكتروني</h5>
                      <p>academic@mahmoudeeldeeb.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* بطاقة الاستفسارات العامة */}
            <div className="contact-card fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="contact-header">
                <div className="contact-icon bg-green-100">
                  <Users className="text-green-600" />
                </div>
                <div className="contact-header-text">
                  <h4>الاستفسارات العامة</h4>
                  <p>للتسجيلات والاستفسارات العامة</p>
                </div>
              </div>
              
              <div className="contact-items">
                <div className="contact-item">
                  <div className="contact-item-content">
                    <div className="item-icon bg-green-100">
                      <Phone className="text-green-600" />
                    </div>
                    <div className="item-text">
                      <h5>رقم الهاتف</h5>
                      <p>01234567890</p>
                    </div>
                  </div>
                </div>
                
                <div className="contact-item">
                  <div className="contact-item-content">
                    <div className="item-icon bg-green-100">
                      <Mail className="text-green-600" />
                    </div>
                    <div className="item-text">
                      <h5>البريد الإلكتروني</h5>
                      <p>info@mahmoudeeldeeb.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* نموذج التواصل */}
        <section className="form-section gradient-shift">
          <div className="form-container">
            <div className="form-header">
              <h3>أرسل لنا رسالتك</h3>
              <p>نحن هنا للاستماع إليك ومساعدتك في رحلتك التعليمية</p>
            </div>
            
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="الاسم الكامل"
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="البريد الإلكتروني"
                    className="form-input"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="رقم الهاتف"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="">اختر نوع الاستفسار</option>
                    <option value="technical">دعم فني</option>
                    <option value="academic">استفسار علمي</option>
                    <option value="enrollment">تسجيل في كورس</option>
                    <option value="other">استفسار آخر</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="اكتب رسالتك هنا..."
                  rows={6}
                  className="form-textarea"
                  required
                ></textarea>
              </div>
              
              <button type="submit" className="submit-button">
                <Send />
                إرسال الرسالة
              </button>
            </form>
          </div>
        </section>

        {/* مميزات المنصة */}
        <section className="features-section">
          <div className="features-header">
            <h3>لماذا تختار منصتنا؟</h3>
            <p>نقدم لك تجربة تعليمية فريدة تجمع بين الجودة والتميز</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card slide-in-up">
              <div className="feature-icon">
                <Shield />
              </div>
              <h4>دعم فني 24/7</h4>
              <p>متاح على مدار الساعة</p>
            </div>
            
            <div className="feature-card slide-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="feature-icon">
                <Zap />
              </div>
              <h4>رد فوري</h4>
              <p>خلال 15 دقيقة</p>
            </div>
            
            <div className="feature-card slide-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="feature-icon">
                <GraduationCap />
              </div>
              <h4>خبراء متخصصون</h4>
              <p>فريق من المدرسين المحترفين</p>
            </div>
            
            <div className="feature-card slide-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="feature-icon">
                <Star />
              </div>
              <h4>جودة عالية</h4>
              <p>أعلى معايير التعليم</p>
            </div>
          </div>
        </section>

        {/* معلومات إضافية */}
        <section className="info-section">
          <div className="info-card fade-in">
            <div className="info-content">
              <div className="info-icon bg-blue-100">
                <MapPin className="text-blue-600" />
              </div>
              <div className="info-text">
                <h4>المقر الرئيسي</h4>
                <p>القاهرة، مصر</p>
              </div>
            </div>
          </div>
          
          <div className="info-card fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="info-content">
              <div className="info-icon bg-amber-100">
                <Clock className="text-amber-600" />
              </div>
              <div className="info-text">
                <h4>أوقات العمل</h4>
                <p>9 صباحاً - 10 مساءً</p>
              </div>
            </div>
          </div>
          
          <div className="info-card fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="info-content">
              <div className="info-icon bg-green-100">
                <Globe className="text-green-600" />
              </div>
              <div className="info-text">
                <h4>متاح في</h4>
                <p>جميع محافظات مصر</p>
              </div>
            </div>
          </div>
        </section>

        {/* رسالة تحفيزية */}
        <section className="motivation-section gradient-shift">
          <div className="motivation-content">
            <h3>نحن هنا لمساعدتك!</h3>
            <p>
              فريقنا يعمل على مدار الساعة لتقديم أفضل تجربة تعليمية لطلاب الثانوية العامة. 
              لا تتردد في التواصل معنا لأي استفسار أو مساعدة. نجاحك هو نجاحنا.
            </p>
            
            <div className="buttons-container">
              <button className="primary-button">ابدأ رحلتك التعليمية الآن</button>
              <button className="secondary-button">تصفح الكورسات المتاحة</button>
            </div>
          </div>
        </section>
      </main>

      {/* الفوتر */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">
                <div className="footer-logo-icon">
                  <GraduationCap />
                </div>
                <div className="footer-logo-text">منصة محمود الديب</div>
              </div>
              <p className="footer-tagline">
                منصة تعليمية متخصصة لطلاب الثانوية العامة في مصر، نقدم أفضل الخدمات التعليمية 
                لتحقيق التفوق الدراسي والالتحاق بالكليات المرموقة.
              </p>
            </div>
            
            <div>
              <h4>روابط سريعة</h4>
              <div className="footer-links">
                <Link href="/" className="footer-link">الرئيسية</Link>
                <Link href="/courses" className="footer-link">الكورسات</Link>
                <Link href="/about" className="footer-link">عن المنصة</Link>
                <Link href="/blog" className="footer-link">المدونة</Link>
                <Link href="/faq" className="footer-link">الأسئلة الشائعة</Link>
              </div>
            </div>
            
            <div>
              <h4>معلومات الاتصال</h4>
              <div className="contact-info">
                <div className="contact-item-footer">
                  <Phone />
                  <span>01012345678</span>
                </div>
                <div className="contact-item-footer">
                  <Mail />
                  <span>info@mahmoudeeldeeb.com</span>
                </div>
                <div className="contact-item-footer">
                  <MapPin />
                  <span>القاهرة، مصر</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4>تابعنا</h4>
              <div className="social-icons">
                <a href="https://facebook.com/mahmoudeeldeeb" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <Facebook />
                </a>
                <a href="https://instagram.com/mahmoudeeldeeb" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <Instagram />
                </a>
                <a href="https://youtube.com/@mahmoudeeldeeb" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <Youtube />
                </a>
                <a href="https://wa.me/201012345678" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <MessageCircle />
                </a>
              </div>
              
              <div className="newsletter">
                <p>اشترك في نشرتنا البريدية</p>
                <form className="newsletter-form">
                  <input type="email" placeholder="بريدك الإلكتروني" className="newsletter-input" />
                  <button type="submit" className="newsletter-button">اشترك</button>
                </form>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p className="copyright">
              جميع الحقوق محفوظة © {new Date().getFullYear()} منصة محمود الديب التعليمية
            </p>
            <div className="legal-links">
              <Link href="/privacy" className="legal-link">سياسة الخصوصية</Link>
              <Link href="/terms" className="legal-link">الشروط والأحكام</Link>
              <Link href="/refund" className="legal-link">سياسة الاسترجاع</Link>
              <Link href="/sitemap" className="legal-link">خريطة الموقع</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* الأزرار العائمة */}
      <div className="floating-buttons">
        <button 
          className="floating-button back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ChevronLeft className="transform rotate-90" />
        </button>
        
        <a
          href="https://wa.me/201012345678"
          target="_blank"
          rel="noopener noreferrer"
          className="floating-button whatsapp-button"
        >
          <MessageCircle />
        </a>
      </div>
    </div>
  )
}