"use client";

import { useEffect, useRef } from 'react';
import styles from './HeroSection.module.css';

interface User {
  isLoggedIn: boolean;
  role: 'student' | 'admin' | null;
}

interface HeroSectionProps {
  user: User;
  onGetStarted: () => void;
}

const HeroSection = ({ user, onGetStarted }: HeroSectionProps) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // تأثيرات الدخول عند تحميل الصفحة
    const elements = [titleRef.current, descriptionRef.current, imageRef.current];
    
    elements.forEach((element, index) => {
      if (element) {
        setTimeout(() => {
          element.classList.add(styles.visible);
        }, index * 300);
      }
    });
  }, []);

  return (
    <section className={styles.heroSection}>
      <div className={styles.heroContent}>
        <div className={styles.textContent}>
          <h1 
            ref={titleRef}
            className={`${styles.heroTitle} ${styles.animateTitle}`}
          >
            البارع محمود الديب
          </h1>
          
          <p 
            ref={descriptionRef}
            className={`${styles.heroDescription} ${styles.animateDescription}`}
          >
            أستاذ اللغة العربية للثانوية العامة
            <br />
            مؤلف سلسلة البارع
          </p>
          
          {!user.isLoggedIn && (
            <button 
              className={`${styles.ctaButton} ${styles.animateButton}`}
              onClick={onGetStarted}
            >
              ابدأ رحلتك الآن
              <span className={styles.buttonArrow}>→</span>
            </button>
          )}
        </div>
        
        <div 
          ref={imageRef}
          className={`${styles.imageContainer} ${styles.animateImage}`}
        >
          <div className={styles.teacherImageWrapper}>
            <img 
              src="/images/teacher-main.png" 
              alt="الأستاذ محمود الديب" 
              className={styles.teacherImage}
            />
            <div className={styles.floatingElements}>
              <div className={styles.floatingElement1}></div>
              <div className={styles.floatingElement2}></div>
              <div className={styles.floatingElement3}></div>
            </div>
          </div>
          <div className={styles.imageCaption}>
            <span className={styles.captionText}>"العلم نور والجهل ظلام"</span>
          </div>
        </div>
      </div>
      
      {/* الشريط المائل تحت الهيرو */}
      <div className={styles.slantBar}>
        <div className={styles.slantContent}>
          <span className={styles.slantText}>
            وما توفيقي إلا بالله
          </span>
          <div className={styles.repeatingText}>
            <span className={styles.repeatingElement}>✦</span>
            <span className={styles.repeatingElement}>✦</span>
            <span className={styles.repeatingElement}>✦</span>
            <span className={styles.repeatingElement}>✦</span>
            <span className={styles.repeatingElement}>✦</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;