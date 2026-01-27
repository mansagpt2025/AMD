'use client';

import React, { useState } from 'react';
import { CodeForm } from '@/components/admin/CodeForm';
import { CodesTable } from '@/components/admin/CodesTable';
import styles from './page.module.css';

export default function CodesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleCodeCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 3000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>إدارة أكواد التفعيل</h1>
        <p className={styles.subtitle}>إنشاء وإدارة أكواد تفعيل الباقات</p>
        
        {error && (
          <div className={styles.errorAlert}>
            <span className={styles.errorIcon}>⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className={styles.content}>
        <CodeForm 
          onCodeCreated={handleCodeCreated} 
          onError={handleError}
        />
        <CodesTable 
          refreshTrigger={refreshTrigger}
          onError={handleError}
        />
      </div>
    </div>
  );
}