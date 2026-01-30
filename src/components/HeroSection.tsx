"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FiChevronRight, FiPlayCircle, FiUsers, FiAward, FiBookOpen } from 'react-icons/fi';
import styles from './HeroSection.module.css';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface User {
  isLoggedIn: boolean;
}

const HeroSection = ({ user }: { user: User }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

const [currentUser, setCurrentUser] = useState(user);
const router = useRouter();

// التحقق كل ثانية من localStorage
useEffect(() => {
  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (token && !currentUser.isLoggedIn) {
      setCurrentUser({ isLoggedIn: true });
    } else if (!token && currentUser.isLoggedIn) {
      setCurrentUser({ isLoggedIn: false });
    }
  };
  
  checkAuth();
  const interval = setInterval(checkAuth, 1000);
  return () => clearInterval(interval);
}, [currentUser.isLoggedIn]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.heroSection}>
      {/* خلفية متحركة */}

      <div className={styles.container}>
        <div className={`${styles.heroContent} ${isVisible ? styles.visible : ''}`}>
          <div ref={textRef} className={styles.heroText}>

            <h1 className={styles.title}>
              <span className={styles.gradientText}>البارع</span>
              <br />
              <span className={styles.name}>محمود الديب</span>
            </h1>

            <h2 className={styles.subtitle}>
              أستاذ&nbsp;اللغة&nbsp;العربية&nbsp;للثانوية&nbsp;العامة
              <span className={styles.highlight}> و مؤلف سلسلة البارع</span>
            </h2>

<div className={styles.ctaButtons}>
  {!currentUser.isLoggedIn ? (
    <>
      <Link href="/register" className={styles.primaryButton}>
        <span>ابدأ رحلتك الآن</span>
      </Link>
      <Link href="/login" className={styles.secondaryButton}>
        <span>تسجيل الدخول</span>
      </Link>
    </>
  ) : (
    <>
      <Link href="/dashboard" className={styles.primaryButton}>
        <span>لوحة التحكم</span>
      </Link>
      <button 
        onClick={() => {
          localStorage.removeItem('token');
          setCurrentUser({ isLoggedIn: false });
          router.push('/');
        }} 
        className={styles.secondaryButton}
        style={{ cursor: 'pointer' }}
      >
        <span>تسجيل الخروج</span>
      </button>
    </>
  )}
</div>


          </div>

          <div ref={imageRef} className={styles.heroImage}>
            <div className={styles.imageContainer}>

              <div className={styles.teacherImage}>
                <div className={styles.imageGlow}></div>
                <div className={styles.imageBorder}></div>
                <img 
  src="/images/teacher/main-hero.png" 
  alt="الأستاذ محمود الديب"
  className={styles.teacherImage}
/>
              </div>              

              </div>              
          </div>
        </div>
      </div>

      {/* الشريط المائل المتحرك */}
      <div className={styles.slantBar}>
        <div className={styles.slantContent}>
          <div className={styles.marquee}>
            <div className={styles.marqueeContent}>
              <span className={styles.slantText}>وما توفيقي إلا بالله</span>
              <div className={styles.separator}>
                <span>✦</span>
                <span>✦</span>
                <span>✦</span>
              </div>
              <span className={styles.slantText}>وما توفيقي إلا بالله</span>
              <div className={styles.separator}>
                <span>✦</span>
                <span>✦</span>
                <span>✦</span>
              </div>
              <span className={styles.slantText}>وما توفيقي إلا بالله</span>
                            <div className={styles.separator}>
                <span>✦</span>
                <span>✦</span>
                <span>✦</span>
              </div>

                            <span className={styles.slantText}>وما توفيقي إلا بالله</span>
              <div className={styles.separator}>
                <span>✦</span>
                <span>✦</span>
                <span>✦</span>
              </div>
              <span className={styles.slantText}>وما توفيقي إلا بالله</span>
              <div className={styles.separator}>
                <span>✦</span>
                <span>✦</span>
                <span>✦</span>
              </div>
              <span className={styles.slantText}>وما توفيقي إلا بالله</span>
     <div className={styles.separator}>
                <span>✦</span>
                <span>✦</span>
                <span>✦</span>
              </div>
              <span className={styles.slantText}>وما توفيقي إلا بالله</span>
                   <div className={styles.separator}>
                <span>✦</span>
                <span>✦</span>
                <span>✦</span>
              </div>
              <span className={styles.slantText}>وما توفيقي إلا بالله</span>
     <div className={styles.separator}>
                <span>✦</span>
                <span>✦</span>
                <span>✦</span>
              </div>
              <span className={styles.slantText}>وما توفيقي إلا بالله</span>
     <div className={styles.separator}>
                <span>✦</span>
                <span>✦</span>
                <span>✦</span>
              </div>
              <span className={styles.slantText}>وما توفيقي إلا بالله</span>
     <div className={styles.separator}>
                <span>✦</span>
                <span>✦</span>
                <span>✦</span>
              </div>
              <span className={styles.slantText}>وما توفيقي إلا بالله</span>
     <div className={styles.separator}>
                <span>✦</span>
                <span>✦</span>
                <span>✦</span>
              </div>
              <span className={styles.slantText}>وما توفيقي إلا بالله</span>
     <div className={styles.separator}>
                <span>✦</span>
                <span>✦</span>
                <span>✦</span>
              </div>
              <span className={styles.slantText}>وما توفيقي إلا بالله</span>

            </div>
          </div>
        </div>
      </div>

      {/* موجة فاصلة */}
      <div className={styles.waveDivider}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;