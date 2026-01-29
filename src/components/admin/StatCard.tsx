import React from 'react';
import styles from './StatCard.module.css';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendUp = true,
  color = 'blue' 
}: StatCardProps) {
  const colorClasses = {
    blue: styles.blue,
    green: styles.green,
    purple: styles.purple,
    orange: styles.orange,
    red: styles.red
  };

  return (
    <div className={`${styles.card} ${colorClasses[color]}`}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          {icon}
        </div>
        <div className={styles.info}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.value}>{value.toLocaleString('ar-EG')}</p>
          {trend && (
            <span className={`${styles.trend} ${trendUp ? styles.up : styles.down}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </span>
          )}
        </div>
      </div>
      <div className={styles.decorativeCircle} />
    </div>
  );
}