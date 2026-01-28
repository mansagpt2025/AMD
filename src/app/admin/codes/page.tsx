'use client';

import { useState, useEffect } from 'react';
import { getPackages, getGrades, createCode, getCodes, deleteCode } from './actions';
import './styles.css';

interface Package {
  id: string;
  name: string;
  grade: string;
  type: string;
  price: number;
}

interface Grade {
  id: number;
  name: string;
  slug: string;
}

interface Code {
  id: string;
  code: string;
  package_id: string;
  grade: string;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  expires_at: string | null;
  packages: {
    name: string;
    grade: string;
    type: string;
  } | null;
  profiles: {
    full_name: string;
    email: string;
  } | null;
}

export default function CodesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [codes, setCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    package_id: '',
    grade: '',
    expires_at: '',
  });

  useEffect(() => {
    loadData();
  }, [currentPage]);

  async function loadData() {
    setLoading(true);
    try {
      const [packagesData, gradesData, codesData] = await Promise.all([
        getPackages(),
        getGrades(),
        getCodes(currentPage, 10),
      ]);

      if (packagesData.error) throw new Error(packagesData.error);
      if (gradesData.error) throw new Error(gradesData.error);
      if (codesData.error) throw new Error(codesData.error);

      setPackages(packagesData.data || []);
      setGrades(gradesData.data || []);
      setCodes(codesData.data || []);
      setTotalPages(codesData.totalPages || 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const result = await createCode(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('تم إنشاء الكود بنجاح!');
        setFormData({ package_id: '', grade: '', expires_at: '' });
        loadData();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الكود؟')) return;

    const result = await deleteCode(id);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('تم حذف الكود بنجاح');
      loadData();
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className="codes-container">
      <div className="codes-card">
        <div className="header-section">
          <h1>إدارة الأكواد</h1>
          <div className="stats">
            <span className="page-info">
              الصفحة {currentPage} من {totalPages}
            </span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="generate-form">
          <h3>إنشاء كود جديد</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="package">الباقة</label>
              <select
                id="package"
                className="form-control"
                value={formData.package_id}
                onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
                required
              >
                <option value="">اختر الباقة</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} - {pkg.type} (${pkg.price})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="grade">الصف</label>
              <select
                id="grade"
                className="form-control"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                required
              >
                <option value="">اختر الصف</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.slug}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="expires_at">تاريخ الانتهاء (اختياري)</label>
              <input
                type="date"
                id="expires_at"
                className="form-control"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'جاري الإنشاء...' : 'إنشاء الكود'}
          </button>
        </form>

        <div className="codes-grid">
          {codes.map((code) => (
            <div key={code.id} className={`code-card ${code.is_used ? 'used' : ''}`}>
              <div className="code-header">
                <span className="code-value">{code.code}</span>
                <span className={`code-status ${code.is_used ? 'status-used' : 'status-unused'}`}>
                  {code.is_used ? 'مستخدم' : 'غير مستخدم'}
                </span>
              </div>

              <div className="code-details">
                <div className="detail-item">
                  <span className="detail-label">الباقة:</span>
                  <span className="detail-value">{code.packages?.name || 'غير محدد'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">الصف:</span>
                  <span className="detail-value">{code.grade}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">تاريخ الإنشاء:</span>
                  <span className="detail-value">
                    {new Date(code.created_at).toLocaleDateString('ar-SA')}
                  </span>
                </div>
                {code.expires_at && (
                  <div className="detail-item">
                    <span className="detail-label">ينتهي في:</span>
                    <span className="detail-value">
                      {new Date(code.expires_at).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                )}
                {code.is_used && code.profiles && (
                  <>
                    <div className="detail-item">
                      <span className="detail-label">المستخدم:</span>
                      <span className="detail-value">{code.profiles.full_name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">البريد:</span>
                      <span className="detail-value">{code.profiles.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">تاريخ الاستخدام:</span>
                      <span className="detail-value">
                        {code.used_at ? new Date(code.used_at).toLocaleDateString('ar-SA') : '-'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {!code.is_used && (
                <button
                  onClick={() => handleDelete(code.id)}
                  className="delete-btn"
                >
                  حذف الكود
                </button>
              )}
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              السابق
            </button>
            <span className="page-info">
              الصفحة {currentPage} من {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  );
}