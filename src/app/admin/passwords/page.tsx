import React, { useState } from 'react';
import { UserSearchForm } from '@/components/admin/UserSearchForm';
import { PasswordChangeForm } from '@/components/admin/PasswordChangeForm';
import styles from './Page.module.css';

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  grade: string;
  section?: string;
  role: string;
}

function PasswordPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePasswordChanged = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleResetSearch = () => {
    setSelectedUser(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>إدارة كلمات المرور</h1>
        <p className={styles.subtitle}>تغيير كلمات مرور المستخدمين</p>
      </div>

      <div className={styles.content}>
        <div className={styles.searchSection}>
          <UserSearchForm onUserFound={setSelectedUser} />
        </div>

        <div className={styles.formSection}>
          {selectedUser && (
            <div className={styles.formWrapper}>
              <button
                onClick={handleResetSearch}
                className={styles.resetBtn}
              >
                ← البحث عن مستخدم آخر
              </button>
              <PasswordChangeForm
                user={selectedUser}
                onPasswordChanged={handlePasswordChanged}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PasswordPage;
