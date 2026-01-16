"use client";

import { useEffect, useState } from 'react';
import styles from './LoadingScreen.module.css';

const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const phases = [
    "جاري تحميل المنصة التعليمية...",
    "تهيئة البيانات...",
    "تحميل المواد الدراسية...",
    "جاري الإعداد النهائي..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    const phaseTimer = setInterval(() => {
      setPhase(prev => {
        if (prev >= phases.length - 1) {
          clearInterval(phaseTimer);
          return phases.length - 1;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(phaseTimer);
    };
  }, [phases.length]);

  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingContent}>
        {/* شعار المنصة */}
        <div className={styles.logoSection}>
          <div className={styles.logoAnimation}>
            <div className={styles.logoCircle}>
              <span className={styles.logoText}>البارع</span>
            </div>
            <div className={styles.logoGlow}></div>
          </div>
          
          <div className={styles.titleSection}>
            <h1 className={styles.mainTitle}>البارع محمود الديب</h1>
            <p className={styles.subtitle}>منصة تعليم اللغة العربية للثانوية العامة</p>
          </div>
        </div>

        {/* شريط التقدم */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            >
              <div className={styles.progressGlow}></div>
            </div>
          </div>
          <div className={styles.progressText}>
            <span className={styles.progressPercent}>{progress}%</span>
            <span className={styles.progressPhase}>{phases[phase]}</span>
          </div>
        </div>

        {/* ميزات المنصة */}
        <div className={styles.featuresPreview}>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>📚</div>
            <span className={styles.featureText}>شرح وافٍ للمنهج</span>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>📝</div>
            <span className={styles.featureText}>امتحانات شهرية</span>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>🎯</div>
            <span className={styles.featureText}>متابعة الطلاب</span>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>🏆</div>
            <span className={styles.featureText}>هدفنا 80 من 80</span>
          </div>
        </div>

        {/* فاصل زخرفي */}
        <div className={styles.decorativeLine}>
          <span className={styles.decorativeText}>وما توفيقي إلا بالله</span>
          <div className={styles.decorativeDots}>
            {[...Array(5)].map((_, i) => (
              <span key={i} className={styles.dot}>•</span>
            ))}
          </div>
        </div>

        {/* حقوق النشر */}
        <div className={styles.copyright}>
          <p>© جميع الحقوق محفوظة للأستاذ محمود الديب {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;