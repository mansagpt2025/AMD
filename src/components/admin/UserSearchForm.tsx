'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { passwordService } from '../../services/passwordService';
import styles from './UserSearchForm.module.css';

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

interface Props {
  onUserFound?: (user: User) => void; // جعلها اختيارية
  onError?: (errorMessage: string) => void;
}

export const UserSearchForm: React.FC<Props> = ({ onUserFound, onError }) => {
  const [searchType, setSearchType] = useState<'email' | 'phone'>('email');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning'>('success');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedValue = searchValue.trim();
    if (!trimmedValue) {
      setMessage('يرجى إدخال قيمة للبحث');
      setMessageType('warning');
      return;
    }

    if (searchType === 'email' && !/\S+@\S+\.\S+/.test(trimmedValue)) {
      setMessage('البريد الإلكتروني غير صحيح');
      setMessageType('warning');
      return;
    }

    if (searchType === 'phone' && !/^[0-9]+$/.test(trimmedValue)) {
      setMessage('رقم الهاتف يجب أن يحتوي على أرقام فقط');
      setMessageType('warning');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      let user: User;
      
      if (searchType === 'email') {
        user = await passwordService.findUserByEmail(trimmedValue);
      } else {
        user = await passwordService.findUserByPhone(trimmedValue);
      }

      const successMessage = `✓ تم العثور على المستخدم: ${user.full_name}`;
      setMessage(successMessage);
      setMessageType('success');
      onError?.(successMessage);
      onUserFound?.(user);
    } catch (error: any) {
      const errorMessage = error?.message || 'حدث خطأ في البحث';
      setMessage(errorMessage);
      setMessageType('error');
      onError?.(errorMessage);
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = () => {
    switch (searchType) {
      case 'email': return 'example@email.com';
      case 'phone': return '01234567890';
      default: return '';
    }
  };

  const getSearchTypeLabel = () => {
    switch (searchType) {
      case 'email': return 'البريد الإلكتروني';
      case 'phone': return 'رقم الهاتف';
      default: return '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.title}>البحث عن المستخدم</h2>
          <div className={styles.searchInfo} title="ابحث عن المستخدم لتغيير كلمة مروره">
            ℹ️
          </div>
        </div>

        <form onSubmit={handleSearch} className={styles.form}>
          <div className={styles.searchTypeGroup}>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  value="email"
                  checked={searchType === 'email'}
                  onChange={(e) => {
                    setSearchType(e.target.value as 'email');
                    setSearchValue('');
                    setMessage('');
                  }}
                  disabled={loading}
                />
                <span className={styles.radioText}>البريد الإلكتروني</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  value="phone"
                  checked={searchType === 'phone'}
                  onChange={(e) => {
                    setSearchType(e.target.value as 'phone');
                    setSearchValue('');
                    setMessage('');
                  }}
                  disabled={loading}
                />
                <span className={styles.radioText}>رقم الهاتف</span>
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="searchValue" className={styles.label}>
              {getSearchTypeLabel()}
              <span className={styles.required}> *</span>
            </label>
            <div className={styles.searchInputWrapper}>
              <input
                id="searchValue"
                type="text"
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  setMessage('');
                }}
                placeholder={getPlaceholder()}
                className={styles.input}
                disabled={loading}
                autoComplete="off"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => setSearchValue('')}
                  className={styles.clearBtn}
                  title="مسح"
                  disabled={loading}
                >
                  ✕
                </button>
              )}
              <button
                type="submit"
                className={styles.searchBtnIcon}
                disabled={loading}
                title="بحث"
              >
                {loading ? (
                  <span className={styles.searchSpinner}></span>
                ) : (
                  '🔍'
                )}
              </button>
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.searchBtn}
              disabled={loading || !searchValue.trim()}
            >
              {loading ? (
                <>
                  <span className={styles.btnSpinner}></span>
                  جاري البحث...
                </>
              ) : (
                <>
                  <span className={styles.btnIcon}>🔍</span>
                  بحث
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => {
                setSearchValue('');
                setMessage('');
              }}
              className={styles.resetBtn}
              disabled={loading}
            >
              ✕ مسح
            </button>
          </div>
        </form>

        {message && (
          <div className={`${styles.message} ${styles[messageType]}`}>
            <div className={styles.messageContent}>
              <span className={styles.messageIcon}>
                {messageType === 'success' ? '✓' : 
                 messageType === 'error' ? '✗' : 
                 '⚠️'}
              </span>
              <span className={styles.messageText}>{message}</span>
            </div>
            <button
              onClick={() => setMessage('')}
              className={styles.messageClose}
              title="إغلاق"
            >
              ✕
            </button>
          </div>
        )}

        <div className={styles.searchTips}>
          <h4 className={styles.tipsTitle}>نصائح للبحث:</h4>
          <ul className={styles.tipsList}>
            <li className={styles.tipItem}>• تأكد من صحة البريد الإلكتروني</li>
            <li className={styles.tipItem}>• أدخل رقم الهاتف بدون مسافات</li>
            <li className={styles.tipItem}>• يمكنك استخدام البريد أو رقم الهاتف فقط</li>
          </ul>
        </div>
      </div>
    </div>
  );
};