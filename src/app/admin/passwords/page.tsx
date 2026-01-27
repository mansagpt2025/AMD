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

function PasswordPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordChanged = () => {
    setRefreshTrigger((prev) => prev + 1);
    setError(null);
  };

  const handleResetSearch = () => {
    setSelectedUser(null);
  };

  const handleUserSearchError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 3000);
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
            onUserFound={setSelectedUser} 
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
                  <span>المستخدم:</span>
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

export default PasswordPage;