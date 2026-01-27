import React, { useState } from 'react';
import { passwordService } from '../../services/passwordService';
import styles from './PasswordChangeForm.module.css';

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  grade: string;
  section?: string;
  role: string;
}

interface Props {
  user: User | null;
  onPasswordChanged: () => void;
}

export const PasswordChangeForm: React.FC<Props> = ({ user, onPasswordChanged }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning'>('success');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<string[]>([]);

  if (!user) {
    return (
      <div className={styles.emptyState}>
        <p>يرجى البحث عن المستخدم أولاً</p>
      </div>
    );
  }

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    const validation = passwordService.validatePassword(value);
    setPasswordValidation(validation.errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setMessage('يرجى ملء جميع الحقول');
      setMessageType('warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('كلمات المرور غير متطابقة');
      setMessageType('error');
      return;
    }

    const validation = passwordService.validatePassword(newPassword);
    if (!validation.isValid) {
      setMessage('كلمة المرور ضعيفة جداً');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      await passwordService.changeUserPassword(user.id, newPassword);
      setMessage(`✓ تم تغيير كلمة المرور بنجاح لـ ${user.full_name}`);
      setMessageType('success');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordValidation([]);
      onPasswordChanged();
      
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'خطأ في تغيير كلمة المرور'
      );
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const getStrength = (password: string): number => {
    const validation = passwordService.validatePassword(password);
    const passedChecks = 4 - validation.errors.length;
    return (passedChecks / 4) * 100;
  };

  const strength = getStrength(newPassword);
  const strengthLabel =
    strength === 0 ? 'ضعيفة جداً' : strength <= 25 ? 'ضعيفة' : strength <= 75 ? 'متوسطة' : 'قوية جداً';
  const strengthColor =
    strength === 0 ? '#ef4444' : strength <= 25 ? '#f97316' : strength <= 75 ? '#eab308' : '#22c55e';

  return (
    <div className={styles.container}>
      <div className={styles.userCard}>
        <div className={styles.userHeader}>
          <div className={styles.avatar}>
            {user.full_name.charAt(0)}
          </div>
          <div className={styles.userInfo}>
            <h3 className={styles.userName}>{user.full_name}</h3>
            <p className={styles.userEmail}>{user.email}</p>
            <p className={styles.userPhone}>{user.phone}</p>
            <div className={styles.userMeta}>
              <span className={styles.badge}>{user.grade}</span>
              {user.section && <span className={styles.badge}>{user.section}</span>}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="newPassword" className={styles.label}>
            كلمة المرور الجديدة
          </label>
          <div className={styles.passwordInputWrapper}>
            <input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="أدخل كلمة المرور الجديدة"
              className={styles.input}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.toggleBtn}
            >
              {showPassword ? '👁️‍🗨️' : '👁️'}
            </button>
          </div>

          {newPassword && (
            <div className={styles.strengthMeter}>
              <div className={styles.strengthLabel}>
                قوة كلمة المرور: <span style={{ color: strengthColor }}>{strengthLabel}</span>
              </div>
              <div className={styles.strengthBar}>
                <div
                  className={styles.strengthFill}
                  style={{
                    width: `${strength}%`,
                    backgroundColor: strengthColor,
                  }}
                ></div>
              </div>

              {passwordValidation.length > 0 && (
                <ul className={styles.validationList}>
                  {passwordValidation.map((error, index) => (
                    <li key={index} className={styles.validationError}>
                      ✗ {error}
                    </li>
                  ))}
                </ul>
              )}

              {passwordValidation.length === 0 && newPassword && (
                <div className={styles.validationSuccess}>
                  ✓ كلمة المرور قوية وآمنة
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword" className={styles.label}>
            تأكيد كلمة المرور
          </label>
          <div className={styles.passwordInputWrapper}>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="أعد إدخال كلمة المرور"
              className={`${styles.input} ${
                confirmPassword && newPassword !== confirmPassword ? styles.error : ''
              }`}
              disabled={loading}
            />
            {confirmPassword && newPassword === confirmPassword && (
              <span className={styles.checkIcon}>✓</span>
            )}
            {confirmPassword && newPassword !== confirmPassword && (
              <span className={styles.errorIcon}>✗</span>
            )}
          </div>
        </div>

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={loading || !newPassword || !confirmPassword}
        >
          {loading ? 'جاري التحديث...' : 'تغيير كلمة المرور'}
        </button>
      </form>

      {message && (
        <div className={`${styles.message} ${styles[messageType]}`}>
          {message}
        </div>
      )}
    </div>
  );
};
