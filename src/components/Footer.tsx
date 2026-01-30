import Link from 'next/link';
import { FiFacebook, FiYoutube, FiInstagram, FiTwitter, FiMail, FiPhone } from 'react-icons/fi';
import styles from './Footer.module.css';
import Image from 'next/image';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: <FiYoutube />, label: 'يوتيوب', href: 'https://youtube.com' },
    { icon: <FiFacebook />, label: 'فيسبوك', href: 'https://facebook.com' },
    { icon: <FiInstagram />, label: 'انستاجرام', href: 'https://instagram.com' },
  ];

  const stageLinks = [
    { label: 'الصف الأول الثانوي', href: '/grades/first' },
    { label: 'الصف الثاني الثانوي', href: '/grades/second' },
    { label: 'الصف الثالث الثانوي', href: '/grades/third' },
  ];

  return (
    <footer className={styles.footer}>
      {/* موجات متحركة في الأعلى */}
      <div className={styles.wavesTop}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
        </svg>
      </div>

      <div className={styles.footerContent}>
        <div className={styles.footerGrid}>
          {/* معلومات المنصة */}
          <div className={styles.footerSection}>
            <div className={styles.logoSection}>
              <div className={styles.logo}>
                <div className={styles.logoCircle}>
<Image
  src="/logo.svg"
  alt="Logo"
  width={80}
  height={80}
  className={styles.logoImage}
  priority
/>
                </div>
                <div className={styles.logoInfo}>
                  <h3 className={styles.logoTitle}>البارع محمود الديب</h3>
                </div>
              </div>
              <p className={styles.platformDescription}>
                منصة تعليمية متكاملة لكل صفوف المرحلة الثانوية 
                تضمن لك التفوق و التميز في اللغة العربية.
              </p>
            </div>
             
            <div className={styles.socialLinks}>
              <h4 className={styles.socialTitle}>تابعنا على</h4>
              <div className={styles.socialIcons}>
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialIcon}
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* الصفوف الدراسية */}
          <div className={styles.footerSection}>
            <h4 className={styles.sectionTitle}>الصفوف الدراسية</h4>
            <ul className={styles.linksList}>
              {stageLinks.map((link, index) => (
                <li key={index} className={styles.linkItem}>
                  <Link href={link.href} className={styles.link}>
                    <span className={styles.stageBullet}></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
       </div>

        {/* حقوق النشر */}
        <div className={styles.copyrightSection}>
          <div className={styles.copyrightContent}>
            <p className={styles.copyrightText}>
             ❤️  هذه المنصة تم إنشاؤها بكل الحب لطلاب الثانوية العامة ❤️
            </p>
            <p className={styles.copyrightText2}>
            --------------------------------------
            </p>
            <p className={styles.copyrightText}>
              © جميع الحقوق محفوظة للأستاذ محمود الديب {currentYear}
            </p>
          </div>
        </div>
      </div>

      {/* زر العودة للأعلى */}
      {/* الجسيمات المتحركة */}
      <div className={styles.footerParticles}></div>
    </footer>
  );
};

export default Footer;