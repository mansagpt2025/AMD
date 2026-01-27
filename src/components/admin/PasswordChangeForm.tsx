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
  onPasswordChanged: () => void;
  onError?: (errorMessage: string) => void;
}

interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong';
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
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    isValid: false,
    errors: [],
    strength: 'very-weak'
  });

  const validatePassword = useCallback((password: string): PasswordValidation => {
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
    
    let strength: PasswordValidation['strength'] = 'very-weak';
    if (password.length >= 12 && errors.length === 0) {
      strength = 'very-strong';
    } else if (password.length >= 10 && errors.length <= 1) {
      strength = 'strong';
    } else if (password.length >= 8 && errors.length <= 2) {
      strength = 'medium';
    } else if (password.length >= 6) {
      strength = 'weak';
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      strength
    };
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setNewPassword(value);
    const validation = validatePassword(value);
    setPasswordValidation(validation);
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

    if (!passwordValidation.isValid) {
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
      setPasswordValidation({
        isValid: false,
        errors: [],
        strength: 'very-weak'
      });
      
      onPasswordChanged();
      
      setTimeout(() => {
        setMessage('');
      }, 5000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'خطأ في تغيير كلمة المرور';
      setMessage(errorMsg);
      setMessageType('error');
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const strengthConfig = useMemo(() => {
    const config = {
      'very-weak': { color: '#ef4444', label: 'ضعيفة جداً', width: '20%' },
      'weak': { color: '#f97316', label: 'ضعيفة', width: '40%' },
      'medium': { color: '#eab308', label: 'متوسطة', width: '60%' },
      'strong': { color: '#84cc16', label: 'قوية', width: '80%' },
      'very-strong': { color: '#22c55e', label: 'قوية جداً', width: '100%' }
    };
    return config[passwordValidation.strength];
  }, [passwordValidation.strength]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return '-';
    }
  };

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
        
        <div className={styles.userDetails}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>تاريخ التسجيل:</span>
            <span className={styles.detailValue}>{formatDate(user.created_at)}</span>
          </div>
          {user.last_login && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>آخر تسجيل دخول:</span>
              <span className={styles.detailValue}>{formatDate(user.last_login)}</span>
            </div>
          )}
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
                    style={{ color: strengthConfig.color }}
                  >
                    {strengthConfig.label}
                  </span>
                </div>
                <div className={styles.strengthBar}>
                  <div
                    className={styles.strengthFill}
                    style={{
                      width: strengthConfig.width,
                      backgroundColor: strengthConfig.color,
                    }}
                  ></div>
                </div>

                {passwordValidation.errors.length > 0 && (
                  <ul className={styles.validationList}>
                    {passwordValidation.errors.map((error, index) => (
                      <li key={index} className={styles.validationError}>
                        <span className={styles.errorIcon}>✗</span>
                        {error}
                      </li>
                    ))}
                  </ul>
                )}

                {passwordValidation.isValid && (
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

          <div className={styles.passwordRequirements}>
            <h4 className={styles.requirementsTitle}>شروط كلمة المرور:</h4>
            <ul className={styles.requirementsList}>
              <li className={styles.requirementItem}>• 8 أحرف على الأقل</li>
              <li className={styles.requirementItem}>• حرف كبير على الأقل</li>
              <li className={styles.requirementItem}>• حرف صغير على الأقل</li>
              <li className={styles.requirementItem}>• رقم على الأقل</li>
              <li className={styles.requirementItem}>• رمز خاص على الأقل</li>
            </ul>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !newPassword || !confirmPassword || !passwordValidation.isValid || newPassword !== confirmPassword}
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