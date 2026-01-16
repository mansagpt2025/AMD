"use client";

import { useState, useEffect } from 'react';
import styles from './StagesSection.module.css';

const stages = [
  {
    id: 1,
    name: 'الصف الأول الثانوي',
    image: '/images/stage-1.jpg',
    description: 'المنهج الكامل مع شرح مبسط'
  },
  {
    id: 2,
    name: 'الصف الثاني الثانوي',
    image: '/images/stage-2.jpg',
    description: 'تأسيس قوي للعام الدراسي'
  },
  {
    id: 3,
    name: 'الصف الثالث الثانوي',
    image: '/images/stage-3.jpg',
    description: 'الإعداد النهائي للثانوية العامة'
  }
];

const StagesSection = () => {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById('stages-section');
    if (section) {
      observer.observe(section);
    }

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, []);

  return (
    <section id="stages-section" className={styles.stagesSection}>
      <h2 className={styles.sectionTitle}>المراحل الدراسية</h2>
      <p className={styles.sectionSubtitle}>اختر مرحلتك الدراسية وابدأ رحلتك نحو التميز</p>
      
      <div className={styles.stagesContainer}>
        {stages.map((stage, index) => (
          <div 
            key={stage.id}
            className={`${styles.stageCard} ${inView ? styles.animateCard : ''} ${activeCard === stage.id ? styles.active : ''}`}
            style={{ animationDelay: `${index * 0.15}s` }}
            onMouseEnter={() => setActiveCard(stage.id)}
            onMouseLeave={() => setActiveCard(null)}
            onClick={() => setActiveCard(activeCard === stage.id ? null : stage.id)}
          >
            <div className={styles.cardImageContainer}>
              <img 
                src={stage.image} 
                alt={stage.name}
                className={styles.cardImage}
              />
              <div className={styles.cardOverlay}></div>
              <div className={styles.cardBadge}>مرحلة</div>
            </div>
            
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{stage.name}</h3>
              <p className={styles.cardDescription}>{stage.description}</p>
              
              <button className={styles.cardButton}>
                ابدأ التعلم
                <span className={styles.buttonIcon}>→</span>
              </button>
            </div>
            
            <div className={styles.cardHoverEffect}></div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StagesSection;