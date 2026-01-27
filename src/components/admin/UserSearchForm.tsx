import React, { useState } from 'react';
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
}

interface Props {
  onUserFound: (user: User) => void;
}

export const UserSearchForm: React.FC<Props> = ({ onUserFound }) => {
  const [searchType, setSearchType] = useState<'email' | 'phone'>('email');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchValue.trim()) {
      setMessage('يرجى إدخال البريد أو الهاتف');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      let user;
      if (searchType === 'email') {
        user = await passwordService.findUserByEmail(searchValue);
      } else {
        user = await passwordService.findUserByPhone(searchValue);
      }

      setMessage(`✓ تم العثور على المستخدم: ${user.full_name}`);
      setMessageType('success');
      onUserFound(user);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'حدث خطأ في البحث'
      );
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchCard}>
        <h2 className={styles.title}>البحث عن المستخدم</h2>

        <form onSubmit={handleSearch} className={styles.form}>
          <div className={styles.searchTypeGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                value="email"
                checked={searchType === 'email'}
                onChange={(e) => setSearchType(e.target.value as 'email')}
              />
              البحث بالبريد الإلكتروني
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                value="phone"
                checked={searchType === 'phone'}
                onChange={(e) => setSearchType(e.target.value as 'phone')}
              />
              البحث برقم الهاتف
            </label>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="searchValue" className={styles.label}>
              {searchType === 'email' ? 'البريد الإلكتروني' : 'رقم الهاتف'}
            </label>
            <input
              id="searchValue"
              type={searchType === 'email' ? 'email' : 'tel'}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchType === 'email' ? 'example@email.com' : '01234567890'}
              className={styles.input}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={styles.searchBtn}
            disabled={loading}
          >
            {loading ? 'جاري البحث...' : 'بحث'}
          </button>
        </form>

        {message && (
          <div className={`${styles.message} ${styles[messageType]}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};
