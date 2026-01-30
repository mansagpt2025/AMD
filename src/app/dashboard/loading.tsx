"use client";

import { useEffect, useState } from 'react';
import styles from './LoadingScreen.module.css';
import Image from 'next/image';

const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const phases = [
    "جاري تحميل ...",
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
              <Image
                src="/logo.svg"
                alt="Logo"
                width={50}
                height={50}
                className={styles.logoImage}
                priority
              />
            </div>
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
      </div>
    </div>
  );
};

export default LoadingScreen;