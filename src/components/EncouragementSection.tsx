"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FiChevronRight, FiTarget, FiStar, FiZap, FiCheckCircle } from 'react-icons/fi';
import styles from './EncouragementSection.module.css';

interface User {
  isLoggedIn: boolean;
}

const EncouragementSection = ({ user }: { user: User }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [counter, setCounter] = useState({ students: 0, success: 0, goal: 0 });
  const sectionRef = useRef<HTMLElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          createParticles();
          startCounters();
        }
      },
      { threshold: 0.2 }
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

  const createParticles = () => {
    if (!particlesRef.current) return;

    const particles = particlesRef.current;
    particles.innerHTML = '';

    for (let i = 0; i < 25; i++) {
      const particle = document.createElement('div');
      particle.className = styles.particle;
      
      const size = Math.random() * 6 + 3;
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;
      const delay = Math.random() * 5;
      const duration = Math.random() * 20 + 10;
      
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${posX}%`;
      particle.style.top = `${posY}%`;
      particle.style.animationDelay = `${delay}s`;
      particle.style.animationDuration = `${duration}s`;
      
      particles.appendChild(particle);
    }
  };

  const startCounters = () => {
    const targetValues = { students: 5000, success: 98, goal: 80 };
    
    const duration = 2000;
    const steps = 60;
    const stepTime = duration / steps;
    
    Object.keys(targetValues).forEach((key) => {
      let currentStep = 0;
      const targetValue = targetValues[key as keyof typeof targetValues];
      const increment = targetValue / steps;
      
      const timer = setInterval(() => {
        currentStep++;
        setCounter(prev => ({
          ...prev,
          [key]: Math.min(
            Math.round(increment * currentStep),
            targetValue
          )
        }));
        
        if (currentStep >= steps) {
          clearInterval(timer);
        }
      }, stepTime);
    });
  };

  return (
    <section ref={sectionRef} className={styles.encouragementSection}>
      {/* جسيمات خلفية */}
      <div ref={particlesRef} className={styles.particlesContainer}></div>
      
      {/* موجات متحركة */}
      <div className={styles.waves}>
        <div className={styles.wave1}></div>
        <div className={styles.wave2}></div>
        <div className={styles.wave3}></div>
      </div>

      {/* نجوم متحركة */}
      <div className={styles.stars}>
        {[...Array(10)].map((_, i) => (
          <div key={i} className={styles.star} style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 3 + 2}s`
          }}></div>
        ))}
      </div>

      <div className={styles.container}>
        <div className={styles.content}>
          <div className={`${styles.textContent} ${isVisible ? styles.visible : ''}`}>


            <div className={styles.messageCard}>
              <div className={styles.messageHeader}>
                <div className={styles.messageIcon}>🔔</div>
                <h3 className={styles.messageTitle}> البارع محمود الديب</h3>
              </div>
              
              <div className={styles.messageBody}>
                <p className={styles.mainMessage}>
                  لا تقلق، 
                  <span className={styles.emphasis}> احنا معاك</span>
                  <br />
                  لحد ما توصل إلى حلمك
                </p>
                
                <div className={styles.goalCard}>
                  <div className={styles.goalHeader}>
                    <FiTarget className={styles.goalIcon} />
                    <span className={styles.goalLabel}>هدفنا </span>
                  </div>
                  <div className={styles.goalNumbers}>
                    <div className={styles.numberWrapper}>
                      <span className={styles.number}>{counter.goal}</span>
                      <span className={styles.numberLabel}>من</span>
                    </div>
                    <div className={styles.numberWrapper}>
                      <span className={styles.number}>80</span>
                      <span className={styles.numberLabel}>في اللغة العربية</span>
                    </div>
                  </div>
                  <div className={styles.goalProgress}>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill}
                        style={{ width: `${(counter.goal / 80) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.successMessage}>
                  <FiCheckCircle className={styles.successIcon} />
                  <p>
                    هدفنا 
                    <span className={styles.successHighlight}> تفوق</span>
                    <span className={styles.and}> وليس</span> مجرد نجاح
                  </p>
                </div>
              </div>
              
              <div className={styles.messageFooter}>
                <FiZap className={styles.footerIcon} />
                <p className={styles.footerText}>
                  معكم في كل خطوة من رحلتكم التعليمية
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* موجة فاصلة */}
      <div className={styles.waveDivider}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default EncouragementSection;