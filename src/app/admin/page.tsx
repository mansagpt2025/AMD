import StatCard from '@/components/admin/StatCard';
import { 
  Users, 
  Package, 
  CreditCard, 
  CheckCircle,
  Wallet,
  TrendingUp,
  Clock,
  AlertCircle,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import styles from './page.module.css';
import { getDashboardStats } from '@/lib/database/admin';
import React from 'react';
import Link from 'next/link';

type QuickAction = {
  title: string;
  href: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  stats?: string;
};

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  const quickActions: QuickAction[] = [
    {
      title: 'إدارة الأكواد',
      description: 'إنشاء وإدارة أكواد التفعيل والاشتراكات',
      icon: <CreditCard className={styles.actionIconSvg} />,
      href: '/admin/codes',
      color: 'var(--primary-blue)',
    },
    {
      title: 'الصف الأول الثانوي',
      description: 'إدارة المحتوى والمحاضرات والاختبارات',
      icon: <BookOpen className={styles.actionIconSvg} />,
      href: '/admin/first-secondary',
      color: 'var(--success-green)',
    },
    {
      title: 'الصف الثاني الثانوي',
      description: 'إدارة المحتوى والمحاضرات والاختبارات',
      icon: <BookOpen className={styles.actionIconSvg} />,
      href: '/admin/second-secondary',
      color: 'var(--success-green)',
    },
    {
      title: 'الصف الثالث الثانوي',
      description: 'إدارة المحتوى والمحاضرات والاختبارات',
      icon: <GraduationCap className={styles.actionIconSvg} />,
      href: '/admin/third-secondary',
      color: 'var(--success-green)',
    },
    {
      title: 'سجلات الطلاب',
      description: 'عرض وإدارة بيانات الطلاب المسجلين',
      icon: <Users className={styles.actionIconSvg} />,
      href: '/admin/students',
      color: 'var(--purple)',
    },
    {
      title: 'المحافظ الإلكترونية',
      description: 'إدارة رصيد الطلاب والمعاملات المالية',
      icon: <Wallet className={styles.actionIconSvg} />,
      href: '/admin/wallet',
      color: 'var(--orange)',
    },
    {
      title: 'الإشعارات',
      description: 'إرسال إشعارات عامة أو خاصة للطلاب',
      icon: <CheckCircle className={styles.actionIconSvg} />,
      href: '/admin/notifications',
      color: 'var(--teal)',
    },
    {
      title: 'إدارة كلمات المرور',
      description: 'إعادة تعيين كلمات مرور الطلاب',
      icon: <AlertCircle className={styles.actionIconSvg} />,
      href: '/admin/passwords',
      color: 'var(--primary-blue)',
    }
  ];

  return (
    <div className={styles.dashboardContainer}>
      {/* Header Section with Glass Effect */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>لوحة التحكم الإدارية</h1>
            <p className={styles.subtitle}>نظام إدارة منصة الأستاذ محمود الديب</p>
          </div>
          <div className={styles.dateBadge}>
            <Clock size={16} />
            <span>{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </header>

      {/* Quick Actions Grid */}
      <section className={styles.actionsSection}>
        <h2 className={styles.sectionTitle}>الإجراءات السريعة</h2>
        <div className={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className={styles.actionCard}
              style={{ '--action-color': action.color } as React.CSSProperties}
            >
              <div className={styles.actionIconWrapper}>
                {action.icon}
              </div>
              <div className={styles.actionContent}>
                <h3 className={styles.actionTitle}>{action.title}</h3>
                <p className={styles.actionDescription}>{action.description}</p>
                {action.stats && (
                  <span className={styles.actionStats}>{action.stats}</span>
                )}
              </div>
              <div className={styles.actionArrow}>←</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}