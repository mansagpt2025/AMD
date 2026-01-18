"use client";

import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import StagesSection from './StagesSection';
import EncouragementSection from './EncouragementSection';
import Footer from './Footer';
import ProgressBar from './ProgressBar';
import styles from './HomePage.module.css';
import Image from 'next/image';

interface User {
  isLoggedIn: boolean;
  role: 'student' | 'admin' | null;
  name: string;
  profileImage: string;
}

const HomePage = () => {
  const [user, setUser] = useState<User>({
    isLoggedIn: false,
    role: null,
    name: 'البارع محمود الديب',
    profileImage: '/images/teacher-profile.jpg'
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    const loadUserData = () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.error('Error loading user data:', e);
      }
    };

    const loadTheme = () => {
      try {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
        if (savedTheme) {
          setTheme(savedTheme);
          document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            setTheme('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
          }
        }
      } catch (e) {
        console.error('Error loading theme:', e);
      }
    };

    loadUserData();
    loadTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      clearTimeout(timer);
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    } catch (e) {
      console.error('Error saving theme:', e);
    }
  };

  const handleLogin = () => {
    const loggedInUser: User = {
      isLoggedIn: true,
      role: 'student',
      name: 'طالب جديد',
      profileImage: '/images/teacher-profile.jpg'
    };

    setUser(loggedInUser);
    try {
      localStorage.setItem('user', JSON.stringify(loggedInUser));
    } catch (e) {
      console.error('Error saving user data:', e);
    }
  };

  const handleLogout = () => {
    const defaultUser: User = {
      isLoggedIn: false,
      role: null,
      name: 'البارع محمود الديب',
      profileImage: '/images/main-hero.png'
    };

    setUser(defaultUser);
    try {
      localStorage.removeItem('user');
    } catch (e) {
      console.error('Error removing user data:', e);
    }
  };

  if (!isMounted || isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>
          <Image
            src="/logo.svg"
            alt="Logo"
            width={80}
            height={80}
            className={styles.logoImage}
            priority
          />
        </div>
        <p className={styles.loadingText}>جاري التحميل...</p>
        <div className={styles.loadingProgress}>
          <div
            className={styles.loadingProgressBar}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${theme === 'dark' ? styles.darkTheme : ''}`}>
      <Navbar
        user={user}
        toggleTheme={toggleTheme}
        onLogin={handleLogin}
        onLogout={handleLogout}
        theme={theme}
      />
      <ProgressBar />
      <main className={styles.main}>
        <HeroSection user={user} />
        <FeaturesSection />
        <StagesSection />
        <EncouragementSection user={user} />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
