'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [userId, setUserId] = useState<string | null>(null);

  // جلب ID المستخدم من localStorage أو session
  useEffect(() => {
    const fetchUserId = () => {
      // هنا يمكنك استخدام طريقة مناسبة لجلب ID المستخدم
      // مثلاً من context أو localStorage أو session
      const storedUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
      } else {
        // إذا لم يكن هناك ID، نقوم بإعادة التوجيه إلى صفحة تسجيل الدخول
        router.push('/login');
      }
    };

    fetchUserId();
  }, [router]);

  // تحميل الإشعارات والإحصائيات
  useEffect(() => {
    if (userId) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [userId, currentPage]);

  // تطبيق الفلتر
  useEffect(() => {
    let filtered = [...notifications];
    
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(notification => !notification.is_read);
        break;
      case 'read':
        filtered = filtered.filter(notification => notification.is_read);
        break;
      default:
        // 'all' - لا يتم تصفية أي شيء
        break;
    }
    
    setFilteredNotifications(filtered);
  }, [notifications, filter]);

  const loadNotifications = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const result = await getUserNotifications(userId, currentPage, 15);
      if (result.error) throw new Error(result.error);
      
      setNotifications(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!userId) return;
    
    try {
      const result = await getUnreadCount(userId);
      if (result.error) throw new Error(result.error);
      
      setUnreadCount(result.count);
    } catch (err: any) {
      console.error('Error loading unread count:', err);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!userId) return;
    
    try {
      const result = await markAsRead(userId, notificationId);
      if (result.error) throw new Error(result.error);
      
      // تحديث القائمة المحلية
      setNotifications(prev => prev.map(notification =>
        notification.id === notificationId 
          ? { ...notification, is_read: true }
          : notification
      ));
      
      // تحديث العداد
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      setSuccess('تم تحديد الإشعار كمقروء');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    
    setMarkingAll(true);
    try {
      const result = await markAllAsRead(userId);
      if (result.error) throw new Error(result.error);
      
      // تحديث جميع الإشعارات المحلية
      setNotifications(prev => prev.map(notification => ({
        ...notification,
        is_read: true
      })));
      
      // إعادة تعيين العداد
      setUnreadCount(0);
      
      setSuccess('تم تحديد جميع الإشعارات كمقروءة');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإشعار؟')) return;
    
    if (!userId) return;
    
    try {
      const result = await deleteNotification(userId, notificationId);
      if (result.error) throw new Error(result.error);
      
      // إزالة الإشعار من القائمة المحلية
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      
      // تحديث العداد إذا كان الإشعار غير مقروء
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      setSuccess('تم حذف الإشعار بنجاح');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    loadNotifications();
    loadUnreadCount();
    setSuccess('تم تحديث الإشعارات');
    setTimeout(() => setSuccess(''), 2000);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'info': return 'معلومات';
      case 'success': return 'نجاح';
      case 'warning': return 'تحذير';
      default: return type;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `منذ ${diffMins} دقيقة`;
    } else if (diffHours < 24) {
      return `منذ ${diffHours} ساعة`;
    } else if (diffDays === 1) {
      return 'أمس';
    } else if (diffDays < 7) {
      return `منذ ${diffDays} أيام`;
    } else {
      return date.toLocaleDateString('ar-SA');
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>جاري تحميل الإشعارات...</p>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        {/* رسائل النجاح والخطأ */}
        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="success-message">
            <i className="fas fa-check-circle"></i>
            <span>{success}</span>
          </div>
        )}

        {/* الهيدر والإحصائيات */}
        <div className="header-section">
          <h1>إشعاراتي</h1>
          
          <div className="stats-card">
            <div className={`bell-icon ${unreadCount === 0 ? 'empty' : ''}`}>
              <i className="fas fa-bell"></i>
              {unreadCount > 0 && (
                <span className="unread-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </div>
            
            <div className="stats-info">
              <span className="stats-count">{notifications.length}</span>
              <span className="stats-label">إجمالي الإشعارات</span>
            </div>
            
            <button
              onClick={handleMarkAllAsRead}
              className="mark-all-btn"
              disabled={unreadCount === 0 || markingAll}
            >
              {markingAll ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  جاري التحديث...
                </>
              ) : (
                <>
                  <i className="fas fa-check-double"></i>
                  تحديد الكل كمقروء
                </>
              )}
            </button>
          </div>
        </div>

        {/* فلاتر التصفية */}
        <div className="filters-section">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <span className="count">{notifications.length}</span>
            جميع الإشعارات
          </button>
          
          <button
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            <span className="count">{unreadCount}</span>
            غير مقروء
            {unreadCount > 0 && <i className="fas fa-circle" style={{ color: '#fc8181', fontSize: '0.6rem' }}></i>}
          </button>
          
          <button
            className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            <span className="count">{notifications.length - unreadCount}</span>
            مقروء
          </button>
        </div>

        {/* قائمة الإشعارات */}
        <div className="notifications-list">
          {filteredNotifications.length === 0 ? (
            <div className="no-notifications">
              <div className="no-notifications-icon">
                <i className="fas fa-bell-slash"></i>
              </div>
              <h3>لا توجد إشعارات</h3>
              <p>{filter === 'unread' 
                ? 'لا توجد إشعارات غير مقروءة' 
                : filter === 'read' 
                ? 'لا توجد إشعارات مقروءة' 
                : 'لم تصلك أي إشعارات حتى الآن'}</p>
            </div>
          ) : (
            filteredNotifications.map((notification, index) => (
              <div 
                key={notification.id} 
                className={`notification-card ${notification.type} ${!notification.is_read ? 'unread' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="notification-header">
                  <h3 className="notification-title">
                    {notification.title}
                    {!notification.is_read && (
                      <span className="notification-badge badge-new">
                        <i className="fas fa-star"></i> جديد
                      </span>
                    )}
                    <span className={`notification-badge badge-${notification.type}`}>
                      {getTypeLabel(notification.type)}
                    </span>
                  </h3>
                </div>

                <div className="notification-content">
                  {notification.message}
                </div>

                <div className="notification-footer">
                  <div className="notification-meta">
                    <span className="meta-item">
                      <i className="fas fa-clock"></i>
                      {getTimeAgo(notification.created_at)}
                    </span>
                    
                    {notification.target_grade && (
                      <span className="meta-item">
                        <i className="fas fa-graduation-cap"></i>
                        للصف {notification.target_grade}
                      </span>
                    )}
                    
                    {notification.target_section && (
                      <span className="meta-item">
                        <i className="fas fa-layer-group"></i>
                        قسم {notification.target_section}
                      </span>
                    )}
                  </div>

                  <div className="notification-actions">
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="action-btn read"
                        title="تحديد كمقروء"
                      >
                        <i className="fas fa-check"></i>
                        مقروء
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="action-btn delete"
                      title="حذف"
                    >
                      <i className="fas fa-trash"></i>
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* الترقيم */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              <i className="fas fa-chevron-right"></i>
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
              <i className="fas fa-chevron-left"></i>
            </button>
          </div>
        )}

        {/* زر التحديث */}
        <button
          onClick={handleRefresh}
          className="refresh-btn"
          title="تحديث الإشعارات"
        >
          <i className="fas fa-sync-alt"></i>
        </button>
      </div>
    </div>
  );
}