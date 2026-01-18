"use client";

import { useEffect, useRef, useState } from 'react';
import { FiBook, FiCheckCircle, FiClock, FiBarChart2, FiUsers, FiAward } from 'react-icons/fi';
import styles from './FeaturesSection.module.css';

const FeaturesSection = () => {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          createParticles();
        }
      },
      { threshold: 0.1 }
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

    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = styles.featureParticle;
      
      const size = Math.random() * 8 + 4;
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;
      const delay = Math.random() * 5;
      const duration = Math.random() * 15 + 10;
      
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${posX}%`;
      particle.style.top = `${posY}%`;
      particle.style.animationDelay = `${delay}s`;
      particle.style.animationDuration = `${duration}s`;
      
      particles.appendChild(particle);
    }
  };

  const features = [
    {
      id: 1,
      icon: <FiBook />,
      title: 'شرح وافٍ لكل أجزاء المنهج',
      color: '#3b82f6'
    },
    {
      id: 2,
      icon: <FiCheckCircle />,
      title: 'امتحانات على كل جزء في المنهج',
      color: '#760303'
    },
    {
      id: 3,
      icon: <FiClock />,
      title: 'امتحانات شاملة في نهاية كل شهر',
      color: '#047d06'
    },
    {
      id: 4,
      icon: <FiBarChart2 />,
      title: ' متابعة مستمرة لكل طالب و طالبة',
      color: '#650272'
    },
  ];

  return (
    <section ref={sectionRef} className={styles.featuresSection}>
      {/* جسيمات خلفية */}
      <div ref={particlesRef} className={styles.featuresParticles}></div>
      

      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            لماذا تختار
            <span className={styles.highlight}> منصة البارع؟</span>
          </h2>
        </div>

        <div className={styles.featuresContent}>
          {/* المميزات حول الصورة */}
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div
                key={feature.id}
                className={`${styles.featureCard} ${inView ? styles.animateIn : ''} ${
                  activeFeature === feature.id ? styles.active : ''
                }`}
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  '--feature-color': feature.color
                } as React.CSSProperties}
                onMouseEnter={() => setActiveFeature(feature.id)}
                onMouseLeave={() => setActiveFeature(null)}
                onClick={() => setActiveFeature(
                  activeFeature === feature.id ? null : feature.id
                )}
              >
                <div className={styles.featureHeader}>
                  <div className={styles.featureIcon} style={{ backgroundColor: `${feature.color}20` }}>
                    <div className={styles.iconWrapper} style={{ color: feature.color }}>
                      {feature.icon}
                    </div>
                  </div>
                  <div className={styles.featureNumber}>
                    <span>{index + 1}</span>
                  </div>
                </div>

                <div className={styles.featureContent}>
                  <h3 className={styles.featureTitle}>{feature.title}</h3>
                </div>

                <div className={styles.featureHover}>
                  <div className={styles.hoverGlow} style={{ backgroundColor: `${feature.color}20` }}></div>
                  <div className={styles.hoverBorder} style={{ borderColor: feature.color }}></div>
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;