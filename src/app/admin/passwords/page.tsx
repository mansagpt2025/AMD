'use client';

import { useState, useEffect } from 'react';
import { changePassword, searchUser } from './actions';
import './styles.css';

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  grade: string;
  role: string;
}

export default function PasswordsPage() {
  const [formData, setFormData] = useState({
    identifier: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    calculatePasswordStrength(formData.newPassword);
  }, [formData.newPassword]);

  function calculatePasswordStrength(password: string) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    setPasswordStrength(strength);
  }

  async function handleSearch() {
    if (!formData.identifier.trim()) {
      setError('الرجاء إدخال بريد إلكتروني أو رقم هاتف للبحث');
      return;
    }

    setSearching(true);
    setError('');
    setSearchResults([]);
    setSelectedUser(null);

    try {
      const result = await searchUser(formData.identifier);
      if (result.error) {
        setError(result.error);
      } else if (result.data && result.data.length > 0) {
        setSearchResults(result.data);
        if (result.data.length === 1) {
          handleSelectUser(result.data[0]);
        }
      } else {
        setError('لم يتم العثور على مستخدم بهذه البيانات');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  function handleSelectUser(user: User) {
    setSelectedUser(user);
    setFormData(prev => ({
      ...prev,
      identifier: user.email
    }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // التحقق من صحة البيانات
    if (!selectedUser) {
      setError('الرجاء اختيار مستخدم أولاً');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      setLoading(false);
      return;
    }

    if (passwordStrength < 2) {
      setError('كلمة المرور ضعيفة. يجب أن تحتوي على 8 أحرف على الأقل وتشمل أحرف كبيرة وأرقام');
      setLoading(false);
      return;
    }

    try {
      const result = await changePassword({
        identifier: selectedUser.email,
        newPassword: formData.newPassword,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('تم تغيير كلمة المرور بنجاح');
        setFormData({
          identifier: '',
          newPassword: '',
          confirmPassword: '',
        });
        setSelectedUser(null);
        setSearchResults([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getStrengthText() {
    switch (passwordStrength) {
      case 0:
      case 1:
        return 'ضعيفة';
      case 2:
      case 3:
        return 'متوسطة';
      case 4:
        return 'قوية';
      default:
        return '';
    }
  }

  function getStrengthClass() {
    switch (passwordStrength) {
      case 0:
      case 1:
        return 'strength-weak';
      case 2:
      case 3:
        return 'strength-medium';
      case 4:
        return 'strength-strong';
      default:
        return '';
    }
  }

  return (
    <div className="passwords-container">
      <div className="passwords-card">
        <div className="header-section">
          <h1>تغيير كلمات المرور</h1>
          <p>يمكنك تغيير كلمة مرور أي مستخدم عن طريق البريد الإلكتروني أو رقم الهاتف</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="change-form">
          <div className="form-group">
            <label htmlFor="identifier">البريد الإلكتروني أو رقم الهاتف</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                id="identifier"
                className="form-control"
                placeholder="أدخل البريد الإلكتروني أو رقم الهاتف للبحث"
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleSearch}
                className="submit-btn"
                style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
                disabled={searching}
              >
                {searching ? 'جاري البحث...' : 'بحث'}
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="results-section">
              <div className="results-header">
                <h3>نتائج البحث:</h3>
                <span>{searchResults.length} مستخدم</span>
              </div>
              <div className="search-results">
                {searchResults.map((user) => (
                  <div key={user.id} className="user-card">
                    <div className="user-info">
                      <div className="user-name">{user.full_name}</div>
                      <div className="user-details">
                        <span>{user.email}</span>
                        <span>{user.phone}</span>
                        <span className={`user-role role-${user.role}`}>
                          {user.role === 'student' ? 'طالب' : 
                           user.role === 'admin' ? 'مدير' : 'معلم'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelectUser(user)}
                      className="select-btn"
                    >
                      {selectedUser?.id === user.id ? 'محدد' : 'اختيار'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedUser && (
            <>
              <div className="form-group">
                <label htmlFor="newPassword">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  id="newPassword"
                  className="form-control"
                  placeholder="أدخل كلمة المرور الجديدة"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  required
                />
                <div className="password-strength">
                  <div className={`strength-bar ${getStrengthClass()}`}></div>
                </div>
                <div className="password-hints">
                  <strong>قوة كلمة المرور: {getStrengthText()}</strong>
                  <ul>
                    <li>يجب أن تكون 8 أحرف على الأقل</li>
                    <li>يجب أن تحتوي على حرف كبير على الأقل</li>
                    <li>يجب أن تحتوي على رقم على الأقل</li>
                    <li>يجب أن تحتوي على رمز خاص على الأقل</li>
                  </ul>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="form-control"
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <div className="selected-user-info">
                <h4>المستخدم المحدد:</h4>
                <p><strong>الاسم:</strong> {selectedUser.full_name}</p>
                <p><strong>البريد الإلكتروني:</strong> {selectedUser.email}</p>
                <p><strong>رقم الهاتف:</strong> {selectedUser.phone}</p>
                <p><strong>الدور:</strong> {selectedUser.role}</p>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
              </button>
            </>
          )}
        </div>

        <div className="security-note">
          <h4>ملاحظات أمنية مهمة:</h4>
          <ul>
            <li>يجب أن تكون كلمة المرور الجديدة قوية وتحتوي على مزيج من الأحرف والأرقام والرموز</li>
            <li>سيتم إرسال بريد إلكتروني إلى المستخدم بإشعار تغيير كلمة المرور</li>
            <li>سيتعين على المستخدم تسجيل الدخول بكلمة المرور الجديدة في المرة القادمة</li>
            <li>يتم تسجيل جميع عمليات تغيير كلمة المرور في سجل النظام</li>
          </ul>
        </div>
      </div>
    </div>
  );
}