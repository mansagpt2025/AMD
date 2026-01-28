'use client';

import { useState, useEffect, useRef } from 'react';
import { getPackages, getGrades, createCode, getCodes, deleteCode } from './actions';
import './styles.css';

interface Package {
  id: string;
  name: string;
  description?: string;
  grade: string;
  type: string;
  price: number;
  duration_days: number;
  lecture_count: number;
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
  const [allPackages, setAllPackages] = useState<Package[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [codes, setCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'used' | 'unused'>('all');

  const [formData, setFormData] = useState({
    package_id: '',
    grade: '',
    expires_at: '',
  });

const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // دالة لتحميل جميع الباقات
  const loadAllPackages = async () => {
    try {
      const result = await getPackages();
      if (result.error) throw new Error(result.error);
      setAllPackages(result.data || []);
    } catch (err: any) {
      console.error('Error loading packages:', err);
    }
  };

  // دالة لتحميل الأكواد مع التصفية
  const loadCodes = async (page: number) => {
    setLoading(true);
    try {
      const result = await getCodes(page, 10);
      if (result.error) throw new Error(result.error);
      
      let filteredCodes = result.data || [];
      
      // تطبيق فلتر البحث
      if (searchTerm) {
        filteredCodes = filteredCodes.filter((code: Code) =>
          code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          code.packages?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (code.profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (code.profiles?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // تطبيق فلتر الحالة
      if (statusFilter !== 'all') {
        filteredCodes = filteredCodes.filter((code: Code) => 
          statusFilter === 'used' ? code.is_used : !code.is_used
        );
      }
      
      setCodes(filteredCodes);
      setTotalPages(result.totalPages || 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // دالة debounce مخصصة
  const debouncedSearch = (term: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setSearchTerm(term);
      setCurrentPage(1);
      loadCodes(1);
    }, 500);
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const [gradesData] = await Promise.all([
          getGrades(),
          loadAllPackages()
        ]);

        if (gradesData.error) throw new Error(gradesData.error);
        setGrades(gradesData.data || []);
        
        // تحديد الصف الأول كافتراضي إذا كان موجوداً
        if (gradesData.data && gradesData.data.length > 0) {
          const firstGrade = gradesData.data[0].slug;
          setFormData(prev => ({ ...prev, grade: firstGrade }));
          
          // تصفية الباقات حسب الصف الأول
          const filtered = allPackages.filter(pkg => pkg.grade === firstGrade);
          setFilteredPackages(filtered);
        }
        
        await loadCodes(currentPage);
      } catch (err: any) {
        setError(err.message);
      }
    };
    
    initialize();
  }, []); // مصفوفة dependencies فارغة - تعمل مرة واحدة عند التحميل

  useEffect(() => {
    loadCodes(currentPage);
  }, [currentPage]); // تعمل عند تغيير currentPage

  // تحديث الباقات المصفاة عند تغيير الصف
  useEffect(() => {
    if (formData.grade) {
      const filtered = allPackages.filter(pkg => pkg.grade === formData.grade);
      setFilteredPackages(filtered);
      // إعادة تعيين الباقة المختارة
      setFormData(prev => ({ ...prev, package_id: '' }));
    }
  }, [formData.grade, allPackages]); // تعمل عند تغيير formData.grade أو allPackages

  useEffect(() => {
    // Cleanup timeout على unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // مصفوفة dependencies فارغة - تعمل مرة واحدة عند التحميل والتنظيف عند unmount

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
        setFormData({ package_id: '', grade: formData.grade, expires_at: '' });
        loadCodes(currentPage);
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
      loadCodes(currentPage);
    }
  }

  function handleGradeChange(selectedGrade: string) {
    setFormData({
      package_id: '',
      grade: selectedGrade,
      expires_at: formData.expires_at
    });
  }

  if (loading && codes.length === 0) {
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
              <label htmlFor="grade">الصف</label>
              <select
                id="grade"
                className="form-control"
                value={formData.grade}
                onChange={(e) => handleGradeChange(e.target.value)}
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
              <label htmlFor="package">الباقة</label>
              <select
                id="package"
                className="form-control"
                value={formData.package_id}
                onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
                required
                disabled={!formData.grade || filteredPackages.length === 0}
              >
                <option value="">
                  {!formData.grade 
                    ? 'اختر الصف أولاً' 
                    : filteredPackages.length === 0 
                      ? 'لا توجد باقات لهذا الصف' 
                      : 'اختر الباقة'}
                </option>
                {filteredPackages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} - {pkg.type} (${pkg.price}) - {pkg.lecture_count} محاضرة
                  </option>
                ))}
              </select>
              {formData.grade && filteredPackages.length === 0 && (
                <small style={{ color: '#e53e3e', marginTop: '0.5rem', display: 'block' }}>
                  لا توجد باقات متاحة لهذا الصف
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="expires_at">تاريخ الانتهاء (اختياري)</label>
              <input
                type="date"
                id="expires_at"
                className="form-control"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={submitting || !formData.package_id || !formData.grade}
          >
            {submitting ? 'جاري الإنشاء...' : 'إنشاء الكود'}
          </button>
        </form>

        <div className="filters-section">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="search">بحث</label>
              <input
                type="text"
                id="search"
                className="form-control"
                placeholder="ابحث عن كود، باقة، أو مستخدم..."
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="status">الحالة</label>
              <select
                id="status"
                className="form-control"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
              >
                <option value="all">جميع الحالات</option>
                <option value="unused">غير مستخدم</option>
                <option value="used">مستخدم</option>
              </select>
            </div>
          </div>
        </div>

        <div className="codes-grid">
          {codes.length === 0 ? (
            <div className="no-results">
              <p>لا توجد أكواد لعرضها</p>
            </div>
          ) : (
            codes.map((code) => (
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
                    <span className="detail-label">النوع:</span>
                    <span className="detail-value">{code.packages?.type || 'غير محدد'}</span>
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
            ))
          )}
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