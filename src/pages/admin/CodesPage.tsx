import React, { useState } from 'react';
import { CodeForm } from '../../components/admin/CodeForm';
import { CodesTable } from '../../components/admin/CodesTable';
import styles from './CodesPage.module.css';

export const CodesPage: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCodeCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>إدارة أكواد التفعيل</h1>
        <p className={styles.subtitle}>إنشاء وإدارة أكواد تفعيل الباقات</p>
      </div>

      <div className={styles.content}>
        <CodeForm onCodeCreated={handleCodeCreated} />
        <CodesTable refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};
