'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  getLectures,
  createLecture,
  updateLecture,
  deleteLecture,
  getContents,
  createContent,
  updateContent,
  deleteContent
} from './actions';

type Package = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  type: string;
  duration_days: number;
  is_active: boolean;
  created_at: string;
};

type Lecture = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  package_id: string;
  order_number: number;
  is_active: boolean;
  created_at: string;
  package?: { id: string; name: string };
};

type Content = {
  id: string;
  lecture_id: string;
  type: 'video' | 'pdf' | 'exam' | 'text';
  title: string;
  description: string | null;
  content_url: string | null;
  duration_minutes: number;
  order_number: number;
  is_active: boolean;
  max_attempts: number | null;
  pass_score: number | null;
  created_at: string;
  lecture?: { id: string; title: string; package_id: string };
};

export default function FirstSecondaryAdmin() {
  const [activeTab, setActiveTab] = useState<'packages' | 'lectures' | 'contents'>('packages');
  
  // Data states
  const [packages, setPackages] = useState<Package[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [selectedLectures, setSelectedLectures] = useState<string[]>([]);
  const [contentType, setContentType] = useState<'video' | 'pdf' | 'exam' | 'text'>('video');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === 'packages') {
        const data = await getPackages();
        setPackages(data);
      } else if (activeTab === 'lectures') {
        const data = await getLectures();
        setLectures(data);
      } else if (activeTab === 'contents') {
        const data = await getContents();
        setContents(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    
    try {
      if (activeTab === 'packages') {
        if (modalMode === 'create') {
          await createPackage(formData);
        } else if (editingId) {
          await updatePackage(editingId, formData);
        }
      } else if (activeTab === 'lectures') {
        formData.append('package_ids', JSON.stringify(selectedPackages));
        if (modalMode === 'create') {
          await createLecture(formData);
        } else if (editingId) {
          await updateLecture(editingId, formData);
        }
      } else if (activeTab === 'contents') {
        formData.append('lecture_ids', JSON.stringify(selectedLectures));
        if (modalMode === 'create') {
          await createContent(formData);
        } else if (editingId) {
          await updateContent(editingId, formData);
        }
      }
      
      closeModal();
      loadData();
      alert(modalMode === 'create' ? 'تم الإنشاء بنجاح' : 'تم التحديث بنجاح');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('حدث خطأ أثناء حفظ البيانات');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    
    try {
      if (activeTab === 'packages') {
        await deletePackage(id);
      } else if (activeTab === 'lectures') {
        await deleteLecture(id);
      } else if (activeTab === 'contents') {
        await deleteContent(id);
      }
      loadData();
      alert('تم الحذف بنجاح');
    } catch (error) {
      console.error('Error deleting:', error);
      alert('حدث خطأ أثناء الحذف');
    }
  }

  function openCreateModal() {
    setModalMode('create');
    setEditingId(null);
    setSelectedPackages([]);
    setSelectedLectures([]);
    setShowModal(true);
  }

  function openEditModal(item: Package | Lecture | Content) {
    setModalMode('edit');
    setEditingId(item.id);
    
    if (activeTab === 'lectures') {
      setSelectedPackages([(item as Lecture).package_id]);
    } else if (activeTab === 'contents') {
      setSelectedLectures([(item as Content).lecture_id]);
      setContentType((item as Content).type);
    }
    
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setSelectedPackages([]);
    setSelectedLectures([]);
  }

  const renderForm = () => {
    if (activeTab === 'packages') {
      const editingPackage = editingId ? packages.find(p => p.id === editingId) : null;
      
      return (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>اسم الباقة</label>
            <input 
              type="text" 
              name="name" 
              defaultValue={editingPackage?.name || ''} 
              required 
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>الوصف</label>
            <textarea 
              name="description" 
              defaultValue={editingPackage?.description || ''} 
              rows={3}
              className={styles.textarea}
            />
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>السعر</label>
              <input 
                type="number" 
                name="price" 
                defaultValue={editingPackage?.price || 0} 
                required 
                min="0"
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>المدة (بالأيام)</label>
              <input 
                type="number" 
                name="duration_days" 
                defaultValue={editingPackage?.duration_days || 30} 
                required 
                min="1"
                className={styles.input}
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>النوع</label>
              <select name="type" defaultValue={editingPackage?.type || 'monthly'} className={styles.select}>
                <option value="weekly">أسبوعي</option>
                <option value="monthly">شهري</option>
                <option value="term">ترم</option>
                <option value="offer">عرض</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label>رابط الصورة</label>
              <input 
                type="url" 
                name="image_url" 
                defaultValue={editingPackage?.image_url || ''} 
                placeholder="https://..." 
                className={styles.input}
              />
            </div>
          </div>
          
          {editingPackage && (
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  name="is_active" 
                  value="true" 
                  defaultChecked={editingPackage.is_active} 
                />
                نشط
              </label>
            </div>
          )}
          
          <div className={styles.modalActions}>
            <button type="button" onClick={closeModal} className={styles.cancelBtn}>إلغاء</button>
            <button type="submit" disabled={submitting} className={styles.submitBtn}>
              {submitting ? 'جاري الحفظ...' : (modalMode === 'create' ? 'إنشاء' : 'تحديث')}
            </button>
          </div>
        </form>
      );
    } else if (activeTab === 'lectures') {
      const editingLecture = editingId ? lectures.find(l => l.id === editingId) : null;
      
      return (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>اختيار الباقات (يمكن اختيار أكثر من باقة)</label>
            <select 
              multiple 
              value={selectedPackages} 
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedPackages(options);
              }}
              className={styles.multiSelect}
              required={modalMode === 'create'}
              disabled={modalMode === 'edit'}
            >
              {packages.map(pkg => (
                <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
              ))}
            </select>
            <small>اضغط CTRL مع النقر لاختيار أكثر من باقة</small>
          </div>
          
          <div className={styles.formGroup}>
            <label>عنوان المحاضرة</label>
            <input 
              type="text" 
              name="title" 
              defaultValue={editingLecture?.title || ''} 
              required 
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>الوصف</label>
            <textarea 
              name="description" 
              defaultValue={editingLecture?.description || ''} 
              rows={3}
              className={styles.textarea}
            />
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>رابط الصورة</label>
              <input 
                type="url" 
                name="image_url" 
                defaultValue={editingLecture?.image_url || ''} 
                placeholder="https://..." 
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>ترتيب العرض</label>
              <input 
                type="number" 
                name="order_number" 
                defaultValue={editingLecture?.order_number || 0} 
                min="0"
                className={styles.input}
              />
            </div>
          </div>
          
          {editingLecture && (
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  name="is_active" 
                  value="true" 
                  defaultChecked={editingLecture.is_active} 
                />
                نشط
              </label>
            </div>
          )}
          
          <div className={styles.modalActions}>
            <button type="button" onClick={closeModal} className={styles.cancelBtn}>إلغاء</button>
            <button type="submit" disabled={submitting || (modalMode === 'create' && selectedPackages.length === 0)} className={styles.submitBtn}>
              {submitting ? 'جاري الحفظ...' : (modalMode === 'create' ? 'إنشاء' : 'تحديث')}
            </button>
          </div>
        </form>
      );
    } else {
      const editingContent = editingId ? contents.find(c => c.id === editingId) : null;
      
      return (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>اختيار المحاضرات (يمكن اختيار أكثر من محاضرة)</label>
            <select 
              multiple 
              value={selectedLectures} 
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedLectures(options);
              }}
              className={styles.multiSelect}
              required={modalMode === 'create'}
              disabled={modalMode === 'edit'}
            >
              {lectures.map(lecture => (
                <option key={lecture.id} value={lecture.id}>
                  {lecture.title} ({packages.find(p => p.id === lecture.package_id)?.name || 'غير معروف'})
                </option>
              ))}
            </select>
            <small>اضغط CTRL مع النقر لاختيار أكثر من محاضرة</small>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>النوع</label>
              <select 
                name="type" 
                value={contentType} 
                onChange={(e) => setContentType(e.target.value as any)}
                className={styles.select}
                disabled={modalMode === 'edit'}
              >
                <option value="video">فيديو</option>
                <option value="pdf">ملف PDF</option>
                <option value="exam">امتحان</option>
                <option value="text">نص</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label>العنوان</label>
              <input 
                type="text" 
                name="title" 
                defaultValue={editingContent?.title || ''} 
                required 
                className={styles.input}
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label>الوصف</label>
            <textarea 
              name="description" 
              defaultValue={editingContent?.description || ''} 
              rows={3}
              className={styles.textarea}
            />
          </div>
          
          {(contentType === 'video' || contentType === 'pdf') && (
            <div className={styles.formGroup}>
              <label>الرابط (رابط الفيديو أو الملف)</label>
              <input 
                type="url" 
                name="content_url" 
                defaultValue={editingContent?.content_url || ''} 
                placeholder="https://..." 
                required
                className={styles.input}
              />
            </div>
          )}
          
          {contentType === 'video' && (
            <div className={styles.formGroup}>
              <label>عدد مرات المشاهدة المسموحة</label>
              <input 
                type="number" 
                name="max_attempts" 
                defaultValue={editingContent?.max_attempts || 3} 
                min="1"
                required
                className={styles.input}
              />
            </div>
          )}
          
          {contentType === 'exam' && (
            <>
              <div className={styles.formGroup}>
                <label>درجة النجاح (%)</label>
                <input 
                  type="number" 
                  name="pass_score" 
                  defaultValue={editingContent?.pass_score || 70} 
                  min="0" 
                  max="100"
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>عدد المحاولات المسموحة</label>
                <input 
                  type="number" 
                  name="max_attempts" 
                  defaultValue={editingContent?.max_attempts || 1} 
                  min="1"
                  required
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>أسئلة الامتحان (JSON format)</label>
                <textarea 
                  name="exam_questions" 
                  rows={6}
                  placeholder={`[{ "question": "...", "options": ["...", "..."], "correct": 0 }]`}
                  className={styles.textarea}
                />
              </div>
            </>
          )}
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>المدة (دقائق)</label>
              <input 
                type="number" 
                name="duration_minutes" 
                defaultValue={editingContent?.duration_minutes || 0} 
                min="0"
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>ترتيب العرض</label>
              <input 
                type="number" 
                name="order_number" 
                defaultValue={editingContent?.order_number || 0} 
                min="0"
                className={styles.input}
              />
            </div>
          </div>
          
          {editingContent && (
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  name="is_active" 
                  value="true" 
                  defaultChecked={editingContent.is_active} 
                />
                نشط
              </label>
            </div>
          )}
          
          <div className={styles.modalActions}>
            <button type="button" onClick={closeModal} className={styles.cancelBtn}>إلغاء</button>
            <button type="submit" disabled={submitting || (modalMode === 'create' && selectedLectures.length === 0)} className={styles.submitBtn}>
              {submitting ? 'جاري الحفظ...' : (modalMode === 'create' ? 'إنشاء' : 'تحديث')}
            </button>
          </div>
        </form>
      );
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>إدارة الصف الأول الثانوي</h1>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'packages' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('packages')}
          >
            الباقات ({packages.length})
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'lectures' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('lectures')}
          >
            المحاضرات ({lectures.length})
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'contents' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('contents')}
          >
            المحتوى ({contents.length})
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.actions}>
          <button onClick={openCreateModal} className={styles.createBtn}>
            + إضافة جديد
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>جاري التحميل...</div>
        ) : (
          <div className={styles.tableContainer}>
            {activeTab === 'packages' && (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>الصورة</th>
                    <th>الاسم</th>
                    <th>النوع</th>
                    <th>السعر</th>
                    <th>المدة</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map(pkg => (
                    <tr key={pkg.id}>
                      <td>
                        {pkg.image_url ? (
                          <img src={pkg.image_url} alt={pkg.name} className={styles.thumbnail} />
                        ) : (
                          <div className={styles.noImage}>لا توجد صورة</div>
                        )}
                      </td>
                      <td>{pkg.name}</td>
                      <td>{pkg.type}</td>
                      <td>{pkg.price} جنيه</td>
                      <td>{pkg.duration_days} يوم</td>
                      <td>
                        <span className={`${styles.status} ${pkg.is_active ? styles.active : styles.inactive}`}>
                          {pkg.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => openEditModal(pkg)} className={styles.editBtn}>تعديل</button>
                        <button onClick={() => handleDelete(pkg.id)} className={styles.deleteBtn}>حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'lectures' && (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>الصورة</th>
                    <th>العنوان</th>
                    <th>الباقة</th>
                    <th>الترتيب</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {lectures.map(lecture => (
                    <tr key={lecture.id}>
                      <td>
                        {lecture.image_url ? (
                          <img src={lecture.image_url} alt={lecture.title} className={styles.thumbnail} />
                        ) : (
                          <div className={styles.noImage}>لا توجد صورة</div>
                        )}
                      </td>
                      <td>{lecture.title}</td>
                      <td>{lecture.package?.name || packages.find(p => p.id === lecture.package_id)?.name || 'غير معروف'}</td>
                      <td>{lecture.order_number}</td>
                      <td>
                        <span className={`${styles.status} ${lecture.is_active ? styles.active : styles.inactive}`}>
                          {lecture.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => openEditModal(lecture)} className={styles.editBtn}>تعديل</button>
                        <button onClick={() => handleDelete(lecture.id)} className={styles.deleteBtn}>حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'contents' && (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>النوع</th>
                    <th>العنوان</th>
                    <th>المحاضرة</th>
                    <th>المدة</th>
                    <th>المحاولات</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {contents.map(content => (
                    <tr key={content.id}>
                      <td>
                        <span className={`${styles.type} ${styles[content.type]}`}>
                          {content.type === 'video' && 'فيديو'}
                          {content.type === 'pdf' && 'PDF'}
                          {content.type === 'exam' && 'امتحان'}
                          {content.type === 'text' && 'نص'}
                        </span>
                      </td>
                      <td>{content.title}</td>
                      <td>{content.lecture?.title || 'غير معروف'}</td>
                      <td>{content.duration_minutes} دقيقة</td>
                      <td>{content.max_attempts || '-'}</td>
                      <td>
                        <span className={`${styles.status} ${content.is_active ? styles.active : styles.inactive}`}>
                          {content.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => openEditModal(content)} className={styles.editBtn}>تعديل</button>
                        <button onClick={() => handleDelete(content.id)} className={styles.deleteBtn}>حذف</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                {modalMode === 'create' ? 'إضافة جديد' : 'تعديل'} - {
                  activeTab === 'packages' ? 'باقة' : 
                  activeTab === 'lectures' ? 'محاضرة' : 'محتوى'
                }
              </h2>
              <button onClick={closeModal} className={styles.closeBtn}>×</button>
            </div>
            <div className={styles.modalBody}>
              {renderForm()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}