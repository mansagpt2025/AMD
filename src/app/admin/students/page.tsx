'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  getStudents,
  getVideoViews,
  getExamResults,
  getLoginHistory,
  getPurchases,
  getCodeUsage,
  getGrades,
  getOverallStats
} from './actions';
import './styles.css';

type TabType = 'students' | 'videos' | 'exams' | 'logins' | 'purchases' | 'codes';

interface Student {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  grade: string;
  section: string | null;
  created_at: string;
  stats: {
    videoViews: number;
    examResults: number;
    userPackages: number;
    usedCodes: number;
  };
}

interface Grade {
  id: number;
  name: string;
  slug: string;
}

interface Stats {
  totalStudents: number;
  totalVideoViews: number;
  totalExams: number;
  totalPurchases: number;
  totalCodesUsed: number;
}

export default function StudentsManagementPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('students');
  const [error, setError] = useState('');
  
  // بيانات التصفية
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // البيانات
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  
  // بيانات الجداول
  const [videoViews, setVideoViews] = useState<any[]>([]);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [codeUsage, setCodeUsage] = useState<any[]>([]);
  
  // الترقيم
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // تحميل البيانات الأولية
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        const [studentsData, gradesData, statsData] = await Promise.all([
          getStudents(),
          getGrades(),
          getOverallStats()
        ]);

        if (studentsData.error) throw new Error(studentsData.error);
        if (gradesData.error) throw new Error(gradesData.error);
        if (statsData.error) throw new Error(statsData.error);

        setStudents(studentsData.data || []);
        setGrades(gradesData.data || []);
        setStats(statsData.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // تحميل بيانات الجداول عند تغيير التبويب أو الفلاتر
  useEffect(() => {
    if (activeTab !== 'students') {
      loadTabData();
    }
  }, [activeTab, selectedStudent, selectedGrade, currentPage]);

  const loadTabData = async () => {
    setLoading(true);
    try {
      let result;
      
      switch (activeTab) {
        case 'videos':
          result = await getVideoViews(selectedStudent || undefined, selectedGrade || undefined, currentPage, 10);
          if (result.error) throw new Error(result.error);
          setVideoViews(result.data || []);
          setTotalPages(result.totalPages);
          break;
          
        case 'exams':
          result = await getExamResults(selectedStudent || undefined, selectedGrade || undefined, currentPage, 10);
          if (result.error) throw new Error(result.error);
          setExamResults(result.data || []);
          setTotalPages(result.totalPages);
          break;
          
        case 'logins':
          result = await getLoginHistory(selectedStudent || undefined, selectedGrade || undefined, currentPage, 10);
          if (result.error) throw new Error(result.error);
          setLoginHistory(result.data || []);
          setTotalPages(result.totalPages);
          break;
          
        case 'purchases':
          result = await getPurchases(selectedStudent || undefined, selectedGrade || undefined, currentPage, 10);
          if (result.error) throw new Error(result.error);
          setPurchases(result.data || []);
          setTotalPages(result.totalPages);
          break;
          
        case 'codes':
          result = await getCodeUsage(selectedStudent || undefined, selectedGrade || undefined, currentPage, 10);
          if (result.error) throw new Error(result.error);
          setCodeUsage(result.data || []);
          setTotalPages(result.totalPages);
          break;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const result = await getStudents(searchTerm, selectedGrade);
      if (result.error) throw new Error(result.error);
      setStudents(result.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = (term: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setSearchTerm(term);
      handleSearch();
    }, 500);
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudent(studentId);
    setActiveTab('videos'); // التبديل إلى أول تبويب
  };

  const handleClearFilters = () => {
    setSelectedStudent('');
    setSelectedGrade('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const getGradeName = (gradeSlug: string) => {
    const grade = grades.find(g => g.slug === gradeSlug);
    return grade?.name || gradeSlug;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStudentsTab = () => (
    <div className="student-list">
      {students.length === 0 ? (
        <div className="no-data">
          <p>لا توجد بيانات للطلاب</p>
        </div>
      ) : (
        students.map((student) => (
          <div key={student.id} className="student-card">
            <div className="student-header">
              <div className="student-name">{student.full_name}</div>
              <span className="student-grade">{getGradeName(student.grade)}</span>
            </div>
            
            <div className="student-details">
              <div className="detail-item">
                <i className="fas fa-envelope"></i>
                <span>{student.email}</span>
              </div>
              <div className="detail-item">
                <i className="fas fa-phone"></i>
                <span>{student.phone}</span>
              </div>
              <div className="detail-item">
                <i className="fas fa-calendar"></i>
                <span>مسجل منذ: {formatDate(student.created_at)}</span>
              </div>
            </div>
            
            <div className="student-stats">
              <div className="stat-item">
                <span className="stat-number">{student.stats.videoViews}</span>
                <span className="stat-label">مشاهدة</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{student.stats.examResults}</span>
                <span className="stat-label">امتحان</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{student.stats.userPackages}</span>
                <span className="stat-label">شراء</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{student.stats.usedCodes}</span>
                <span className="stat-label">كود</span>
              </div>
            </div>
            
            <button
              onClick={() => handleSelectStudent(student.id)}
              className="select-student-btn"
            >
              <i className="fas fa-eye"></i>
              عرض سجلات الطالب
            </button>
          </div>
        ))
      )}
    </div>
  );

  const renderVideoViewsTab = () => (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>الطالب</th>
            <th>المحتوى</th>
            <th>عدد المشاهدات</th>
            <th>آخر مشاهدة</th>
            <th>التحكم</th>
          </tr>
        </thead>
        <tbody>
          {videoViews.length === 0 ? (
            <tr>
              <td colSpan={5} className="no-data">
                <p>لا توجد سجلات للمشاهدة</p>
              </td>
            </tr>
          ) : (
            videoViews.map((record) => (
              <tr key={record.id}>
                <td>
                  <div>{record.profiles?.full_name || 'غير محدد'}</div>
                  <small>{record.profiles?.email || ''}</small>
                </td>
                <td>
                  <div>{record.lecture_contents?.title || 'غير محدد'}</div>
                  <small className="badge badge-info">{record.lecture_contents?.type || 'غير معروف'}</small>
                </td>
                <td>
                  <span className="badge badge-purple">{record.watch_count || 0}</span>
                </td>
                <td>{record.last_watched_at ? formatDate(record.last_watched_at) : 'لم يشاهد'}</td>
                <td>
                  <button className="action-btn view">
                    <i className="fas fa-eye"></i>
                    تفاصيل
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderExamsTab = () => (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>الطالب</th>
            <th>الامتحان</th>
            <th>الدرجة</th>
            <th>النسبة</th>
            <th>التاريخ</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          {examResults.length === 0 ? (
            <tr>
              <td colSpan={6} className="no-data">
                <p>لا توجد سجلات للامتحانات</p>
              </td>
            </tr>
          ) : (
            examResults.map((record) => {
              const passScore = record.lecture_contents?.pass_score || 70;
              const percentage = Math.round((record.score / (record.total_questions || 100)) * 100);
              const passed = percentage >= passScore;
              
              return (
                <tr key={record.id}>
                  <td>
                    <div>{record.profiles?.full_name || 'غير محدد'}</div>
                    <small>{record.profiles?.grade || ''}</small>
                  </td>
                  <td>{record.lecture_contents?.title || 'غير محدد'}</td>
                  <td>
                    <span className={`badge ${passed ? 'badge-success' : 'badge-warning'}`}>
                      {record.score}/{record.total_questions || '?'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${passed ? 'badge-success' : 'badge-warning'}`}>
                      {percentage}%
                    </span>
                  </td>
                  <td>{formatDate(record.completed_at)}</td>
                  <td>
                    <span className={`badge ${passed ? 'badge-success' : 'badge-warning'}`}>
                      {passed ? 'ناجح' : 'راسب'}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  const renderLoginsTab = () => (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>الطالب</th>
            <th>البريد الإلكتروني</th>
            <th>الصف</th>
            <th>آخر تسجيل دخول</th>
            <th>تاريخ التسجيل</th>
          </tr>
        </thead>
        <tbody>
          {loginHistory.length === 0 ? (
            <tr>
              <td colSpan={5} className="no-data">
                <p>لا توجد سجلات لتسجيل الدخول</p>
              </td>
            </tr>
          ) : (
            loginHistory.map((record) => (
              <tr key={record.id}>
                <td>{record.full_name}</td>
                <td>{record.email}</td>
                <td>
                  <span className="badge badge-purple">{getGradeName(record.grade)}</span>
                </td>
                <td>
                  {record.last_sign_in_at ? (
                    <span className="badge badge-success">
                      {formatDate(record.last_sign_in_at)}
                    </span>
                  ) : (
                    <span className="badge badge-warning">لم يسجل دخول</span>
                  )}
                </td>
                <td>{formatDate(record.created_at)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderPurchasesTab = () => (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>الطالب</th>
            <th>الباقة</th>
            <th>النوع</th>
            <th>السعر</th>
            <th>تاريخ الشراء</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          {purchases.length === 0 ? (
            <tr>
              <td colSpan={6} className="no-data">
                <p>لا توجد سجلات للشراء</p>
              </td>
            </tr>
          ) : (
            purchases.map((record) => (
              <tr key={record.id}>
                <td>
                  <div>{record.profiles?.full_name || 'غير محدد'}</div>
                  <small>{record.profiles?.email || ''}</small>
                </td>
                <td>{record.packages?.name || 'غير محدد'}</td>
                <td>
                  <span className="badge badge-info">{record.packages?.type || 'غير معروف'}</span>
                </td>
                <td>
                  <span className="badge badge-success">{record.packages?.price || 0} جنيه</span>
                </td>
                <td>{formatDate(record.purchased_at)}</td>
                <td>
                  <span className={`badge ${record.is_active ? 'badge-success' : 'badge-warning'}`}>
                    {record.is_active ? 'نشط' : 'منتهي'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderCodesTab = () => (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>الطالب</th>
            <th>الكود</th>
            <th>الباقة</th>
            <th>تاريخ الاستخدام</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          {codeUsage.length === 0 ? (
            <tr>
              <td colSpan={5} className="no-data">
                <p>لا توجد سجلات لاستخدام الأكواد</p>
              </td>
            </tr>
          ) : (
            codeUsage.map((record) => (
              <tr key={record.id}>
                <td>
                  <div>{record.profiles?.full_name || 'غير محدد'}</div>
                  <small>{record.profiles?.email || ''}</small>
                </td>
                <td>
                  <code style={{ fontFamily: 'monospace', background: '#f7fafc', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                    {record.code}
                  </code>
                </td>
                <td>
                  <div>{record.packages?.name || 'غير محدد'}</div>
                  <small className="badge badge-info">{record.packages?.type || 'غير معروف'}</small>
                </td>
                <td>{record.used_at ? formatDate(record.used_at) : 'غير محدد'}</td>
                <td>
                  <span className="badge badge-success">مستخدم</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  if (loading && !stats) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className="students-container">
      <div className="students-card">
        <div className="header-section">
          <h1>إدارة الطلاب</h1>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* إحصائيات سريعة */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon icon-students">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalStudents}</span>
                <span className="stat-label">إجمالي الطلاب</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon icon-video">
                <i className="fas fa-play-circle"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalVideoViews}</span>
                <span className="stat-label">مشاهدة فيديو</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon icon-exam">
                <i className="fas fa-graduation-cap"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalExams}</span>
                <span className="stat-label">امتحان منجز</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon icon-purchase">
                <i className="fas fa-shopping-cart"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalPurchases}</span>
                <span className="stat-label">شراء محاضرات</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon icon-code">
                <i className="fas fa-code"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalCodesUsed}</span>
                <span className="stat-label">كود مستخدم</span>
              </div>
            </div>
          </div>
        )}

        {/* فلاتر البحث */}
        <div className="filters-section">
          <h3>فلترة البيانات</h3>
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="search">بحث عن طالب</label>
              <input
                type="text"
                id="search"
                className="filter-control"
                placeholder="ابحث بالاسم، البريد، أو الهاتف..."
                value={searchTerm}
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label htmlFor="grade">الصف</label>
              <select
                id="grade"
                className="filter-control"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
              >
                <option value="">جميع الصفوف</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.slug}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="student">الطالب</label>
              <select
                id="student"
                className="filter-control"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                disabled={activeTab === 'students'}
              >
                <option value="">جميع الطلاب</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} - {getGradeName(student.grade)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              onClick={handleClearFilters}
              className="apply-btn"
              style={{ background: '#718096' }}
            >
              <i className="fas fa-times"></i>
              مسح الفلاتر
            </button>
            <button
              onClick={handleSearch}
              className="apply-btn"
            >
              <i className="fas fa-search"></i>
              تطبيق البحث
            </button>
          </div>
        </div>

        {/* علامات التبويب */}
        <div className="tabs-section">
          <div className="tabs-header">
            <button
              className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              <i className="fas fa-users"></i>
              قائمة الطلاب
            </button>
            <button
              className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
              onClick={() => setActiveTab('videos')}
            >
              <i className="fas fa-play-circle"></i>
              سجل المشاهدة
            </button>
            <button
              className={`tab-btn ${activeTab === 'exams' ? 'active' : ''}`}
              onClick={() => setActiveTab('exams')}
            >
              <i className="fas fa-graduation-cap"></i>
              سجل الدرجات
            </button>
            <button
              className={`tab-btn ${activeTab === 'logins' ? 'active' : ''}`}
              onClick={() => setActiveTab('logins')}
            >
              <i className="fas fa-sign-in-alt"></i>
              سجل الدخول
            </button>
            <button
              className={`tab-btn ${activeTab === 'purchases' ? 'active' : ''}`}
              onClick={() => setActiveTab('purchases')}
            >
              <i className="fas fa-shopping-cart"></i>
              سجل الشراء
            </button>
            <button
              className={`tab-btn ${activeTab === 'codes' ? 'active' : ''}`}
              onClick={() => setActiveTab('codes')}
            >
              <i className="fas fa-code"></i>
              سجل الأكواد
            </button>
          </div>

          <div className="tab-content">
            {loading ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p>جاري تحميل البيانات...</p>
              </div>
            ) : (
              <>
                {activeTab === 'students' && renderStudentsTab()}
                {activeTab === 'videos' && renderVideoViewsTab()}
                {activeTab === 'exams' && renderExamsTab()}
                {activeTab === 'logins' && renderLoginsTab()}
                {activeTab === 'purchases' && renderPurchasesTab()}
                {activeTab === 'codes' && renderCodesTab()}
              </>
            )}
          </div>
        </div>

        {/* الترقيم (للجداول فقط) */}
        {activeTab !== 'students' && totalPages > 1 && (
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