'use client';

import React, { useState } from 'react';
import { UserSearchForm } from '@/components/admin/UserSearchForm';
import { PasswordChangeForm } from '@/components/admin/PasswordChangeForm';
import styles from './page.module.css';

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  grade: string;
  section?: string;
  role: string;
  created_at?: string;
}

export default function PasswordPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordChanged = () => {
    setError(null);
  };

  const handleUserFound = (user: User) => {
    setSelectedUser(user);
    setError(null);
  };

  const handleUserSearchError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 3000);
  };

  const handleResetSearch = () => {
    setSelectedUser(null);
    setError(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>إدارة كلمات المرور</h1>
        <p className={styles.subtitle}>تغيير كلمات مرور المستخدمين</p>
        
        {error && (
          <div className={styles.errorAlert}>
            <span className={styles.errorIcon}>⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.searchSection}>
          <UserSearchForm 
            onUserFound={handleUserFound} 
            onError={handleUserSearchError}
          />
        </div>

        <div className={styles.formSection}>
          {selectedUser && (
            <div className={styles.formWrapper}>
              <div className={styles.formHeader}>
                <button
                  onClick={handleResetSearch}
                  className={styles.resetBtn}
                >
                  ← البحث عن مستخدم آخر
                </button>
                <div className={styles.userInfoBadge}>
                  <span>المستخدم: </span>
                  <strong>{selectedUser.full_name}</strong>
                </div>
              </div>
              <PasswordChangeForm
                user={selectedUser}
                onPasswordChanged={handlePasswordChanged}
                onError={handleUserSearchError}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}