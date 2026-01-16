
import styles from './Footer.module.css';

const socialPlatforms = [
  { name: 'يوتيوب', icon: '▶️', link: 'https://youtube.com' },
  { name: 'فيسبوك', icon: '📘', link: 'https://facebook.com' },
  { name: 'انستاجرام', icon: '📷', link: 'https://instagram.com' },
  { name: 'تليجرام', icon: '✈️', link: 'https://telegram.org' }
];

const stages = [
  'الصف الأول الثانوي',
  'الصف الثاني الثانوي',
  'الصف الثالث الثانوي'
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.waveDivider}></div>
      
      <div className={styles.footerContent}>
        <div className={styles.footerSections}>
          {/* عن المنصة */}
          <div className={styles.footerSection}>
            <h3 className={styles.sectionTitle}>عن المنصة</h3>
            <div className={styles.platformInfo}>
              <div className={styles.platformLogo}>
                <div className={styles.logoCircle}></div>
                <span className={styles.logoText}>البارع محمود الديب</span>
              </div>
              <p className={styles.platformDescription}>
                منصة تعليمية متكاملة لكل صفوف المرحلة الثانوية 
                تضمن تفوقك وتميزك في اللغة العربية.
              </p>
            </div>
          </div>
          
          {/* الصفوف الدراسية */}
          <div className={styles.footerSection}>
            <h3 className={styles.sectionTitle}>الصفوف الدراسية</h3>
            <ul className={styles.stagesList}>
              {stages.map((stage, index) => (
                <li key={index} className={styles.stageItem}>
                  <span className={styles.stageBullet}>•</span>
                  <a href="#" className={styles.stageLink}>{stage}</a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* منصات التواصل */}
          <div className={styles.footerSection}>
            <h3 className={styles.sectionTitle}>منصات التواصل</h3>
            <div className={styles.socialPlatforms}>
              {socialPlatforms.map((platform, index) => (
                <a
                  key={index}
                  href={platform.link}
                  className={styles.socialLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={platform.name}
                >
                  <span className={styles.socialIcon}>{platform.icon}</span>
                  <span className={styles.socialName}>{platform.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
        
        {/* حقوق النشر */}
        <div className={styles.copyrightSection}>
          <div className={styles.copyrightContent}>
            <p className={styles.copyrightText}>
              © جميع الحقوق محفوظة للأستاذ محمود الديب {currentYear}
            </p>
            <div className={styles.decorativeLine}></div>
          </div>
        </div>
      </div>
      
      {/* عناصر زخرفية متحركة */}
      <div className={styles.floatingElements}>
        <div className={styles.floatingElement1}></div>
        <div className={styles.floatingElement2}></div>
        <div className={styles.floatingElement3}></div>
      </div>
    </footer>
  );
};

export default Footer;