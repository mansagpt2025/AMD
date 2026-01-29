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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');

  // تحميل البيانات مباشرة (Server Actions تتحقق من المستخدم)
  useEffect(() => {
    loadData();
  }, [currentPage]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [notificationsResult, countResult] = await Promise.all([
        getUserNotifications(currentPage, 15),
        getUnreadCount()
      ]);

      if (notificationsResult.error) {
        if (notificationsResult.error.includes('غير مصرح')) {
          router.replace('/login?redirect=/notifications');
          return;
        }
        throw new Error(notificationsResult.error);
      }
      
      setNotifications(notificationsResult.data);
      setTotalPages(notificationsResult.totalPages);
      setUnreadCount(countResult.count);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...notifications];
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(n => !n.is_read);
        break;
      case 'read':
        filtered = filtered.filter(n => n.is_read);
        break;
    }
    setFilteredNotifications(filtered);
  }, [notifications, filter]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await markAsRead(notificationId);
      if (result.error) throw new Error(result.error);
      
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
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

  const handleDelete = async (notificationId: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    
    try {
      const result = await deleteNotification(notificationId);
      if (result.error) throw new Error(result.error);
      
      const deleted = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (deleted && !deleted.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      showSuccess('تم الحذف بنجاح');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      info: 'معلومات',
      success: 'نجاح',
      warning: 'تحذير'
    };
    return labels[type] || type;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return date.toLocaleDateString('ar-SA');
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success': return 'type-success';
      case 'warning': return 'type-warning';
      default: return 'type-info';
    }
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="notifications-skeleton">
        <button onClick={handleBackToDashboard} className="btn-back-dashboard">
          <span>←</span> العودة للوحة التحكم
        </button>
        <div className="skeleton-header"></div>
        <div className="skeleton-filters"></div>
        {[1,2,3].map(i => (
          <div key={i} className="skeleton-card"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="notifications-page">
      {/* زر العودة للوحة التحكم */}
      <button onClick={handleBackToDashboard} className="btn-back-dashboard">
        <span>←</span> العودة للوحة التحكم
      </button>
      
      <div className="notifications-container">
        {/* Toast Notifications */}
        <div className="toast-container">
          {error && (
            <div className="toast toast-error">
              <i className="icon-error">⚠️</i>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="toast toast-success">
              <i className="icon-success">✓</i>
              <span>{success}</span>
            </div>
          )}
        </div>

        {/* Header */}
        <header className="page-header">
          <div className="header-content">
            <h1 className="page-title">
              <span className="title-icon">🔔</span>
              إشعاراتي
            </h1>
            <div className="header-stats">
              <div className="stat-badge">
                <span className="stat-number">{notifications.length}</span>
                <span className="stat-label">الكل</span>
              </div>
              <div className="stat-badge unread-badge">
                <span className="stat-number">{unreadCount}</span>
                <span className="stat-label">غير مقروء</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleMarkAllAsRead}
            className={`btn-mark-all ${markingAll ? 'loading' : ''}`}
            disabled={unreadCount === 0 || markingAll}
          >
            {markingAll ? (
              <span className="spinner"></span>
            ) : (
              <>
                <span className="btn-icon">✓✓</span>
                تحديد الكل كمقروء
              </>
            )}
          </button>
        </header>

        {/* Filters */}
        <div className="filters-bar">
          {(['all', 'unread', 'read'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`filter-chip ${filter === f ? 'active' : ''}`}
            >
              <span className="chip-label">
                {f === 'all' ? 'الكل' : f === 'unread' ? 'غير مقروء' : 'مقروء'}
              </span>
              <span className="chip-count">
                {f === 'all' ? notifications.length : 
                 f === 'unread' ? unreadCount : 
                 notifications.length - unreadCount}
              </span>
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="notifications-list">
          {filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>لا توجد إشعارات</h3>
              <p>
                {filter === 'unread' ? 'لا توجد إشعارات جديدة غير مقروءة' :
                 filter === 'read' ? 'لم تقرأ أي إشعارات بعد' :
                 'سيتم إشعارك هنا عند وجود مستجدات'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification, index) => (
              <article 
                key={notification.id} 
                className={`notification-card ${!notification.is_read ? 'unread' : ''} ${getTypeStyles(notification.type)}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {!notification.is_read && <div className="unread-indicator"></div>}
                
                <div className="card-header">
                  <div className="type-badge">
                    {getTypeLabel(notification.type)}
                  </div>
                  {!notification.is_read && (
                    <span className="new-badge">جديد</span>
                  )}
                </div>

                <h3 className="card-title">{notification.title}</h3>
                <p className="card-message">{notification.message}</p>

                <footer className="card-footer">
                  <div className="meta-info">
                    <time className="time-badge">
                      <span className="meta-icon">🕐</span>
                      {getTimeAgo(notification.created_at)}
                    </time>
                    {notification.target_grade && (
                      <span className="target-badge">
                        <span className="meta-icon">🎓</span>
                        الصف {notification.target_grade}
                      </span>
                    )}
                  </div>

                  <div className="card-actions">
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="btn-action btn-read"
                        title="تحديد كمقروء"
                      >
                        <span>✓</span>
                        مقروء
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="btn-action btn-delete"
                      title="حذف"
                    >
                      <span>🗑</span>
                    </button>
                  </div>
                </footer>
              </article>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="pagination">
            <button
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
              className="page-btn"
            >
              السابق
            </button>
            <span className="page-info">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages}
              className="page-btn"
            >
              التالي
            </button>
          </nav>
        )}

        {/* Refresh Button */}
        <button onClick={loadData} className="btn-refresh" title="تحديث">
          <span className={`refresh-icon ${loading ? 'spin' : ''}`}>↻</span>
        </button>
      </div>
    </div>
  );
}