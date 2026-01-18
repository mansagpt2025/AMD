"use client";

import { useState, useEffect } from 'react';
import styles from './ProgressBar.module.css';

const ProgressBar = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      const totalHeight = document.body.clientHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setScrollProgress(progress);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateProgress();
          
          // إخفاء شريط التقدم عند التمرير لأسفل وإظهاره عند التمرير لأعلى
          const currentScrollY = window.scrollY;
          if (currentScrollY < 100) {
            setIsVisible(true);
          } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setIsVisible(true);
          } else {
            setIsVisible(true);
          }
          setLastScrollY(currentScrollY);
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const sections = [
    { label: 'الهيرو', progress: 0 },
    { label: 'المميزات', progress: 25 },
    { label: 'المراحل', progress: 50 },
    { label: 'التشجيع', progress: 75 },
    { label: 'النهاية', progress: 100 }
  ];

  const getCurrentSection = () => {
    const currentProgress = scrollProgress;
    for (let i = sections.length - 1; i >= 0; i--) {
      if (currentProgress >= sections[i].progress) {
        return sections[i];
      }
    }
    return sections[0];
  };

  const currentSection = getCurrentSection();

  return (
    <div className={`${styles.progressBarContainer} ${isVisible ? styles.visible : styles.hidden}`}>
      
      <div className={styles.progressTrack}>
        <div 
          className={styles.progressFill}
          style={{ width: `${scrollProgress}%` }}
        >
          <div className={styles.progressGlow}></div>
        </div>
        
        {/* علامات الأقسام */}
        {sections.map((section, index) => (
          <div
            key={index}
            className={`${styles.sectionMarker} ${
              scrollProgress >= section.progress ? styles.active : ''
            }`}
            style={{ left: `${section.progress}%` }}
            title={section.label}
          >
            <div className={styles.markerDot}></div>
            <span className={styles.markerLabel}>{section.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;