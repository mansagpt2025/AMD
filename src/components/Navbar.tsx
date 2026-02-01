"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import { FiMenu, FiX, FiSun, FiMoon, FiUser, FiLogOut } from 'react-icons/fi';
import { HiChevronDown } from 'react-icons/hi';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/supabase-client';

interface User {
  isLoggedIn: boolean;
  role: 'student' | 'admin' | null;
  name: string;
  profileImage: string;
}

interface NavbarProps {
  user: User | null   // 👈 أضف السطر ده
  toggleTheme: () => void
  onLogin: () => void
  onLogout: () => void
  theme: 'light' | 'dark'
}

const Navbar = ({ toggleTheme, onLogout, theme }: NavbarProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>({
    isLoggedIn: false,
    role: null,
    name: '',
    profileImage: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // دالة لتحميل بيانات المستخدم من Supabase
  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // 1. الحصول على الجلسة الحالية من Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setCurrentUser({
          isLoggedIn: false,
          role: null,
          name: '',
          profileImage: ''
        });
        
        // حذف من localStorage
        localStorage.removeItem('supabase_auth_data');
        return;
      }

      // 2. الحصول على بيانات المستخدم من جدول profiles
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        
        // إذا فشل تحميل الـ profile، نستخدم بيانات المستخدم الأساسية
        setCurrentUser({
          isLoggedIn: true,
          role: 'student', // افتراضياً طالب
          name: session.user.email?.split('@')[0] || 'مستخدم',
          profileImage: '',
        });
      } else {
        // تحديد دور المستخدم
        let role: 'student' | 'admin' = 'student';
        if (profileData.is_admin === true) {
          role = 'admin';
        }

        setCurrentUser({
          isLoggedIn: true,
          role,
          name: profileData.full_name || profileData.name || session.user.email?.split('@')[0] || 'مستخدم',
          profileImage: profileData.avatar_url || profileData.profile_image || '',
        });

        // حفظ في localStorage للاستخدام السريع
        localStorage.setItem('supabase_auth_data', JSON.stringify({
          isLoggedIn: true,
          role,
          name: profileData.full_name || profileData.name || session.user.email?.split('@')[0] || 'مستخدم',
          profileImage: profileData.avatar_url || profileData.profile_image || '',
          lastUpdated: Date.now()
        }));
      }
    } catch (err) {
      console.error('Error in loadUserData:', err);
      
      // التحقق من localStorage كنسخة احتياطية
      const storedData = localStorage.getItem('supabase_auth_data');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // إذا كانت البيانات أقل من 5 دقائق، نستخدمها
        if (Date.now() - parsedData.lastUpdated < 5 * 60 * 1000) {
          setCurrentUser(parsedData);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // التحقق من حالة المصادقة عند التحميل
  useEffect(() => {
    // أولاً: التحقق من localStorage للتحميل السريع
    const storedData = localStorage.getItem('supabase_auth_data');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setCurrentUser(parsedData);
    }
    
    // ثانياً: التحقق من Supabase للحصول على أحدث البيانات
    loadUserData();
    
    // ثالثاً: إعداد استماع لتغييرات المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Supabase auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
          await loadUserData();
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser({
            isLoggedIn: false,
            role: null,
            name: '',
            profileImage: ''
          });
          localStorage.removeItem('supabase_auth_data');
        } else if (event === 'TOKEN_REFRESHED' && session) {
          await loadUserData();
        }
      }
    );

    // رابعاً: إعداد interval للتحقق كل 30 ثانية
    intervalRef.current = setInterval(() => {
      loadUserData();
    }, 30000);

    // تنظيف
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscription.unsubscribe();
    };
  }, []);

  // إعادة تحميل بيانات المستخدم عند تغيير المسار
  useEffect(() => {
    if (pathname !== '/login' && pathname !== '/register') {
      loadUserData();
    }
  }, [pathname]);

  // دالة تسجيل الخروج
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setCurrentUser({
        isLoggedIn: false,
        role: null,
        name: '',
        profileImage: ''
      });
      
      localStorage.removeItem('supabase_auth_data');
      
      setDropdownOpen(false);
      setMobileMenuOpen(false);
      
      // إذا كان هناك دالة onLogout من الـ props، استدعها
      if (onLogout) {
        onLogout();
      }
      
      // إعادة التوجيه للصفحة الرئيسية
      window.location.href = '/';
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

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
      navLinks.push({ href: '/admin', label: 'لوحة التحكم' });
    } else if (currentUser.role === 'student') {
      navLinks.push({ href: '/dashboard', label: 'لوحة تحكم الطالب' });
    }
  }

  // عرض مؤشر تحميل أثناء جلب البيانات
  if (isLoading && !currentUser.name) {
    return (
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''} ${theme === 'dark' ? styles.dark : ''}`}>
        <div className={styles.navContainer}>
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
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
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
                    {/* تم حذف رابط الملف الشخصي */}
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
                {/* تم حذف رابط الملف الشخصي */}
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