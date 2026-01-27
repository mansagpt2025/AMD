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
  const [currentUser, setCurrentUser] = useState<User>(user);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // دالة للتحقق من حالة المصادقة
  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/status', {
        credentials: 'include', // لإرسال الكوكيز
        cache: 'no-store', // لمنع التخزين المؤقت
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data);
      } else {
        // إذا فشل الطلب، نفترض أن المستخدم غير مسجل دخول
        setCurrentUser({
          isLoggedIn: false,
          role: null,
          name: '',
          profileImage: ''
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // في حالة الخطأ، نحتفظ بالحالة الحالية
    }
  }, []);

  // التحقق من حالة المصادقة كل ثانية
  useEffect(() => {
    // التحقق الفوري عند التحميل
    checkAuthStatus();
    
    // تعيين interval للتحقق كل ثانية
    const intervalId = setInterval(() => {
      checkAuthStatus();
    }, 1000); // 1000 مللي ثانية = 1 ثانية
    
    // تنظيف interval عند إلغاء التحميل
    return () => clearInterval(intervalId);
  }, [checkAuthStatus]);

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
      navLinks.push({ href: '/student/dashboard', label: 'لوحة تحكم الطالب' });
    }
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
                    <span className={styles.profileName}>{currentUser.name.split(' ')[0]}</span>
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
                        <p className={styles.dropdownProfileName}>{currentUser.name}</p>
                      </div>
                    </div>
                    <div className={styles.dropdownDivider}></div>
                    <Link href="/profile" className={styles.dropdownItem}>
                      <FiUser className={styles.dropdownIcon} />
                      الملف الشخصي
                    </Link>
                    <div className={styles.dropdownDivider}></div>
                    <button
                      onClick={onLogout}
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
                <button onClick={onLogout} className={styles.adminLogoutButton}>
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
                    <p className={styles.mobileProfileName}>{currentUser.name}</p>
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
                    onLogout();
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