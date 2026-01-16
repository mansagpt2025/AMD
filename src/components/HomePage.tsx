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

  useEffect(() => {
    setIsMounted(true);
    
    // تحقق من حالة المستخدم في localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // تحقق من سمة التصميم
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // التحقق من تفضيلات النظام
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        setTheme('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogin = () => {
    const mockUser = {
      isLoggedIn: true,
      role: 'student' as const,
      name: 'البارع محمود الديب',
      profileImage: '/images/teacher-profile.jpg'
    };
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const handleLogout = () => {
    const mockUser = {
      isLoggedIn: false,
      role: null,
      name: 'البارع محمود الديب',
      profileImage: '/images/teacher-profile.jpg'
    };
    setUser(mockUser);
    localStorage.removeItem('user');
  };

  const handleSignup = () => {
    handleLogin();
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className={`${styles.container} ${theme === 'dark' ? styles.darkTheme : ''}`}>
      <Navbar 
        user={user}
        toggleTheme={toggleTheme}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onSignup={handleSignup}
        theme={theme}
      />
      <ProgressBar />
      <main className={styles.main}>
        <HeroSection user={user} onGetStarted={handleLogin} />
        <FeaturesSection />
        <StagesSection />
        <EncouragementSection user={user} onGetStarted={handleLogin} />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;