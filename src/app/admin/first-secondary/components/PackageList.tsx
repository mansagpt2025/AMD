'use client';

import { useState } from 'react';
import Image from 'next/image';
import { deletePackage, updatePackage } from '../actions';
import type { Database } from '@/types/supabase';
import styles from './PackageList.module.css';

type Package = Database['public']['Tables']['packages']['Row'];

interface PackageListProps {
  packages: Package[];
  onSelect: (pkg: Package) => void;
  onUpdate: () => void;
}

export function PackageList({ packages, onSelect, onUpdate }: PackageListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Package>>({});

  const handleEdit = (pkg: Package) => {
    setEditingId(pkg.id);
    setEditForm({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price,
      image_url: pkg.image_url
    });
  };

  const handleSave = async (id: string) => {
    try {
      // تحويل القيم الفارغة إلى null
      const dataToSend = {
        name: editForm.name || '',
        description: editForm.description || null,
        price: editForm.price || 0,
        image_url: editForm.image_url || null
      };
      
      await updatePackage(id, dataToSend);
      setEditingId(null);
      onUpdate();
      alert('تم تحديث الباقة بنجاح!');
    } catch (error) {
      console.error('Error updating package:', error);
      alert('حدث خطأ أثناء تحديث الباقة');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الباقة؟')) {
      try {
        await deletePackage(id);
        onUpdate();
        alert('تم حذف الباقة بنجاح!');
      } catch (error) {
        console.error('Error deleting package:', error);
        alert('حدث خطأ أثناء حذف الباقة');
      }
    }
  };

  if (packages.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📦</div>
        <h3>لا توجد باقات</h3>
        <p>ابدأ بإنشاء أول باقة للصف الأول الثانوي</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {packages.map(pkg => (
        <div key={pkg.id} className={styles.card}>
          {editingId === pkg.id ? (
            <div className={styles.editForm}>
              <input
                type="text"
                value={editForm.name || ''}
                onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="اسم الباقة"
                className={styles.editInput}
              />
              <input
                type="number"
                value={editForm.price || 0}
                onChange={e => setEditForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                placeholder="السعر"
                className={styles.editInput}
              />
              <textarea
                value={editForm.description || ''}
                onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="الوصف"
                className={styles.editTextarea}
                rows={3}
              />
              <input
                type="text"
                value={editForm.image_url || ''}
                onChange={e => setEditForm(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="رابط الصورة"
                className={styles.editInput}
              />
              <div className={styles.editActions}>
                <button 
                  onClick={() => handleSave(pkg.id)}
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
                {pkg.image_url ? (
                  <div className={styles.imageContainer}>
                    <Image
                      src={pkg.image_url}
                      alt={pkg.name}
                      width={200}
                      height={120}
                      className={styles.image}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className={styles.imageFallback}>
                      <span>📦</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.imageFallback}>
                    <span>📦</span>
                  </div>
                )}
              </div>
              
              <div className={styles.cardBody}>
                <h3 className={styles.packageName}>{pkg.name}</h3>
                <p className={styles.packageDescription}>
                  {pkg.description || 'لا يوجد وصف'}
                </p>
                <div className={styles.packagePrice}>
                  <span className={styles.price}>{pkg.price.toLocaleString()}</span>
                  <span className={styles.currency}>جنيه</span>
                </div>
                <div className={styles.meta}>
                  <span className={styles.date}>
                    {new Date(pkg.created_at).toLocaleDateString('ar-EG')}
                  </span>
                  <span className={`${styles.status} ${pkg.is_active ? styles.active : styles.inactive}`}>
                    {pkg.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
              </div>
              
              <div className={styles.cardActions}>
                <button 
                  onClick={() => onSelect(pkg)}
                  className={styles.viewButton}
                  title="عرض محاضرات الباقة"
                >
                  👁️ المحاضرات
                </button>
                <button 
                  onClick={() => handleEdit(pkg)}
                  className={styles.editButton}
                  title="تعديل الباقة"
                >
                  ✏️ تعديل
                </button>
                <button 
                  onClick={() => handleDelete(pkg.id)}
                  className={styles.deleteButton}
                  title="حذف الباقة"
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