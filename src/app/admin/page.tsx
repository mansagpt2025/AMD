import StatCard from '@/components/admin/StatCard';
import { 
  Users, 
  Package, 
  CreditCard, 
  CheckCircle,
  Wallet
} from 'lucide-react';
import styles from './page.module.css';
import { getDashboardStats } from '@/lib/database/admin';
import React from 'react';

type QuickAction = {
  title: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
};

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>لوحة التحكم الإدارية</h1>
      </div>

      {/* Stats Grid (جاهز لو هتضيف StatCard) */}
      <div className={styles.statsGrid}>
        {/* مثال:
        <StatCard title="الطلاب" value={stats.students} icon={<Users />} />
        */}
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>الإجراءات السريعة</h2>

        <div className={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <a
              key={index}
              href={action.href}
              className={styles.actionCard}
            >
              <div className={styles.actionIcon}>
                {action.icon}
              </div>

              <h3 className={styles.actionTitle}>
                {action.title}
              </h3>

              {action.description && (
                <p className={styles.actionDescription}>
                  {action.description}
                </p>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

const quickActions: QuickAction[] = [
  {
    title: 'الأكواد',
    icon: <CreditCard className="w-8 h-8 text-blue-600" />,
    href: '/admin/codes'
  },
  {
    title: ' محتوى الصف الأول الثانوي ',
    icon: <Package className="w-8 h-8 text-green-600" />,
    href: '/admin/first-secondary'
  },
  {
    title: 'محتوى الصف الثاني الثانوي',
    icon: <Package className="w-8 h-8 text-green-600" />,
    href: '/admin/second-secondary'
  },  {
    title: 'محتوى الصف الثالث الثانوي',
    icon: <Package className="w-8 h-8 text-green-600" />,
    href: '/admin/third-secondary'
  },
  {
    title: 'سجلات الطلاب',
    icon: <Users className="w-8 h-8 text-purple-600" />,
    href: '/admin/students'
  },
  {
    title: 'ادارة محافظ الطلاب',
    icon: <Wallet className="w-8 h-8 text-orange-600" />,
    href: '/admin/wallet'
  },
  {
    title: 'الإشعارات',
    description: 'إرسال إشعارات للطلاب',
    icon: <CheckCircle className="w-8 h-8 text-teal-600" />,
    href: '/admin/notifications'
  },
  {
    title: 'ادارة كلمات مرور الطلاب',
    icon: <CreditCard className="w-8 h-8 text-blue-600" />,
    href: '/admin/passwords'
  }
];
