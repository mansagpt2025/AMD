'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  getUsers, 
  getGrades, 
  getSections, 
  sendNotification, 
  getNotifications, 
  deleteNotification, 
  markAsRead,
  getNotificationStats 
} from './actions';
import './styles.css';

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  grade: string;
  section: string | null;
  role: string;
}

interface Grade {
  id: number;
  name: string;
  slug: string;
}

interface Section {
  value: string;
  label: string;
}

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

interface Stats {
  total: number;
  read: number;
  unread: number;
  typeStats: {
    info: number;
    success: number;
    warning: number;
  };
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning',
    targetType: 'all' as 'all' | 'user' | 'grade' | 'section',
    targetUserId: '',
    targetGrade: '',
    targetSection: '',
  });

  const [users, setUsers] = useState<User[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<Stats | null>(null);

const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // تحميل البيانات الأولية
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        const [usersData, gradesData, sectionsData, notificationsData, statsData] = await Promise.all([
          getUsers(),
          getGrades(),
          getSections(),
          getNotifications(1, 10),
          getNotificationStats()
        ]);

        if (usersData.error) throw new Error(usersData.error);
        if (gradesData.error) throw new Error(gradesData.error);
        if (sectionsData.error) throw new Error(sectionsData.error);
        if (notificationsData.error) throw new Error(notificationsData.error);
        if (statsData.error) throw new Error(statsData.error);

        setUsers(usersData.data || []);
        setGrades(gradesData.data || []);
        setSections(sectionsData.data || []);
        setNotifications(notificationsData.data || []);
        setTotalPages(notificationsData.totalPages || 1);
        setStats(statsData.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // تحديث المستخدمين المصفاة عند تغيير الصف أو القسم
  useEffect(() => {
    if (formData.targetGrade || formData.targetSection) {
      const filtered = users.filter(user => {
        if (formData.targetGrade && user.grade !== formData.targetGrade) return false;
        if (formData.targetSection && user.section !== formData.targetSection) return false;
        return true;
      });
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [formData.targetGrade, formData.targetSection, users]);

  // تحميل الإشعارات عند تغيير الصفحة
  useEffect(() => {
    loadNotifications(currentPage);
  }, [currentPage]);

  const loadNotifications = async (page: number) => {
    try {
      const result = await getNotifications(page, 10);
      if (result.error) throw new Error(result.error);
      
      setNotifications(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // التحقق من البيانات
      if (!formData.title.trim()) {
        throw new Error('الرجاء إدخال عنوان الإشعار');
      }

      if (!formData.message.trim()) {
        throw new Error('الرجاء إدخال نص الإشعار');
      }

      if (formData.targetType === 'user' && !formData.targetUserId) {
        throw new Error('الرجاء اختيار مستخدم');
      }

      if (formData.targetType === 'grade' && !formData.targetGrade) {
        throw new Error('الرجاء اختيار صف');
      }

      if (formData.targetType === 'section' && !formData.targetSection) {
        throw new Error('الرجاء اختيار قسم');
      }

      // إرسال الإشعار
      const result = await sendNotification(formData);
      
      if (result.error) {
        throw new Error(result.error);
      }

      setSuccess(result.message || 'تم إرسال الإشعار بنجاح');
      
      // إعادة تعيين النموذج
      setFormData({
        title: '',
        message: '',
        type: 'info',
        targetType: 'all',
        targetUserId: '',
        targetGrade: '',
        targetSection: '',
      });

      // تحديث الإحصائيات والقائمة
      const [notificationsData, statsData] = await Promise.all([
        getNotifications(1, 10),
        getNotificationStats()
      ]);

      if (notificationsData.error) throw new Error(notificationsData.error);
      if (statsData.error) throw new Error(statsData.error);

      setNotifications(notificationsData.data || []);
      setCurrentPage(1);
      setStats(statsData.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإشعار؟')) return;

    const result = await deleteNotification(id);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('تم حذف الإشعار بنجاح');
      
      // تحديث القائمة والإحصائيات
      const [notificationsData, statsData] = await Promise.all([
        getNotifications(currentPage, 10),
        getNotificationStats()
      ]);

      if (notificationsData.error) throw new Error(notificationsData.error);
      if (statsData.error) throw new Error(statsData.error);

      setNotifications(notificationsData.data || []);
      setStats(statsData.data);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    const result = await markAsRead(id);
    if (result.error) {
      setError(result.error);
    } else {
      // تحديث القائمة والإحصائيات
      const [notificationsData, statsData] = await Promise.all([
        getNotifications(currentPage, 10),
        getNotificationStats()
      ]);

      if (notificationsData.error) throw new Error(notificationsData.error);
      if (statsData.error) throw new Error(statsData.error);

      setNotifications(notificationsData.data || []);
      setStats(statsData.data);
    }
  };

  const getTargetLabel = (notification: Notification) => {
    if (notification.target_grade && notification.target_section) {
      const grade = grades.find(g => g.slug === notification.target_grade);
      const section = sections.find(s => s.value === notification.target_section);
      return `${grade?.name || notification.target_grade} - ${section?.label || notification.target_section}`;
    } else if (notification.target_grade) {
      const grade = grades.find(g => g.slug === notification.target_grade);
      return `صف ${grade?.name || notification.target_grade}`;
    } else if (notification.target_section) {
      const section = sections.find(s => s.value === notification.target_section);
      return `قسم ${section?.label || notification.target_section}`;
    } else if (notification.user_id) {
      return 'مستخدم محدد';
    } else {
      return 'جميع المستخدمين';
    }
  };

  if (loading && !stats) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>جاري تحميل البيانات...</p>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="notifications-card">
        <div className="header-section">
          <h1>إرسال الإشعارات</h1>
          <div className="stats">
            <span className="page-info">
              الصفحة {currentPage} من {totalPages}
            </span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* إحصائيات الإشعارات */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon icon-total">
                <i className="fas fa-bell"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">إجمالي الإشعارات</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon icon-read">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.read}</span>
                <span className="stat-label">مقروءة</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon icon-unread">
                <i className="fas fa-envelope"></i>
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.unread}</span>
                <span className="stat-label">غير مقروءة</span>
              </div>
            </div>
          </div>
        )}

        {/* نموذج إرسال الإشعار */}
        <form onSubmit={handleSubmit} className="send-form">
          <h3>إنشاء إشعار جديد</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">عنوان الإشعار</label>
              <input
                type="text"
                id="title"
                className="form-control"
                placeholder="أدخل عنوان الإشعار"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">نوع الإشعار</label>
              <select
                id="type"
                className="form-control"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              >
                <option value="info">معلومات</option>
                <option value="success">نجاح</option>
                <option value="warning">تحذير</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="message">نص الإشعار</label>
            <textarea
              id="message"
              className="form-control"
              placeholder="أدخل نص الإشعار هنا..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>نوع الإرسال</label>
            <div className="target-type-selector">
              <button
                type="button"
                className={`target-type-btn ${formData.targetType === 'all' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, targetType: 'all', targetUserId: '', targetGrade: '', targetSection: '' })}
              >
                <i className="fas fa-users"></i> جميع المستخدمين
              </button>
              <button
                type="button"
                className={`target-type-btn ${formData.targetType === 'user' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, targetType: 'user', targetGrade: '', targetSection: '' })}
              >
                <i className="fas fa-user"></i> مستخدم محدد
              </button>
              <button
                type="button"
                className={`target-type-btn ${formData.targetType === 'grade' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, targetType: 'grade', targetUserId: '', targetSection: '' })}
              >
                <i className="fas fa-graduation-cap"></i> صف معين
              </button>
              <button
                type="button"
                className={`target-type-btn ${formData.targetType === 'section' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, targetType: 'section', targetUserId: '', targetGrade: '' })}
              >
                <i className="fas fa-layer-group"></i> قسم معين
              </button>
            </div>
          </div>

          {/* تفاصيل المستهدف */}
          {formData.targetType === 'user' && (
            <div className="target-details">
              <div className="form-group">
                <label htmlFor="targetUser">اختر المستخدم</label>
                <select
                  id="targetUser"
                  className="form-control"
                  value={formData.targetUserId}
                  onChange={(e) => setFormData({ ...formData, targetUserId: e.target.value })}
                  required
                >
                  <option value="">اختر مستخدم</option>
                  {filteredUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} - {user.email} ({user.grade})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {formData.targetType === 'grade' && (
            <div className="target-details">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="targetGrade">اختر الصف</label>
                  <select
                    id="targetGrade"
                    className="form-control"
                    value={formData.targetGrade}
                    onChange={(e) => setFormData({ ...formData, targetGrade: e.target.value })}
                    required
                  >
                    <option value="">اختر صف</option>
                    {grades.map((grade) => (
                      <option key={grade.id} value={grade.slug}>
                        {grade.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {formData.targetType === 'section' && (
            <div className="target-details">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="targetSection">اختر القسم</label>
                  <select
                    id="targetSection"
                    className="form-control"
                    value={formData.targetSection}
                    onChange={(e) => setFormData({ ...formData, targetSection: e.target.value })}
                    required
                  >
                    <option value="">اختر قسم</option>
                    {sections.map((section) => (
                      <option key={section.value} value={section.value}>
                        {section.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* معاينة الإشعار */}
          {(formData.title || formData.message) && (
            <div className="preview-card">
              <h4>معاينة الإشعار</h4>
              <div className="preview-content">
                {formData.title && (
                  <div className="preview-title">{formData.title}</div>
                )}
                {formData.message && (
                  <div className="preview-message">{formData.message}</div>
                )}
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#718096' }}>
                  <strong>المستهدف:</strong> {
                    formData.targetType === 'all' ? 'جميع المستخدمين' :
                    formData.targetType === 'user' ? 'مستخدم محدد' :
                    formData.targetType === 'grade' ? `صف ${grades.find(g => g.slug === formData.targetGrade)?.name || formData.targetGrade}` :
                    formData.targetType === 'section' ? `قسم ${sections.find(s => s.value === formData.targetSection)?.label || formData.targetSection}` :
                    'غير محدد'
                  }
                </div>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={submitting || !formData.title.trim() || !formData.message.trim()}
          >
            {submitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                جاري الإرسال...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i>
                إرسال الإشعار
              </>
            )}
          </button>
        </form>

        {/* قائمة الإشعارات المرسلة */}
        <div className="notifications-list">
          <div className="notifications-header">
            <h3>الإشعارات المرسلة</h3>
          </div>

          <div className="notifications-grid">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <p>لا توجد إشعارات مرسلة</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-card ${notification.type} ${!notification.is_read ? 'unread' : ''}`}
                >
                  <div className="notification-header">
                    <div className="notification-title">
                      {notification.title}
                      <span className={`notification-type type-${notification.type}`}>
                        {notification.type === 'info' ? 'معلومات' :
                         notification.type === 'success' ? 'نجاح' : 'تحذير'}
                      </span>
                    </div>
                    <div className="notification-actions">
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="action-btn read"
                          title="تحديد كمقروء"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="action-btn delete"
                        title="حذف"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>

                  <div className="notification-message">
                    {notification.message}
                  </div>

                  <div className="notification-footer">
                    <div className="notification-target">
                      <span className="target-badge">
                        {getTargetLabel(notification)}
                      </span>
                      <span className="target-badge">
                        <i className="fas fa-clock"></i> {new Date(notification.created_at).toLocaleDateString('ar-SA')}
                      </span>
                      {!notification.is_read && (
                        <span className="target-badge" style={{ background: '#fed7d7', color: '#742a2a' }}>
                          غير مقروء
                        </span>
                      )}
                    </div>
                  </div>
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
    </div>
  );
}