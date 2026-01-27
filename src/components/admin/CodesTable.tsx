'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { codesService } from '../../services/codesService';
import styles from './CodesTable.module.css';

interface Code {
  id: string;
  code: string;
  package_id?: string;
  grade: string;
  is_used: boolean;
  used_by?: string | null;
  created_at: string;
  used_at?: string | null;
  packages?: { 
    id: string; 
    name: string; 
    type: string;
    duration_days?: number;
  }[];
  profiles?: { 
    id: string;
    full_name: string; 
    email: string;
    phone?: string;
  }[];
}

interface Stats {
  total: number;
  used: number;
  unused: number;
}

interface CodesTableProps {
  refreshTrigger?: number;
  onError?: (errorMessage: string) => void;
}

export const CodesTable: React.FC<CodesTableProps> = ({ 
  refreshTrigger, 
  onError 
}) => {
  const [codes, setCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'used' | 'unused'>('all');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCodes, setTotalCodes] = useState(0);
  const [stats, setStats] = useState<Stats>({ total: 0, used: 0, unused: 0 });
  const [selectedCode, setSelectedCode] = useState<Code | null>(null);

  const itemsPerPage = 10;

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      let fetchedCodes: any[] = [];
      let fetchedTotal = 0;
      
      if (searchQuery.trim()) {
        fetchedCodes = await codesService.searchCodes(searchQuery.trim());
        fetchedTotal = fetchedCodes.length;
      } else {
        const offset = (currentPage - 1) * itemsPerPage;
        const response = await codesService.getAllCodes(itemsPerPage, offset);
        
        if (Array.isArray(response)) {
          fetchedCodes = response;
          fetchedTotal = response.length;
        } else {
          fetchedCodes = response.data || [];
          fetchedTotal = response.total || fetchedCodes.length;
        }
      }

      const formattedCodes: Code[] = fetchedCodes.map((item: any) => ({
        id: item.id || '',
        code: item.code || '',
        package_id: item.package_id,
        grade: item.grade || '',
        is_used: item.is_used !== undefined ? item.is_used : !!item.used_at,
        used_by: item.used_by,
        created_at: item.created_at || new Date().toISOString(),
        used_at: item.used_at,
        packages: Array.isArray(item.packages) ? item.packages : 
                 (item.package_name ? [{ 
                   id: item.package_id, 
                   name: item.package_name, 
                   type: item.package_type || '',
                   duration_days: item.duration_days 
                 }] : []),
        profiles: Array.isArray(item.profiles) ? item.profiles : 
                 (item.used_by ? [{ 
                   id: item.used_by,
                   full_name: item.user_name || '',
                   email: item.user_email || '',
                   phone: item.user_phone || ''
                 }] : [])
      }));

      setCodes(formattedCodes);
      setTotalCodes(fetchedTotal);
    } catch (error) {
      const errorMsg = 'خطأ في جلب الأكواد: ' + (error instanceof Error ? error.message : 'خطأ غير معروف');
      console.error('Error fetching codes:', error);
      onError?.(errorMsg);
      setCodes([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage, itemsPerPage, onError]);

  const fetchStats = useCallback(async () => {
    try {
      const statistics = await codesService.getCodeStatistics();
      setStats(statistics);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
    fetchStats();
  }, [fetchCodes, fetchStats, refreshTrigger]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        setCurrentPage(1);
        fetchCodes();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchCodes]);

  const handleDeleteCode = async (codeId: string, codeValue: string) => {
    if (!confirm(`هل تريد حذف الكود ${codeValue}؟\nهذا الإجراء لا يمكن التراجع عنه.`)) {
      return;
    }

    try {
      await codesService.deleteCode(codeId);
      onError?.(`✓ تم حذف الكود ${codeValue} بنجاح`);
      fetchCodes();
      fetchStats();
    } catch (error) {
      const errorMsg = 'خطأ في حذف الكود: ' + (error instanceof Error ? error.message : 'خطأ غير معروف');
      onError?.(errorMsg);
      console.error('Error deleting code:', error);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const getGradeLabel = useCallback((grade: string): string => {
    const gradeMap: Record<string, string> = {
      'first': 'الصف الأول',
      'second': 'الصف الثاني',
      'third': 'الصف الثالث',
      'الأول': 'الصف الأول',
      'الثاني': 'الصف الثاني',
      'الثالث': 'الصف الثالث',
    };
    return gradeMap[grade] || grade;
  }, []);

  const getPackageTypes = useMemo(() => {
    const types = new Set<string>();
    codes.forEach(code => {
      if (code.packages?.[0]?.type) {
        types.add(code.packages[0].type);
      }
    });
    return Array.from(types);
  }, [codes]);

  const filteredCodes = useMemo(() => {
    let filtered = [...codes];

    if (filterStatus === 'used') {
      filtered = filtered.filter(code => code.is_used || code.used_at);
    } else if (filterStatus === 'unused') {
      filtered = filtered.filter(code => !code.is_used && !code.used_at);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(code => 
        code.packages?.[0]?.type === filterType
      );
    }

    return filtered;
  }, [codes, filterStatus, filterType]);

  const totalPages = Math.ceil(totalCodes / itemsPerPage);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  // التصحيح: تصحيح سطر 426
  const isCodeUsed = (code: Code) => {
    return code.is_used || !!code.used_at;
  };

  return (
    <div className={styles.container}>
      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>إجمالي الأكواد</p>
            <p className={styles.statValue}>{stats.total.toLocaleString()}</p>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.used}`}>
          <div className={styles.statIcon}>✓</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>أكواد مستخدمة</p>
            <p className={styles.statValue}>{stats.used.toLocaleString()}</p>
            <p className={styles.statPercentage}>
              {stats.total > 0 ? ((stats.used / stats.total) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.unused}`}>
          <div className={styles.statIcon}>⏳</div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>أكواد متاحة</p>
            <p className={styles.statValue}>{stats.unused.toLocaleString()}</p>
            <p className={styles.statPercentage}>
              {stats.total > 0 ? ((stats.unused / stats.total) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className={styles.controlsSection}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="ابحث عن كود أو مستخدم..."
            value={searchQuery}
            onChange={handleSearch}
            className={styles.searchInput}
            disabled={loading}
          />
          <span className={styles.searchIcon}>🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={styles.clearSearchBtn}
              title="مسح البحث"
              disabled={loading}
            >
              ✕
            </button>
          )}
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.filterButtons}>
            <button
              className={`${styles.filterBtn} ${filterStatus === 'all' ? styles.active : ''}`}
              onClick={() => {
                setFilterStatus('all');
                setCurrentPage(1);
              }}
              disabled={loading}
            >
              الكل
            </button>
            <button
              className={`${styles.filterBtn} ${filterStatus === 'unused' ? styles.active : ''}`}
              onClick={() => {
                setFilterStatus('unused');
                setCurrentPage(1);
              }}
              disabled={loading}
            >
              غير مستخدم
            </button>
            <button
              className={`${styles.filterBtn} ${filterStatus === 'used' ? styles.active : ''}`}
              onClick={() => {
                setFilterStatus('used');
                setCurrentPage(1);
              }}
              disabled={loading}
            >
              مستخدم
            </button>
          </div>

          {getPackageTypes.length > 0 && (
            <div className={styles.typeFilter}>
              <label className={styles.filterLabel}>نوع الباقة:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={styles.typeSelect}
                disabled={loading}
              >
                <option value="all">الكل</option>
                {getPackageTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>جاري تحميل البيانات...</p>
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📭</div>
            <p>لا توجد أكواد</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={styles.clearEmptySearchBtn}
              >
                مسح البحث
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={styles.tableHeader}>
              <div className={styles.tableInfo}>
                عرض <strong>{filteredCodes.length}</strong> من <strong>{totalCodes}</strong> كود
              </div>
              <div className={styles.tableActions}>
                <button
                  className={styles.exportBtn}
                  onClick={() => {/* Implement export */}}
                  disabled={loading}
                >
                  📥 تصدير البيانات
                </button>
              </div>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>الكود</th>
                  <th>الباقة</th>
                  <th>النوع</th>
                  <th>الصف</th>
                  <th>الحالة</th>
                  <th>المستخدم</th>
                  <th>البريد</th>
                  <th>تاريخ الإنشاء</th>
                  <th>تاريخ الاستخدام</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredCodes.map((code) => (
                  <tr 
                    key={code.id} 
                    className={`${styles.tableRow} ${isCodeUsed(code) ? styles.usedRow : styles.unusedRow}`}
                    onClick={() => setSelectedCode(code)}
                  >
                    <td className={styles.codeCell}>
                      <span className={styles.codeBadge}>{code.code}</span>
                    </td>
                    <td>{code.packages?.[0]?.name || '-'}</td>
                    <td>
                      <span className={styles.typeBadge}>
                        {code.packages?.[0]?.type || '-'}
                      </span>
                    </td>
                    <td>{getGradeLabel(code.grade)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${isCodeUsed(code) ? styles.used : styles.unused}`}>
                        {isCodeUsed(code) ? 'مستخدم' : 'متاح'}
                        {code.used_at && <span className={styles.statusTime}> {formatDate(code.used_at)}</span>}
                      </span>
                    </td>
                    <td>{code.profiles?.[0]?.full_name || '-'}</td>
                    <td className={styles.email}>
                      {code.profiles?.[0]?.email || '-'}
                    </td>
                    <td className={styles.dateCell}>
                      {formatDate(code.created_at)}
                    </td>
                    <td className={styles.dateCell}>
                      {code.used_at ? formatDate(code.used_at) : '-'}
                    </td>
                    <td className={styles.actionsCell}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCode(code.id, code.code);
                        }}
                        className={styles.deleteBtn}
                        title="حذف الكود"
                        disabled={isCodeUsed(code)} // التصحيح هنا
                      >
                        🗑️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(code.code);
                          onError?.(`✓ تم نسخ الكود ${code.code}`);
                        }}
                        className={styles.copyBtn}
                        title="نسخ الكود"
                      >
                        📋
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && !searchQuery && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            صفحة {currentPage} من {totalPages}
          </div>
          <div className={styles.paginationControls}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || loading}
              className={styles.pageBtn}
            >
              ← السابق
            </button>

            <div className={styles.pageNumbers}>
              {(() => {
                const pages = [];
                const maxVisible = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                let endPage = Math.min(totalPages, startPage + maxVisible - 1);

                if (endPage - startPage + 1 < maxVisible) {
                  startPage = Math.max(1, endPage - maxVisible + 1);
                }

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`${styles.pageBtn} ${currentPage === i ? styles.active : ''}`}
                      disabled={loading}
                    >
                      {i}
                    </button>
                  );
                }
                return pages;
              })()}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || loading}
              className={styles.pageBtn}
            >
              التالي →
            </button>
          </div>
        </div>
      )}

      {/* Code Details Modal */}
      {selectedCode && (
        <div className={styles.modalOverlay} onClick={() => setSelectedCode(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>تفاصيل الكود</h3>
              <button 
                onClick={() => setSelectedCode(null)}
                className={styles.modalClose}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>الكود:</span>
                <span className={styles.detailValue}>{selectedCode.code}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>الباقة:</span>
                <span className={styles.detailValue}>{selectedCode.packages?.[0]?.name || '-'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>الصف:</span>
                <span className={styles.detailValue}>{getGradeLabel(selectedCode.grade)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>الحالة:</span>
                <span className={`${styles.detailValue} ${isCodeUsed(selectedCode) ? styles.used : styles.unused}`}>
                  {isCodeUsed(selectedCode) ? 'مستخدم' : 'متاح'}
                </span>
              </div>
              {selectedCode.used_at && selectedCode.profiles?.[0] && (
                <>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>المستخدم:</span>
                    <span className={styles.detailValue}>{selectedCode.profiles[0].full_name}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>البريد:</span>
                    <span className={styles.detailValue}>{selectedCode.profiles[0].email}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>تاريخ الاستخدام:</span>
                    <span className={styles.detailValue}>{formatDate(selectedCode.used_at)}</span>
                  </div>
                </>
              )}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>تاريخ الإنشاء:</span>
                <span className={styles.detailValue}>{formatDate(selectedCode.created_at)}</span>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedCode.code);
                  onError?.(`✓ تم نسخ الكود ${selectedCode.code}`);
                }}
                className={styles.modalCopyBtn}
              >
                📋 نسخ الكود
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};