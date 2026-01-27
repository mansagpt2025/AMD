import StatCard from '@/components/admin/StatCard';
import { 
  Users, 
  Package, 
  CreditCard, 
  BarChart3,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import styles from './page.module.css';
import { getAdminStats } from '@/lib/supabase-admin';

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>مرحباً بك في لوحة التحكم</h1>
        <p className={styles.subtitle}>إحصائيات وأداء المنصة التعليمية</p>
      </div>

      <div className={styles.statsGrid}>
        <StatCard
          title="إجمالي الطلاب"
          value={stats.totalStudents}
          change="+12%"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="الباقات المباعة"
          value={stats.totalPackages}
          change="+8%"
          icon={Package}
          color="green"
        />
        <StatCard
          title="الأكواد المستخدمة"
          value={stats.usedCodes}
          change="+15%"
          icon={CreditCard}
          color="purple"
        />
        <StatCard
          title="متوسط النتائج"
          value={`${stats.averageScore}%`}
          change="+5%"
          icon={BarChart3}
          color="orange"
        />
      </div>

      <div className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>الإجراءات السريعة</h2>
        <div className={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <div key={index} className={styles.actionCard}>
              <div className={styles.actionIcon}>{action.icon}</div>
              <h3 className={styles.actionTitle}>{action.title}</h3>
              <p className={styles.actionDescription}>{action.description}</p>
            </div>
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
    icon: <CreditCard className="w-8 h-8 text-blue-600" />
  },
  {
    title: 'إضافة محتوى',
    description: 'إضافة محاضرات جديدة للصفوف',
    icon: <Package className="w-8 h-8 text-green-600" />
  },
  {
    title: 'مراجعة الطلاب',
    description: 'عرض وتعديل بيانات الطلاب',
    icon: <Users className="w-8 h-8 text-purple-600" />
  },
  {
    title: 'التقارير',
    description: 'عرض تقارير الأداء والنتائج',
    icon: <TrendingUp className="w-8 h-8 text-orange-600" />
  }
];

const recentActivities = [
  { text: 'تم تفعيل باقة للطالب أحمد محمد', time: 'قبل 5 دقائق' },
  { text: 'تم إنشاء 10 أكواد جديدة للصف الثالث', time: 'قبل 30 دقيقة' },
  { text: 'تم إضافة محاضرة جديدة في الرياضيات', time: 'قبل ساعتين' },
  { text: 'اشتراك جديد في المنصة', time: 'قبل 3 ساعات' }
];