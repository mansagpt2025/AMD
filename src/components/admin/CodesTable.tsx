import React, { useState, useEffect } from 'react';
import { codesService } from '../../services/codesService';
import styles from './CodesTable.module.css';

interface Code {
  id: string;
  code: string;
  grade: string;
  is_used: boolean;
  created_at: string;
  used_at?: string;
  packages?: { name: string; type: string };
  profiles?: { full_name: string; email: string };
}

export const CodesTable: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger }) => {
  const [codes, setCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, used, unused
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCodes, setTotalCodes] = useState(0);
  const [stats, setStats] = useState({ total: 0, used: 0, unused: 0 });

  const itemsPerPage = 10;

  useEffect(() => {
    fetchCodes();
    fetchStats();
  }, [currentPage, filterStatus, refreshTrigger]);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      if (searchQuery) {
        const searchResults = await codesService.searchCodes(searchQuery);
        setCodes(searchResults);
        setTotalCodes(searchResults.length);
      } else if (filterStatus === 'used') {
        const usedCodes = await codesService.getUsedCodes();
        setCodes(usedCodes);
        setTotalCodes(usedCodes.length);
      } else if (filterStatus === 'unused') {
        const unusedCodes = await codesService.getUnusedCodes();
        setCodes(unusedCodes);
        setTotalCodes(unusedCodes.length);
      } else {
        const offset = (currentPage - 1) * itemsPerPage;
        const { data, total } = await codesService.getAllCodes(itemsPerPage, offset);
        setCodes(data);
        setTotalCodes(total || 0);
      }
    } catch (error) {
      console.error('Error fetching codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statistics = await codesService.getCodeStatistics();
      setStats(statistics);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    if (confirm('هل تريد حذف هذا الكود؟')) {
      try {
        await codesService.deleteCode(codeId);
        fetchCodes();
        fetchStats();
      } catch (error) {
        alert('خطأ في حذف الكود');
      }
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const getGradeLabel = (grade: string) => {
    const labels: { [key: string]: string } = {
      first: 'الأول',
      second: 'الثاني',
      third: 'الثالث',
    };
    return labels[grade] || grade;
  };

  const getStatusBadge = (isUsed: boolean) => {
    return isUsed ? 'مستخدم' : 'غير مستخدم';
  };

  const totalPages = Math.ceil(totalCodes / itemsPerPage);

  return (
    <div className={styles.container}>
      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>إجمالي الأكواد</p>
            <p className={styles.statValue}>{stats.total}</p>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.used}`}>
          <div className={styles.statIcon}>✓</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>أكواد مستخدمة</p>
            <p className={styles.statValue}>{stats.used}</p>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.unused}`}>
          <div className={styles.statIcon}>⏳</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>أكواد متاحة</p>
            <p className={styles.statValue}>{stats.unused}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={styles.controlsSection}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="ابحث عن كود..."
            value={searchQuery}
            onChange={handleSearch}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>

        <div className={styles.filterButtons}>
          <button
            className={`${styles.filterBtn} ${filterStatus === 'all' ? styles.active : ''}`}
            onClick={() => {
              setFilterStatus('all');
              setCurrentPage(1);
            }}
          >
            الكل
          </button>
          <button
            className={`${styles.filterBtn} ${filterStatus === 'unused' ? styles.active : ''}`}
            onClick={() => {
              setFilterStatus('unused');
              setCurrentPage(1);
            }}
          >
            غير مستخدم
          </button>
          <button
            className={`${styles.filterBtn} ${filterStatus === 'used' ? styles.active : ''}`}
            onClick={() => {
              setFilterStatus('used');
              setCurrentPage(1);
            }}
          >
            مستخدم
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>جاري تحميل البيانات...</p>
          </div>
        ) : codes.length === 0 ? (
          <div className={styles.emptyState}>
            <p>لا توجد أكواد</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>الكود</th>
                <th>الباقة</th>
                <th>النوع</th>
                <th>الصف</th>
                <th>الحالة</th>
                <th>اسم المستخدم</th>
                <th>البريد الإلكتروني</th>
                <th>تاريخ الإنشاء</th>
                <th>تاريخ الاستخدام</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <tr key={code.id} className={code.is_used ? styles.usedRow : ''}>
                  <td className={styles.codeCell}>
                    <span className={styles.codeBadge}>{code.code}</span>
                  </td>
                  <td>{code.packages?.name || '-'}</td>
                  <td>{code.packages?.type || '-'}</td>
                  <td>{getGradeLabel(code.grade)}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${code.is_used ? styles.used : styles.unused}`}>
                      {getStatusBadge(code.is_used)}
                    </span>
                  </td>
                  <td>{code.profiles?.full_name || '-'}</td>
                  <td className={styles.email}>{code.profiles?.email || '-'}</td>
                  <td>{new Date(code.created_at).toLocaleDateString('ar-EG')}</td>
                  <td>{code.used_at ? new Date(code.used_at).toLocaleDateString('ar-EG') : '-'}</td>
                  <td className={styles.actionsCell}>
                    <button
                      onClick={() => handleDeleteCode(code.id)}
                      className={styles.deleteBtn}
                      title="حذف"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && !searchQuery && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={styles.pageBtn}
          >
            ← السابق
          </button>

          <div className={styles.pageNumbers}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`${styles.pageBtn} ${currentPage === page ? styles.active : ''}`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={styles.pageBtn}
          >
            التالي →
          </button>
        </div>
      )}
    </div>
  );
};
