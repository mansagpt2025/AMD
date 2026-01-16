"use client";

import { useState, useEffect } from 'react';
import styles from './ProgressBar.module.css';

const ProgressBar = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const totalHeight = document.body.clientHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', updateProgress);
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div className={styles.progressBarContainer}>
      <div 
        className={styles.progressBar}
        style={{ width: `${scrollProgress}%` }}
      >
        <div className={styles.progressGlow}></div>
      </div>
      <div className={styles.progressText}>
        <span className={styles.progressPercent}>{Math.round(scrollProgress)}%</span>
      </div>
    </div>
  );
};

export default ProgressBar;