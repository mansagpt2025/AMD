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
    try {
      const result = await deleteNotification(id);
      if (result.error) throw new Error(result.error);

      const deleted = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (deleted && !deleted.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
      showSuccess('تم الحذف بنجاح');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleBack = () => router.push('/dashboard');

  if (loading && notifications.length === 0) return <div>Loading...</div>;

  // -----------------------
  // Helper functions UI
  // -----------------------
  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'info': return 'معلومات';
      case 'success': return 'نجاح';
      case 'warning': return 'تنبيه';
      default: return '';
    }
  };
  const getTypeStyles = (type: string) => `type-${type}`;
  const getTimeAgo = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'لحظات';
    if (diff < 3600) return `${Math.floor(diff/60)} دقيقة`;
    if (diff < 86400) return `${Math.floor(diff/3600)} ساعة`;
    return `${Math.floor(diff/86400)} يوم`;
  };

  // -----------------------
  // UI
  // -----------------------
  return (
    <div className="notifications-page">
      <button onClick={handleBack} className="btn-back-dashboard">← العودة للوحة التحكم</button>

      <div className="notifications-container">
        <div className="toast-container">
          {error && <div className="toast toast-error">⚠️ {error}</div>}
          {success && <div className="toast toast-success">✓ {success}</div>}
        </div>

        <header className="page-header">
          <h1>🔔 إشعاراتي</h1>
          <div className="header-stats">
            <div>الكل: {notifications.length}</div>
            <div>غير مقروء: {unreadCount}</div>
          </div>

          <button 
            onClick={handleMarkAllAsRead} 
            disabled={unreadCount === 0 || markingAll}
          >
            {markingAll ? 'جارٍ...' : '✓✓ تحديد الكل كمقروء'}
          </button>
        </header>

        {/* Filters */}
        <div className="filters-bar">
          {(['all','unread','read'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? 'active' : ''}
            >
              {f === 'all' ? 'الكل' : f === 'unread' ? 'غير مقروء' : 'مقروء'}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="notifications-list">
          {filteredNotifications.length === 0 ? (
            <div className="empty-state">لا توجد إشعارات</div>
          ) : (
            filteredNotifications.map((n, idx) => (
              <div key={n.id} className={`notification-card ${!n.is_read ? 'unread' : ''} ${getTypeStyles(n.type)}`}>
                {!n.is_read && <span className="new-badge">جديد</span>}
                <h3>{n.title}</h3>
                <p>{n.message}</p>
                <small>{getTimeAgo(n.created_at)}</small>
                <div className="actions">
                  {!n.is_read && <button onClick={() => handleMarkAsRead(n.id)}>✓ مقروء</button>}
                  <button onClick={() => handleDelete(n.id)}>🗑 حذف</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button onClick={() => setCurrentPage(p=>p-1)} disabled={currentPage===1}>السابق</button>
            <span>{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p=>p+1)} disabled={currentPage===totalPages}>التالي</button>
          </div>
        )}

        <button onClick={loadData} className="btn-refresh">↻ تحديث</button>
      </div>
    </div>
  );
}
