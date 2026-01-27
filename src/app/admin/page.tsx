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
        <p className={styles.subtitle}>إحصائيات حية وأداء المنصة التعليمية</p>
      </div>

      <div className={styles.statsGrid}>
        <StatCard
          title="إجمالي الطلاب"
          value={stats.totalStudents.toLocaleString()}
          change="+12%"
          icon={Users}
          color="blue"
          loading={false}
        />
        <StatCard
          title="الباقات المباعة"
          value={stats.totalPackages.toLocaleString()}
          change="+8%"
          icon={Package}
          color="green"
          loading={false}
        />
        <StatCard
          title="الأكواد المستخدمة"
          value={stats.usedCodes.toLocaleString()}
          change="+15%"
          icon={CreditCard}
          color="purple"
          loading={false}
        />
        <StatCard
          title="متوسط النتائج"
          value={`${stats.averageScore}%`}
          change="+5%"
          icon={BarChart3}
          color="orange"
          loading={false}
        />
        <StatCard
          title="إجمالي المحفظة"
          value={`${stats.totalWalletBalance.toLocaleString()} ج.م`}
          change="+20%"
          icon={Wallet}
          color="red"
          loading={false}
        />
        <StatCard
          title="مستخدمين جدد"
          value={stats.newUsersThisMonth.toLocaleString()}
          change="+25%"
          icon={UserPlus}
          color="teal"
          loading={false}
        />
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

      <div className={styles.recentActivity}>
        <h2 className={styles.sectionTitle}>النشاط الأخير</h2>
        <div className={styles.activityList}>
          {recentActivities.map((activity, index) => (
            <div key={index} className={styles.activityItem}>
              <div className={styles.activityIcon}>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className={styles.activityContent}>
                <p className={styles.activityText}>{activity.text}</p>
                <span className={styles.activityTime}>{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const quickActions = [
  {
    title: 'إنشاء كود جديد',
    description: 'إنشاء أكواد جديدة للباقات',
    icon: <CreditCard className="w-8 h-8 text-blue-600" />,
    href: '/admin/codes'
  },
  {
    title: 'إضافة محتوى',
    description: 'إضافة محاضرات جديدة للصفوف',
    icon: <Package className="w-8 h-8 text-green-600" />,
    href: '/admin/first-secondary'
  },
  {
    title: 'مراجعة الطلاب',
    description: 'عرض وتعديل بيانات الطلاب',
    icon: <Users className="w-8 h-8 text-purple-600" />,
    href: '/admin/students'
  },
  {
    title: 'إضافة أموال',
    description: 'إضافة أموال إلى محفظة الطالب',
    icon: <Wallet className="w-8 h-8 text-orange-600" />,
    href: '/admin/wallet'
  },
  {
    title: 'التقارير',
    description: 'عرض تقارير الأداء والنتائج',
    icon: <TrendingUp className="w-8 h-8 text-red-600" />,
    href: '#'
  },
  {
    title: 'الإشعارات',
    description: 'إرسال إشعارات للطلاب',
    icon: <CheckCircle className="w-8 h-8 text-teal-600" />,
    href: '#'
  }
];

const recentActivities = [
  { text: 'تم تفعيل باقة للطالب أحمد محمد', time: 'قبل 5 دقائق' },
  { text: 'تم إنشاء 10 أكواد جديدة للصف الثالث', time: 'قبل 30 دقيقة' },
  { text: 'تم إضافة محاضرة جديدة في الرياضيات', time: 'قبل ساعتين' },
  { text: 'اشتراك جديد في المنصة', time: 'قبل 3 ساعات' },
  { text: 'تم إضافة 500 جنيه لمحفظة الطالب محمد علي', time: 'قبل 4 ساعات' }
];