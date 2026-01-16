import { useEffect, useRef, useState } from 'react';
import styles from './FeaturesSection.module.css';

const FeaturesSection = () => {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const features = [
    'شرح وافٍ لكل أجزاء المنهج',
    'امتحانات على كل جزء في المنهج',
    'امتحانات شاملة في نهاية كل شهر',
    'متابعة مستمرة لكل طالب وطالبة'
  ];

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

  return (
    <section ref={sectionRef} className={styles.featuresSection}>
      <h2 className={styles.sectionTitle}>مميزات المنصة</h2>
      
      <div className={styles.featuresContainer}>
        <div className={styles.teacherImageCenter}>
          <div className={`${styles.teacherCircle} ${inView ? styles.animateCircle : ''}`}>
            <img 
              src="/images/teacher-feature.png" 
              alt="الأستاذ محمود الديب" 
              className={styles.teacherFeatureImage}
            />
            <div className={styles.rotatingRing}></div>
            <div className={styles.pulseRing}></div>
          </div>
        </div>
        
        <div className={styles.featuresList}>
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`${styles.featureItem} ${inView ? styles.animateFeature : ''}`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className={styles.featureIcon}>
                <span className={styles.iconNumber}>{index + 1}</span>
              </div>
              <p className={styles.featureText}>{feature}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;