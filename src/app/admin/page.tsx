import StatCard from '@/components/admin/StatCard';
import { 
  Users, 
  Package, 
  CreditCard, 
  BarChart3,
  TrendingUp,
  CheckCircle,
  Wallet,
  UserPlus
} from 'lucide-react';
import styles from './page.module.css';
import { getDashboardStats } from '@/lib/database/admin';

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>لوحة التحكم الإدارية</h1>
      </div>

      <div className={styles.statsGrid}>
      </div>

      <div className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>الإجراءات السريعة</h2>
        <div className={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <a
              key={index}
              href={action.href}
              className={styles.actionCard}
            >
              <div className={styles.actionIcon}>{action.icon}</div>
              <h3 className={styles.actionTitle}>{action.title}</h3>
              <p className={styles.actionDescription}>{action.description}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

const quickActions = [
  {
    title: 'الأكواد',
    icon: <CreditCard className="w-8 h-8 text-blue-600" />,
    href: '/admin/codes'
  },
  {
    title: 'إضافة محتوى',
    icon: <Package className="w-8 h-8 text-green-600" />,
    href: '/admin/first-secondary'
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
    href: '#'
  }
  ,{
    title: 'ادارة كلمات مرور الطلاب',
    icon: <CreditCard className="w-8 h-8 text-blue-600" />,
    href: '/admin/passwords'
  },
];
