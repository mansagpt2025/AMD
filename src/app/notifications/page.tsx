'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getUserNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} from './actions';
import './styles.css';

interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  is_read: boolean;
  created_at: string;
  target_grade: string | null;
  target_section: string | null;
}

type FilterType = 'all' | 'unread' | 'read';

export default function StudentNotificationsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentPage]);

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    setLoading(true);
    setError('');
    try {
      const [notificationsResult, countResult] = await Promise.all([
        getUserNotifications(currentPage, 15),
        getUnreadCount()
      ]);

      if (notificationsResult.error?.includes('غير مصرح')) {
        router.replace('/login?redirect=/notifications');
        return;
      }

      if (notificationsResult.error) throw new Error(notificationsResult.error);
      if (countResult.error) throw new Error(countResult.error);

      setNotifications(notificationsResult.data || []);
      setTotalPages(notificationsResult.totalPages || 1);
      setUnreadCount(countResult.count || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      if (showRefresh) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let filtered = [...notifications];
    if (filter === 'unread') filtered = filtered.filter(n => !n.is_read);
    if (filter === 'read') filtered = filtered.filter(n => n.is_read);
    setFilteredNotifications(filtered);
  }, [notifications, filter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const result = await markAsRead(id);
      if (result.error) throw new Error(result.error);

      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      showSuccess('تم التحديد كمقروء');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const result = await markAllAsRead();
      if (result.error) throw new Error(result.error);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      showSuccess('تم تحديد الكل كمقروء');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    setDeletingId(id);
    try {
      const result = await deleteNotification(id);
      if (result.error) throw new Error(result.error);

      const deleted = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (deleted && !deleted.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
      showSuccess('تم الحذف بنجاح');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleBack = () => router.push('/dashboard');

  // Helper functions UI
  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'info': return 'معلومات';
      case 'success': return 'نجاح';
      case 'warning': return 'تنبيه';
      default: return '';
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'info': return '💡';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      default: return '📌';
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'الآن';
    if (diff < 3600) return `${Math.floor(diff/60)} دقيقة`;
    if (diff < 86400) return `${Math.floor(diff/3600)} ساعة`;
    if (diff < 604800) return `${Math.floor(diff/86400)} يوم`;
    return new Date(dateStr).toLocaleDateString('ar-SA');
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="notifications-page">
        <div className="loading-container">
          <div className="spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      {/* Background Elements */}
      <div className="bg-gradient orb-1"></div>
      <div className="bg-gradient orb-2"></div>
      
      {/* Floating Back Button */}
      <button onClick={handleBack} className="btn-floating btn-back">
        <span className="icon">←</span>
        <span className="text">عودة</span>
      </button>

      {/* Toast Container */}
      <div className="toast-container">
        {error && (
          <div className="toast toast-error">
            <span className="toast-icon">⚠️</span>
            <span className="toast-message">{error}</span>
            <button className="toast-close" onClick={() => setError('')}>×</button>
          </div>
        )}
        {success && (
          <div className="toast toast-success">
            <span className="toast-icon">✓</span>
            <span className="toast-message">{success}</span>
            <button className="toast-close" onClick={() => setSuccess('')}>×</button>
          </div>
        )}
      </div>

      <div className="notifications-container">
        {/* Header Card */}
        <header className="glass-card header-card">
          <div className="header-content">
            <div className="title-section">
              <div className="icon-wrapper">
                <span className="bell-icon">🔔</span>
                {unreadCount > 0 && <span className="notification-pulse"></span>}
              </div>
              <div className="title-text">
                <h1>إشعاراتي</h1>
                <p className="subtitle">تابع آخر التحديثات والتنبيهات</p>
              </div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{notifications.length}</span>
                <span className="stat-label">الكل</span>
              </div>
              <div className="stat-item active">
                <span className="stat-value">{unreadCount}</span>
                <span className="stat-label">جديد</span>
                {unreadCount > 0 && <span className="stat-badge"></span>}
              </div>
            </div>
          </div>

          <button 
            className={`btn-primary btn-mark-all ${markingAll ? 'loading' : ''}`}
            onClick={handleMarkAllAsRead} 
            disabled={unreadCount === 0 || markingAll}
          >
            <span className="btn-icon">{markingAll ? '⏳' : '✓'}</span>
            <span className="btn-text">
              {markingAll ? 'جاري التحديث...' : 'تحديد الكل كمقروء'}
            </span>
          </button>
        </header>

        {/* Filter Bar */}
        <div className="filter-container">
          <div className="filter-scroll">
            {(['all','unread','read'] as FilterType[]).map((f, index) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`filter-chip ${filter === f ? 'active' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="chip-text">
                  {f === 'all' ? 'الكل' : f === 'unread' ? 'غير مقروء' : 'مقروء'}
                </span>
                {f === 'unread' && unreadCount > 0 && (
                  <span className="chip-badge">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="notifications-list">
          {filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>لا توجد إشعارات</h3>
              <p>ستظهر هنا الإشعارات الجديدة عند وصولها</p>
            </div>
          ) : (
            filteredNotifications.map((n, index) => (
              <div 
                key={n.id} 
                className={`notification-item ${!n.is_read ? 'unread' : ''} type-${n.type}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {!n.is_read && (
                  <div className="unread-indicator">
                    <span className="pulse-dot"></span>
                  </div>
                )}
                
                <div className="notification-content">
                  <div className="notification-header">
                    <div className="type-badge">
                      <span className="type-icon">{getTypeIcon(n.type)}</span>
                      <span className="type-label">{getTypeLabel(n.type)}</span>
                    </div>
                    <time className="timestamp">{getTimeAgo(n.created_at)}</time>
                  </div>
                  
                  <h3 className="notification-title">{n.title}</h3>
                  <p className="notification-message">{n.message}</p>
                  
                  <div className="notification-actions">
                    {!n.is_read && (
                      <button 
                        className="btn-action btn-read"
                        onClick={() => handleMarkAsRead(n.id)}
                      >
                        <span>✓</span>
                        <span>تحديد كمقروء</span>
                      </button>
                    )}
                    <button 
                      className={`btn-action btn-delete ${deletingId === n.id ? 'loading' : ''}`}
                      onClick={() => handleDelete(n.id)}
                      disabled={deletingId === n.id}
                    >
                      <span>{deletingId === n.id ? '⏳' : '🗑'}</span>
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(p => p - 1)} 
              disabled={currentPage === 1}
            >
              <span>←</span>
              <span>السابق</span>
            </button>
            
            <div className="pagination-info">
              <span className="current">{currentPage}</span>
              <span className="separator">من</span>
              <span className="total">{totalPages}</span>
            </div>
            
            <button 
              className="pagination-btn"
              onClick={() => setCurrentPage(p => p + 1)} 
              disabled={currentPage === totalPages}
            >
              <span>التالي</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* Floating Refresh Button */}
        <button 
          onClick={() => loadData(true)} 
          className={`btn-floating btn-refresh ${isRefreshing ? 'spinning' : ''}`}
          title="تحديث"
        >
          <span>↻</span>
        </button>
      </div>
    </div>
  );
}