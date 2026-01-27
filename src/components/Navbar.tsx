"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import { FiMenu, FiX, FiSun, FiMoon, FiUser, FiLogOut } from 'react-icons/fi';
import { HiChevronDown } from 'react-icons/hi';
import Image from 'next/image';

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
  theme: 'light' | 'dark';
}

const Navbar = ({ user, toggleTheme, onLogout, theme }: NavbarProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>({
    isLoggedIn: false,
    role: null,
    name: '',
    profileImage: ''
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // دالة للتحقق من حالة المصادقة مع إدارة الحالة
  const checkAuthStatus = useCallback(async (isInitialCheck = false) => {
    if (isInitialCheck) {
      setIsCheckingAuth(true);
    }
    
    try {
      // استخدام fetch مع no-cache للتأكد من الحصول على أحدث حالة
      const response = await fetch('/api/auth/status', {
        method: 'GET',
        credentials: 'include', // لإرسال الكوكيز
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.isLoggedIn !== currentUser.isLoggedIn || 
            data.role !== currentUser.role || 
            data.name !== currentUser.name) {
          setCurrentUser(data);
          
          // تخزين في localStorage للاستخدام الفوري
          if (data.isLoggedIn) {
            localStorage.setItem('userData', JSON.stringify(data));
          } else {
            localStorage.removeItem('userData');
          }
        }
      } else {
        // إذا فشل الطلب، نتحقق من localStorage
        const storedUser = localStorage.getItem('userData');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);
        } else {
          setCurrentUser({
            isLoggedIn: false,
            role: null,
            name: '',
            profileImage: ''
          });
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // التحقق من localStorage في حالة الخطأ
      const storedUser = localStorage.getItem('userData');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      }
    } finally {
      if (isInitialCheck) {
        setIsCheckingAuth(false);
      }
    }
  }, [currentUser]);

  // التحقق من localStorage عند التحميل الأولي
  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setCurrentUser(parsedUser);
    }
    
    // التحقق الفوري من الخادم
    checkAuthStatus(true);
  }, []);

  // إعداد interval للتحقق كل 5 ثواني (بدلاً من كل ثانية لتقليل الحمل)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      checkAuthStatus();
    }, 5000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkAuthStatus]);

  // تحديث عند تغيير pathname
  useEffect(() => {
    checkAuthStatus();
  }, [pathname]);

  // دالة تسجيل الخروج المحسنة
  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      // تحديث الحالة المحلية فورًا
      setCurrentUser({
        isLoggedIn: false,
        role: null,
        name: '',
        profileImage: ''
      });
      
      // إزالة من localStorage
      localStorage.removeItem('userData');
      
      // إغلاق القوائم المنسدلة
      setDropdownOpen(false);
      setMobileMenuOpen(false);
      
      // استدعاء دالة تسجيل الخروج من props
      onLogout();
      
      // إعادة التوجيه للصفحة الرئيسية
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // حتى إذا فشل الطلب، نظهر المستخدم أنه تم تسجيل الخروج
      setCurrentUser({
        isLoggedIn: false,
        role: null,
        name: '',
        profileImage: ''
      });
      localStorage.removeItem('userData');
      window.location.href = '/';
    }
  }, [onLogout]);

  // إغلاق القائمة المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // تأثير التمرير
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // إغلاق القائمة المتنقلة عند تغيير المسار
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/', label: 'الرئيسية' },
    { href: '/contact', label: 'تواصل معنا' },
  ];

  // إضافة روابط بناءً على دور المستخدم
  if (currentUser.isLoggedIn) {
    if (currentUser.role === 'admin') {
      navLinks.push({ href: '/dashboard', label: 'لوحة التحكم' });
    } else if (currentUser.role === 'student') {
      navLinks.push({ href: '/student-dashboard', label: 'لوحة تحكم الطالب' });
    }
  }

  // عرض مؤشر تحميل أثناء التحقق من الحالة
  if (isCheckingAuth && !currentUser.isLoggedIn) {
    return (
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''} ${theme === 'dark' ? styles.dark : ''}`}>
        <div className={styles.navContainer}>
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <span>جاري التحقق من الحالة...</span>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''} ${theme === 'dark' ? styles.dark : ''}`}>
        <div className={styles.navContainer}>
          {/* الشعار */}
          <div className={styles.logoSection}>
            <Link href="/" className={styles.logoLink}>
              <div className={styles.logoWrapper}>
                <div className={styles.logoImage}>
                  <Image
                    src="/logo.svg"
                    alt="Logo"
                    width={50}
                    height={50}
                    className={styles.logoImage}
                    priority
                  />
                </div>
                <div className={styles.logoText}>
                  <h1 className={styles.logoTitle}>البارع</h1>
                  <p className={styles.logoSubtitle}>محمود الديب</p>
                </div>
              </div>
            </Link>
          </div>

          {/* روابط التنقل - سطح المكتب */}
          <div className={styles.linksSection}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* قسم الإجراءات */}
          <div className={styles.actionsSection}>

            {/* أزرار المصادقة */}
            {!currentUser.isLoggedIn ? (
              <div className={styles.authButtons}>
                <Link href="/login" className={styles.loginButton}>
                  تسجيل الدخول
                </Link>
                <Link href="/register" className={styles.signupButton}>
                  إنشاء حساب
                </Link>
              </div>
            ) : currentUser.role === 'student' ? (
              // القائمة المنسدلة للطالب
              <div className={styles.profileDropdown} ref={dropdownRef}>
                <button
                  className={styles.profileButton}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-label="الملف الشخصي"
                >
                  <div className={styles.profileWrapper}>
                    <div className={styles.profileImage}>
                      <FiUser className={styles.profileIcon} />
                    </div>
                    <span className={styles.profileName}>
                      {currentUser.name.split(' ')[0] || 'طالب'}
                    </span>
                    <HiChevronDown className={`${styles.chevron} ${dropdownOpen ? styles.rotate : ''}`} />
                  </div>
                </button>

                {dropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <div className={styles.dropdownHeader}>
                      <div className={styles.dropdownProfileImage}>
                        <FiUser />
                      </div>
                      <div className={styles.dropdownProfileInfo}>
                        <p className={styles.dropdownProfileRole}>أهلًا :</p>
                        <p className={styles.dropdownProfileName}>
                          {currentUser.name || 'طالب'}
                        </p>
                      </div>
                    </div>
                    <div className={styles.dropdownDivider}></div>
                    <Link href="/profile" className={styles.dropdownItem}>
                      <FiUser className={styles.dropdownIcon} />
                      الملف الشخصي
                    </Link>
                    <div className={styles.dropdownDivider}></div>
                    <button
                      onClick={handleLogout}
                      className={`${styles.dropdownItem} ${styles.logoutItem}`}
                    >
                      <FiLogOut className={styles.dropdownIcon} />
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // الأدمن
              <div className={styles.adminSection}>
                <Link href="/dashboard" className={styles.adminDashboardButton}>
                  لوحة التحكم
                </Link>
                <button onClick={handleLogout} className={styles.adminLogoutButton}>
                  <FiLogOut />
                </button>
              </div>
            )}

            {/* زر القائمة للهاتف */}
            <button
              className={styles.mobileMenuButton}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="فتح/إغلاق القائمة"
            >
              {mobileMenuOpen ? (
                <FiX className={styles.menuIcon} />
              ) : (
                <FiMenu className={styles.menuIcon} />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* القائمة المتنقلة للهاتف */}
      <div className={`${styles.mobileMenuOverlay} ${mobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.mobileMenuContent}>
          <div className={styles.mobileMenuHeader}>
            <div className={styles.mobileProfile}>
              {currentUser.isLoggedIn ? (
                <>
                  <div className={styles.mobileProfileImage}>
                    <FiUser />
                  </div>
                  <div className={styles.mobileProfileInfo}>
                    <p className={styles.mobileProfileName}>
                      {currentUser.name || 'مستخدم'}
                    </p>
                    <p className={styles.mobileProfileRole}>
                      {currentUser.role === 'admin' ? 'أدمن' : 'طالب'}
                    </p>
                  </div>
                </>
              ) : (
                <div className={styles.mobileWelcome}>
                  <p>مرحباً بك !</p>
                  <p>سجل الدخول لبدء التعلم</p>
                </div>
              )}
            </div>
          </div>

          <div className={styles.mobileNavLinks}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.mobileNavLink} ${pathname === link.href ? styles.active : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className={styles.mobileActions}>
            {!currentUser.isLoggedIn ? (
              <div className={styles.mobileAuthButtons}>
                <Link
                  href="/login"
                  className={styles.mobileLoginButton}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  تسجيل الدخول
                </Link>
                <Link
                  href="/register"
                  className={styles.mobileSignupButton}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  إنشاء حساب
                </Link>
              </div>
            ) : (
              <div className={styles.mobileUserActions}>
                <Link
                  href="/profile"
                  className={styles.mobileProfileButton}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  الملف الشخصي
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className={styles.mobileLogoutButton}
                >
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default Navbar;