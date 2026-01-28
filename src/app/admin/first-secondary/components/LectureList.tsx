'use client';

import { useState } from 'react';
import Image from 'next/image';
import { deleteLecture, updateLecture } from '../actions';
import type { Database } from '@/types/supabase';
import styles from './LectureList.module.css';

type LectureRow = Database['public']['Tables']['lectures']['Row'];

type Lecture = LectureRow & {
  packages?: {
    id?: string;
    name?: string;
  } | null;
};

interface LectureListProps {
  lectures: Lecture[];
  onSelect: (lecture: Lecture) => void;
  onUpdate: () => void;
}

export function LectureList({ lectures, onSelect, onUpdate }: LectureListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lecture>>({});

  const handleEdit = (lecture: Lecture) => {
    setEditingId(lecture.id);
    setEditForm({
      title: lecture.title,
      description: lecture.description,
      image_url: lecture.image_url,
      order_number: lecture.order_number,
      package_id: lecture.package_id,
    });
  };

  const handleSave = async (id: string) => {
    try {
      await updateLecture(id, {
        title: editForm.title || '',
        description: editForm.description || null,
        image_url: editForm.image_url || null,
        order_number: editForm.order_number || 0,
        package_id: editForm.package_id || '',
      });
      setEditingId(null);
      onUpdate();
      alert('تم تحديث المحاضرة بنجاح!');
    } catch (error) {
      console.error('Error updating lecture:', error);
      alert('حدث خطأ أثناء تحديث المحاضرة');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المحاضرة؟')) {
      try {
        await deleteLecture(id);
        onUpdate();
        alert('تم حذف المحاضرة بنجاح!');
      } catch (error) {
        console.error('Error deleting lecture:', error);
        alert('حدث خطأ أثناء حذف المحاضرة');
      }
    }
  };

  if (lectures.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📚</div>
        <h3>لا توجد محاضرات</h3>
        <p>ابدأ بإنشاء أول محاضرة</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {lectures.map((lecture) => (
        <div key={lecture.id} className={styles.card}>
          {editingId === lecture.id ? (
            <div className={styles.editForm}>
              <input
                type="text"
                value={editForm.title || ''}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="عنوان المحاضرة"
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

              <input
                type="text"
                value={editForm.image_url || ''}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    image_url: e.target.value,
                  }))
                }
                placeholder="رابط الصورة"
                className={styles.editInput}
              />

              <div className={styles.editActions}>
                <button
                  onClick={() => handleSave(lecture.id)}
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
                {lecture.image_url ? (
                  <div className={styles.imageContainer}>
                    <Image
                      src={lecture.image_url}
                      alt={lecture.title}
                      width={200}
                      height={120}
                      className={styles.image}
                    />
                  </div>
                ) : (
                  <div className={styles.imageFallback}>📚</div>
                )}
              </div>

              <div className={styles.cardBody}>
                <h3 className={styles.lectureTitle}>{lecture.title}</h3>
                <p className={styles.lectureDescription}>
                  {lecture.description || 'لا يوجد وصف'}
                </p>

                <div className={styles.lectureMeta}>
                  <span className={styles.packageName}>
                    الباقة: {lecture.packages?.name ?? 'غير معروف'}
                  </span>
                  <span className={styles.orderNumber}>
                    الترتيب: {lecture.order_number}
                  </span>
                </div>

                <div className={styles.meta}>
                  <span className={styles.date}>
                    {new Date(lecture.created_at).toLocaleDateString('ar-EG')}
                  </span>
                  <span
                    className={`${styles.status} ${
                      lecture.is_active ? styles.active : styles.inactive
                    }`}
                  >
                    {lecture.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button
                  onClick={() => onSelect(lecture)}
                  className={styles.viewButton}
                >
                  👁️ المحتوى
                </button>
                <button
                  onClick={() => handleEdit(lecture)}
                  className={styles.editButton}
                >
                  ✏️ تعديل
                </button>
                <button
                  onClick={() => handleDelete(lecture.id)}
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
