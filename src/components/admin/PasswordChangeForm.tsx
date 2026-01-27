'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
  created_at?: string;
  last_login?: string;
}

interface Props {
  user: User | null;
  onPasswordChanged?: () => void; // جعلها اختيارية
  onError?: (errorMessage: string) => void;
}

export const PasswordChangeForm: React.FC<Props> = ({ 
  user, 
  onPasswordChanged,
  onError 
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning'>('success');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<string[]>([]);

  const validatePassword = useCallback((password: string) => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('يجب أن تحتوي على حرف كبير على الأقل');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('يجب أن تحتوي على حرف صغير على الأقل');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('يجب أن تحتوي على رقم على الأقل');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('يجب أن تحتوي على رمز خاص على الأقل');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setNewPassword(value);
    const validation = validatePassword(value);
    setPasswordValidation(validation.errors);
  }, [validatePassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setMessage('يرجى البحث عن المستخدم أولاً');
      setMessageType('warning');
      return;
    }

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

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setMessage('كلمة المرور لا تفي بالشروط المطلوبة');
      setMessageType('error');
      return;
    }

    if (!confirm(`هل أنت متأكد من تغيير كلمة مرور ${user.full_name}؟`)) {
      return;
    }

    setLoading(true);
    try {
      await passwordService.changeUserPassword(user.id, newPassword);
      const successMessage = `✓ تم تغيير كلمة المرور بنجاح لـ ${user.full_name}`;
      setMessage(successMessage);
      setMessageType('success');
      onError?.(successMessage);
      
      setNewPassword('');
      setConfirmPassword('');
      setPasswordValidation([]);
      
      onPasswordChanged?.();
      
      setTimeout(() => {
        setMessage('');
      }, 5000);
    } catch (error: any) {
      const errorMsg = error?.message || 'خطأ في تغيير كلمة المرور';
      setMessage(errorMsg);
      setMessageType('error');
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getStrength = (password: string): number => {
    const validation = validatePassword(password);
    const passedChecks = 4 - validation.errors.length;
    return (passedChecks / 4) * 100;
  };

  const strength = getStrength(newPassword);
  const strengthLabel =
    strength === 0 ? 'ضعيفة جداً' : strength <= 25 ? 'ضعيفة' : strength <= 75 ? 'متوسطة' : 'قوية جداً';
  const strengthColor =
    strength === 0 ? '#ef4444' : strength <= 25 ? '#f97316' : strength <= 75 ? '#eab308' : '#22c55e';

  if (!user) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>👤</div>
        <p>يرجى البحث عن المستخدم أولاً</p>
      </div>
    );
  }

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handlePasswordChange(password);
    setConfirmPassword(password);
  };

  return (
    <div className={styles.container}>
      {/* User Info Card */}
      <div className={styles.userCard}>
        <div className={styles.userHeader}>
          <div className={styles.avatar}>
            {user.full_name.charAt(0)}
          </div>
          <div className={styles.userInfo}>
            <h3 className={styles.userName}>{user.full_name}</h3>
            <p className={styles.userEmail}>
              <span className={styles.infoIcon}>📧</span>
              {user.email}
            </p>
            <p className={styles.userPhone}>
              <span className={styles.infoIcon}>📱</span>
              {user.phone}
            </p>
            <div className={styles.userMeta}>
              <span className={styles.badge}>
                <span className={styles.badgeIcon}>🎓</span>
                {user.grade}
              </span>
              {user.section && (
                <span className={styles.badge}>
                  <span className={styles.badgeIcon}>🏫</span>
                  {user.section}
                </span>
              )}
              <span className={`${styles.badge} ${styles.role}`}>
                <span className={styles.badgeIcon}>👤</span>
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Password Form */}
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h3 className={styles.formTitle}>تغيير كلمة المرور</h3>
          <button
            type="button"
            onClick={generateRandomPassword}
            className={styles.generateBtn}
            disabled={loading}
          >
            🎲 توليد كلمة مرور
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="newPassword" className={styles.label}>
              كلمة المرور الجديدة
              <span className={styles.required}> *</span>
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
                autoComplete="new-password"
              />
              <div className={styles.inputActions}>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.toggleBtn}
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? '👁️‍🗨️' : '👁️'}
                </button>
              </div>
            </div>

            {newPassword && (
              <div className={styles.strengthMeter}>
                <div className={styles.strengthHeader}>
                  <span className={styles.strengthLabel}>قوة كلمة المرور:</span>
                  <span 
                    className={styles.strengthValue}
                    style={{ color: strengthColor }}
                  >
                    {strengthLabel}
                  </span>
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
                        <span className={styles.errorIcon}>✗</span>
                        {error}
                      </li>
                    ))}
                  </ul>
                )}

                {passwordValidation.length === 0 && newPassword && (
                  <div className={styles.validationSuccess}>
                    <span className={styles.successIcon}>✓</span>
                    كلمة المرور قوية وآمنة
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              تأكيد كلمة المرور
              <span className={styles.required}> *</span>
            </label>
            <div className={styles.passwordInputWrapper}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور"
                className={`${styles.input} ${
                  confirmPassword && newPassword !== confirmPassword ? styles.error : ''
                } ${confirmPassword && newPassword === confirmPassword ? styles.success : ''}`}
                disabled={loading}
                autoComplete="new-password"
              />
              <div className={styles.inputActions}>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={styles.toggleBtn}
                  title={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showConfirmPassword ? '👁️‍🗨️' : '👁️'}
                </button>
                {confirmPassword && newPassword === confirmPassword && (
                  <span className={styles.checkIcon}>✓</span>
                )}
                {confirmPassword && newPassword !== confirmPassword && (
                  <span className={styles.errorIcon}>✗</span>
                )}
              </div>
            </div>
            
            {confirmPassword && newPassword !== confirmPassword && (
              <div className={styles.confirmError}>
                كلمات المرور غير متطابقة
              </div>
            )}
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !newPassword || !confirmPassword || passwordValidation.length > 0 || newPassword !== confirmPassword}
          >
            {loading ? (
              <>
                <span className={styles.submitSpinner}></span>
                جاري التحديث...
              </>
            ) : (
              'تغيير كلمة المرور'
            )}
          </button>
        </form>

        {message && (
          <div className={`${styles.message} ${styles[messageType]}`}>
            <span className={styles.messageIcon}>
              {messageType === 'success' ? '✓' : messageType === 'error' ? '✗' : '⚠️'}
            </span>
            <span className={styles.messageText}>{message}</span>
            <button
              onClick={() => setMessage('')}
              className={styles.messageClose}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};