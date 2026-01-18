'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import './ContactPage.css'

export default function ContactPage() {
  /* تأثير Reveal عند التمرير */
  useEffect(() => {
    const io = new IntersectionObserver(
      entries =>
        entries.forEach(e =>
          e.target.classList.toggle('visible', e.isIntersecting)
        ),
      { threshold: 0.2 }
    )
    document
      .querySelectorAll<HTMLElement>('.contact-fade')
      .forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert(`تم نسخ الرقم: ${text}`)
  }

  const callNumber = (number: string) => {
    window.open(`tel:${number}`, '_self')
  }

  const whatsappNumber = (number: string) => {
    window.open(`https://wa.me/${number.replace('+', '')}`, '_blank')
  }

  return (
    <main className="contact-container">
      {/* شريط علوي ثابت */}
      <div className="contact-topbar">
        <div className="topbar-content">
          <span>تواصل مع الأستاذ محمود الديب</span>
          <div className="topbar-actions">
            <Link href="/" className="home-button">
              <svg className="home-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 21V15C9 14.4477 9.44772 14 10 14H14C14.5523 14 15 14.4477 15 15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              الرئيسية
            </Link>
          </div>
        </div>
      </div>

      <div className="contact-wrapper">
        {/* بطاقة المحتوى الرئيسية */}
        <div className="contact-card">
          {/* شعار الصفحة */}
          <header className="contact-logo contact-fade">
            <div className="logo-circle">
              <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 8C17 10.7614 14.7614 13 12 13C9.23858 13 7 10.7614 7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 21C3 17.134 6.13401 14 10 14H14C17.866 14 21 17.134 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="logo-primary">محمود الديب</h1>
            <h2 className="logo-secondary">البارع</h2>
            <p className="logo-sub">أستاذ اللغة العربية للثانوية العامة</p>
          </header>

          {/* عنوان الصفحة */}
          <section className="contact-header contact-fade">
            <h3 className="header-title">تواصل معنا</h3>
            <p className="header-sub">
              نحن جاهزون للرد على جميع استفساراتكم على مدار الأسبوع. يمكنكم الاتصال
              بنا مباشرة أو متابعتنا على منصّات التواصل الاجتماعي.
            </p>
          </section>

          {/* شبكة العناصر */}
          <section className="contact-grid">
            {/* معلومات الاتصال */}
            <aside className="contact-info contact-fade">
              <div className="info-header">
                <svg className="info-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 16.92V19.92C22 20.47 21.55 20.92 21 20.92H19C10.16 20.92 3 13.76 3 4.92V2.92C3 2.37 3.45 1.92 4 1.92H7C7.55 1.92 8 2.37 8 2.92V8.92C8 9.24 7.85 9.54 7.59 9.71L5.31 11.2C6.41 14.23 9.2 16.99 12.27 18.08L13.79 15.8C13.96 15.54 14.26 15.39 14.58 15.39H20C20.55 15.39 21 15.84 21 16.39V16.92H22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h4>معلومات التواصل</h4>
              </div>

              <div className="contact-numbers">
                {/* الهاتف */}
                <div className="contact-item">
                  <div className="contact-icon phone">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 4H9L11 9L8.5 10.5C9.57096 12.6715 11.3285 14.429 13.5 15.5L15 13L20 15V19C20 19.5304 19.7893 20.0391 19.4142 20.4142C19.0391 20.7893 18.5304 21 18 21C14.0993 20.763 10.4202 19.1065 7.65683 16.3432C4.8935 13.5798 3.23705 9.90074 3 6C3 5.46957 3.21071 4.96086 3.58579 4.58579C3.96086 4.21071 4.46957 4 5 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="contact-details">
                    <span className="contact-label">الهاتف</span>
                    <span className="contact-number">011 196 00 131</span>
                  </div>
                  <div className="contact-actions">
                    <button 
                      className="action-button copy" 
                      onClick={() => copyToClipboard('01119600131')}
                      title="نسخ الرقم"
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button 
                      className="action-button call" 
                      onClick={() => callNumber('01119600131')}
                      title="اتصال"
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* واتساب */}
                <div className="contact-item">
                  <div className="contact-icon whatsapp">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.498 14.381L17.507 14.38C17.559 14.377 17.606 14.35 17.634 14.306C19.073 12.07 19.26 9.219 17.66 6.799C15.937 4.198 12.868 3.146 9.89903 4.066C6.93003 4.986 5.10603 7.624 5.51403 10.56C5.74403 12.237 6.56803 13.762 7.84803 14.876L7.15003 17.695L10.042 16.997C11.149 17.557 12.377 17.848 13.622 17.848C15.526 17.848 17.329 17.082 18.604 15.729C18.623 15.71 18.636 15.686 18.643 15.659C18.649 15.632 18.649 15.604 18.642 15.578C18.636 15.551 18.624 15.527 18.607 15.507C18.59 15.487 18.569 15.472 18.546 15.463C18.522 15.454 18.497 15.451 18.471 15.454L17.498 14.381Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="contact-details">
                    <span className="contact-label">واتساب</span>
                    <span className="contact-number">010 23 958 772</span>
                  </div>
                  <div className="contact-actions">
                    <button 
                      className="action-button copy" 
                      onClick={() => copyToClipboard('01023958772')}
                      title="نسخ الرقم"
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button 
                      className="action-button whatsapp-btn" 
                      onClick={() => whatsappNumber('01023958772')}
                      title="فتح واتساب"
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* معلومات إضافية */}
              <div className="contact-info-footer">
                <div className="info-note">
                  <svg className="note-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>متاح للرد على الاستفسارات من 9 صباحاً حتى 10 مساءً</span>
                </div>
              </div>
            </aside>

            {/* بطاقة السوشيال */}
            <aside className="social-card contact-fade">
              <div className="social-header">
                <svg className="social-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h4>تابعنا على</h4>
              </div>

              <div className="social-icons-grid">
                {[
                  { 
                    name: 'facebook', 
                    url: 'https://www.facebook.com/profile.php?id=61578607520148&locale=ar_AR',
                    color: '#1877F2',
                    label: 'فيسبوك'
                  },
                  { 
                    name: 'instagram', 
                    url: 'https://instagram.com',
                    color: '#E4405F',
                    label: 'انستجرام'
                  },
                  { 
                    name: 'tiktok', 
                    url: 'https://tiktok.com',
                    color: '#000000',
                    label: 'تيك توك'
                  },
                  { 
                    name: 'youtube', 
                    url: 'https://youtube.com',
                    color: '#FF0000',
                    label: 'يوتيوب'
                  },
                  { 
                    name: 'x', 
                    url: 'https://x.com',
                    color: '#000000',
                    label: 'تويتر'
                  },
                  { 
                    name: 'telegram', 
                    url: 'https://t.me',
                    color: '#0088cc',
                    label: 'تيليجرام'
                  }
                ].map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-item"
                    style={{ '--social-color': social.color } as React.CSSProperties}
                  >
                    <div className="social-icon-wrapper">
                      <svg className="social-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {social.name === 'facebook' && (
                          <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        )}
                        {social.name === 'instagram' && (
                          <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        )}
                        {social.name === 'tiktok' && (
                          <path d="M9 12C9 15.866 12.134 19 16 19C19.866 19 23 15.866 23 12C23 8.13401 19.866 5 16 5C12.134 5 9 8.13401 9 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        )}
                        {social.name === 'youtube' && (
                          <path d="M22.54 6.42C22.4212 5.94541 22.1793 5.51057 21.8386 5.15941C21.498 4.80824 21.0708 4.55318 20.6 4.42C18.88 4 12 4 12 4C12 4 5.12 4 3.4 4.42C2.92923 4.55318 2.50196 4.80824 2.16135 5.15941C1.82074 5.51057 1.57878 5.94541 1.46 6.42C1.14521 8.186 0.991235 9.97663 1 11.77C0.991235 13.5634 1.14521 15.354 1.46 17.12C1.59096 17.6034 1.8383 18.0427 2.17814 18.394C2.51798 18.7453 2.93884 18.9968 3.4 19.12C5.12 19.54 12 19.54 12 19.54C12 19.54 18.88 19.54 20.6 19.12C21.0708 18.9868 21.498 18.7318 21.8386 18.3806C22.1793 18.0294 22.4212 17.5946 22.54 17.12C22.8525 15.354 23.0063 13.5634 22.9975 11.77C23.0063 9.97663 22.8525 8.186 22.54 6.42Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        )}
                        {social.name === 'x' && (
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        )}
                        {social.name === 'telegram' && (
                          <path d="M21 5L2 12.5L9 15M21 5L15 21L9 15M21 5L9 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        )}
                      </svg>
                    </div>
                    <span className="social-label">{social.label}</span>
                  </a>
                ))}
              </div>

              <div className="social-footer">
                <p>تابعنا للحصول على آخر الدروس والنصائح التعليمية</p>
              </div>
            </aside>
          </section>

          {/* معلومات إضافية */}
          <div className="contact-footer">
            <div className="footer-item">
              <svg className="footer-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 11C13.1046 11 14 10.1046 14 9C14 7.89543 13.1046 7 12 7C10.8954 7 10 7.89543 10 9C10 10.1046 10.8954 11 12 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>القاهرة، مصر</span>
            </div>
            <div className="footer-item">
              <svg className="footer-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 10H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>info@albar3.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* تذييل الصفحة */}
      <footer className="contact-footer-bottom">
        <p>© 2024 الأستاذ محمود الديب - جميع الحقوق محفوظة</p>
      </footer>
    </main>
  )
}