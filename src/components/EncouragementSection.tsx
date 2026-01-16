"use client";

import { useEffect, useRef } from 'react';
import styles from './EncouragementSection.module.css';

interface User {
  isLoggedIn: boolean;
}

interface EncouragementSectionProps {
  user: User;
  onGetStarted: () => void;
}

const EncouragementSection = ({ user, onGetStarted }: EncouragementSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && textRef.current) {
            textRef.current.classList.add(styles.animateText);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.encouragementSection}>
      <div className={styles.backgroundPattern}></div>
      
      <div className={styles.contentContainer}>
        <div ref={textRef} className={styles.textContent}>
          <h2 className={styles.title}>الأديب محمود الديب</h2>
          
          <div className={styles.messageContainer}>
            <p className={styles.message}>
              لا تقلق، احنا معاك لحد ما توصل إلى حلمك
            </p>
            <p className={styles.highlight}>
              هدفنا <span className={styles.goalNumber}>80</span> من <span className={styles.goalNumber}>80</span> في اللغة العربية
            </p>
            <p className={styles.finalMessage}>
              هدفنا تفوق وليس مجرد نجاح
            </p>
          </div>
          
          {!user.isLoggedIn && (
            <button 
              className={styles.ctaButton}
              onClick={onGetStarted}
            >
              ابدأ الآن
              <div className={styles.buttonGlow}></div>
            </button>
          )}
        </div>
        
        <div className={styles.visualElement}>
          <div className={styles.floatingBook}></div>
          <div className={styles.floatingPen}></div>
          <div className={styles.successBadge}>
            <span className={styles.badgeText}>نجاح</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EncouragementSection;