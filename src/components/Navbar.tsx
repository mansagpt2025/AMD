"use client";

import { useState, useEffect } from 'react';
import styles from './Navbar.module.css';

interface User {
  isLoggedIn: boolean;
  role: 'student' | 'admin' | null;
  name: string;
  profileImage: string;
}

interface NavbarProps {
  user: User;
  toggleTheme: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onSignup: () => void;
  theme: 'light' | 'dark';
}

const Navbar = ({ user, toggleTheme, onLogin, onLogout, onSignup, theme }: NavbarProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleProfileClick = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleMobileMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <>
      <nav className={`${styles.navbar} ${theme === 'dark' ? styles.dark : ''}`}>
        <div className={styles.navContainer}>
          {/* الاسم والصورة على اليمين */}
          <div className={styles.logoSection}>
            <div className={styles.logoImageContainer}>
              <img 
                src={user.profileImage || '/images/teacher-profile.jpg'} 
                alt="صورة الأستاذ محمود الديب" 
                className={styles.logoImage}
              />
            </div>
            <h1 className={styles.logoText}>{user.name}</h1>
          </div>

          {/* الروابط في الوسط */}
          <div className={`${styles.linksSection} ${menuOpen ? styles.mobileMenuOpen : ''}`}>
            <a href="/" className={styles.navLink}>الرئيسية</a>
            <a href="/contact" className={styles.navLink}>تواصل معنا</a>
            {user.isLoggedIn && user.role === 'admin' && (
              <a href="/dashboard" className={styles.navLink}>لوحة التحكم</a>
            )}
          </div>

          {/* الأزرار على اليسار */}
          <div className={styles.actionsSection}>
            <button 
              className={`${styles.themeToggle} ${theme === 'dark' ? styles.darkThemeBtn : ''}`}
              onClick={toggleTheme}
              aria-label="تبديل الوضع"
            >
              <span className={styles.themeIcon}>
                {theme === 'light' ? '🌙' : '☀️'}
              </span>
              <span className={styles.themeText}>تحويل الوضع</span>
            </button>

            {!user.isLoggedIn ? (
              <div className={styles.authButtons}>
                <button className={styles.loginButton} onClick={onLogin}>
                  تسجيل الدخول
                </button>
                <button className={styles.signupButton} onClick={onSignup}>
                  إنشاء حساب
                </button>
              </div>
            ) : user.role === 'student' ? (
              <div className={styles.profileSection}>
                <div className={styles.profileContainer}>
                  <button 
                    className={styles.profileButton}
                    onClick={handleProfileClick}
                    aria-label="فتح قائمة الملف الشخصي"
                  >
                    <div className={styles.profileImageWrapper}>
                      <div className={styles.profileAnimation}>
                        <img 
                          src="/images/student-animation.gif" 
                          alt="صورة الطالب" 
                          className={styles.profileImage}
                        />
                      </div>
                    </div>
                  </button>
                  {dropdownOpen && (
                    <div className={styles.dropdownMenu}>
                      <button 
                        className={styles.dropdownItem} 
                        onClick={onLogout}
                      >
                        تسجيل الخروج
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // حالة الأدمن
              <button className={styles.adminLogoutButton} onClick={onLogout}>
                تسجيل الخروج
              </button>
            )}

            {/* زر القائمة للهواتف */}
            <button 
              className={styles.mobileMenuButton}
              onClick={handleMobileMenuToggle}
              aria-label="فتح/إغلاق القائمة"
            >
              <span className={styles.menuIcon}></span>
              <span className={styles.menuIcon}></span>
              <span className={styles.menuIcon}></span>
            </button>
          </div>
        </div>
      </nav>

      {/* قائمة الهاتف المتحركة */}
      {menuOpen && isMobile && (
        <div className={styles.mobileMenuOverlay}>
          <div className={styles.mobileMenuContent}>
            <a href="/" className={styles.mobileNavLink} onClick={() => setMenuOpen(false)}>الرئيسية</a>
            <a href="/contact" className={styles.mobileNavLink} onClick={() => setMenuOpen(false)}>تواصل معنا</a>
            {user.isLoggedIn && user.role === 'admin' && (
              <a href="/dashboard" className={styles.mobileNavLink} onClick={() => setMenuOpen(false)}>لوحة التحكم</a>
            )}
            <div className={styles.mobileAuthButtons}>
              {!user.isLoggedIn ? (
                <>
                  <button className={styles.mobileLoginButton} onClick={() => { onLogin(); setMenuOpen(false); }}>
                    تسجيل الدخول
                  </button>
                  <button className={styles.mobileSignupButton} onClick={() => { onSignup(); setMenuOpen(false); }}>
                    إنشاء حساب
                  </button>
                </>
              ) : (
                <button className={styles.mobileLogoutButton} onClick={() => { onLogout(); setMenuOpen(false); }}>
                  تسجيل الخروج
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;