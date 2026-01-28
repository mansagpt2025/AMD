'use client';

import { useState } from 'react';
import { deleteContent, updateContent } from '../actions';
import type { Database } from '@/types/supabase';
import styles from './ContentList.module.css';

type ContentRow = Database['public']['Tables']['lecture_contents']['Row'];
type LectureRow = Database['public']['Tables']['lectures']['Row'];

type Content = ContentRow & {
  lectures?: LectureRow | null;
};

interface ContentListProps {
  contents: Content[];
  onUpdate: () => void;
}

export function ContentList({ contents, onUpdate }: ContentListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Content>>({});

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return '🎬';
      case 'pdf':
        return '📄';
      case 'exam':
        return '📝';
      case 'text':
        return '📖';
      default:
        return '📄';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'video':
        return 'فيديو';
      case 'pdf':
        return 'ملف PDF';
      case 'exam':
        return 'امتحان';
      case 'text':
        return 'نص';
      default:
        return type;
    }
  };

  const handleEdit = (content: Content) => {
    setEditingId(content.id);
    setEditForm({
      title: content.title,
      description: content.description,
      content_url: content.content_url,
      type: content.type,
      max_attempts: content.max_attempts,
      order_number: content.order_number,
      lecture_id: content.lecture_id,
    });
  };

  const handleSave = async (id: string) => {
    try {
      await updateContent(id, {
        title: editForm.title || '',
        description: editForm.description || null,
        content_url: editForm.content_url || null,
        type: (editForm.type as any) || 'video',
        max_attempts: editForm.max_attempts || 1,
        order_number: editForm.order_number || 0,
        lecture_id: editForm.lecture_id || '',
      });
      setEditingId(null);
      onUpdate();
      alert('تم تحديث المحتوى بنجاح!');
    } catch (error) {
      console.error('Error updating content:', error);
      alert('حدث خطأ أثناء تحديث المحتوى');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المحتوى؟')) {
      try {
        await deleteContent(id);
        onUpdate();
        alert('تم حذف المحتوى بنجاح!');
      } catch (error) {
        console.error('Error deleting content:', error);
        alert('حدث خطأ أثناء حذف المحتوى');
      }
    }
  };

  if (contents.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📄</div>
        <h3>لا يوجد محتوى</h3>
        <p>ابدأ بإنشاء أول محتوى</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {contents.map((content) => (
        <div key={content.id} className={styles.card}>
          {editingId === content.id ? (
            <div className={styles.editForm}>
              <select
                value={editForm.type || 'video'}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    type: e.target.value as any,
                  }))
                }
                className={styles.editInput}
              >
                <option value="video">فيديو</option>
                <option value="pdf">ملف PDF</option>
                <option value="exam">امتحان</option>
                <option value="text">نص</option>
              </select>

              <input
                type="text"
                value={editForm.title || ''}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="عنوان المحتوى"
                className={styles.editInput}
              />

              <input
                type="number"
                value={editForm.order_number || 0}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    order_number: Number(e.target.value),
                  }))
                }
                placeholder="الترتيب"
                className={styles.editInput}
              />

              {editForm.type === 'video' && (
                <input
                  type="number"
                  value={editForm.max_attempts || 1}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      max_attempts: Number(e.target.value),
                    }))
                  }
                  placeholder="عدد مرات المشاهدة"
                  className={styles.editInput}
                />
              )}

              <input
                type="text"
                value={editForm.content_url || ''}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    content_url: e.target.value,
                  }))
                }
                placeholder="رابط المحتوى"
                className={styles.editInput}
              />

              <textarea
                value={editForm.description || ''}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="الوصف"
                className={styles.editTextarea}
                rows={3}
              />

              <div className={styles.editActions}>
                <button
                  onClick={() => handleSave(content.id)}
                  className={styles.saveButton}
                >
                  حفظ
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className={styles.cancelButton}
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.cardHeader}>
                <div className={styles.contentType}>
                  <span className={styles.typeIcon}>
                    {getTypeIcon(content.type)}
                  </span>
                  <span className={styles.typeName}>
                    {getTypeName(content.type)}
                  </span>
                </div>
              </div>

              <div className={styles.cardBody}>
                <h3 className={styles.contentTitle}>{content.title}</h3>
                <p className={styles.contentDescription}>
                  {content.description || 'لا يوجد وصف'}
                </p>

                <div className={styles.contentMeta}>
                  <span className={styles.lectureName}>
                    المحاضرة: {content.lectures?.title ?? 'غير معروف'}
                  </span>
                  <span className={styles.orderNumber}>
                    الترتيب: {content.order_number}
                  </span>
                </div>

                {content.type === 'video' && (
                  <div className={styles.videoInfo}>
                    عدد مرات المشاهدة: {content.max_attempts}
                  </div>
                )}

                {content.content_url && (
                  <div className={styles.contentUrl}>
                    <a
                      href={content.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.urlLink}
                    >
                      🔗 رابط المحتوى
                    </a>
                  </div>
                )}

                <div className={styles.meta}>
                  <span className={styles.date}>
                    {new Date(content.created_at).toLocaleDateString('ar-EG')}
                  </span>
                  <span
                    className={`${styles.status} ${
                      content.is_active ? styles.active : styles.inactive
                    }`}
                  >
                    {content.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button
                  onClick={() => handleEdit(content)}
                  className={styles.editButton}
                >
                  ✏️ تعديل
                </button>
                <button
                  onClick={() => handleDelete(content.id)}
                  className={styles.deleteButton}
                >
                  🗑️ حذف
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
