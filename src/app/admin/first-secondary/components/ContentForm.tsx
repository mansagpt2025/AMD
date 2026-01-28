'use client'

import { useState } from 'react'
import { createContent, ContentData } from '../actions'
import styles from './ContentForm.module.css'

interface ContentFormProps {
  lectures: any[]
  selectedLectureId?: string
  onSuccess: () => void
}

// نخلي الفورم يستخدم string فقط
interface ContentFormState {
  lecture_id: string
  type: 'video' | 'pdf' | 'exam' | 'text'
  title: string
  description: string
  content_url: string
  max_attempts: number
  order_number: number
}

export function ContentForm({ lectures, selectedLectureId, onSuccess }: ContentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<ContentFormState>({
    lecture_id: selectedLectureId || '',
    type: 'video',
    title: '',
    description: '',
    content_url: '',
    max_attempts: 1,
    order_number: 0,
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'max_attempts' || name === 'order_number'
          ? Number(value)
          : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload: ContentData = {
        lecture_id: formData.lecture_id,
        type: formData.type,
        title: formData.title,
        description: formData.description || null,
        content_url: formData.content_url || null,
        max_attempts: formData.max_attempts,
        order_number: formData.order_number,
      }

      await createContent(payload)

      setFormData({
        lecture_id: selectedLectureId || '',
        type: 'video',
        title: '',
        description: '',
        content_url: '',
        max_attempts: 1,
        order_number: 0,
      })

      onSuccess()
      alert('تم إنشاء المحتوى بنجاح!')
    } catch (error) {
      console.error('Error creating content:', error)
      alert('حدث خطأ أثناء إنشاء المحتوى')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label htmlFor="lecture_id">المحاضرة *</label>
          <select
            id="lecture_id"
            name="lecture_id"
            value={formData.lecture_id}
            onChange={handleChange}
            required
          >
            <option value="">اختر المحاضرة</option>
            {lectures.map(lecture => (
              <option key={lecture.id} value={lecture.id}>
                {lecture.title}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="type">نوع المحتوى *</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="video">فيديو</option>
            <option value="pdf">ملف PDF</option>
            <option value="exam">امتحان</option>
            <option value="text">نص</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="title">عنوان المحتوى *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="أدخل عنوان المحتوى"
          />
        </div>

        {formData.type === 'video' && (
          <div className={styles.formGroup}>
            <label htmlFor="max_attempts">عدد مرات المشاهدة المسموحة</label>
            <input
              type="number"
              id="max_attempts"
              name="max_attempts"
              value={formData.max_attempts}
              onChange={handleChange}
              min="1"
              placeholder="أدخل عدد المرات"
            />
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="order_number">ترتيب المحتوى</label>
          <input
            type="number"
            id="order_number"
            name="order_number"
            value={formData.order_number}
            onChange={handleChange}
            min="0"
            placeholder="أدخل الترتيب"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="content_url">رابط المحتوى *</label>
          <input
            type="url"
            id="content_url"
            name="content_url"
            value={formData.content_url}
            onChange={handleChange}
            required
            placeholder="https://example.com/content"
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">الوصف</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          placeholder="أدخل وصف المحتوى..."
        />
      </div>

      <div className={styles.formActions}>
        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.submitButton}
        >
          {isSubmitting ? (
            <>
              <span className={styles.spinner}></span>
              جاري الإنشاء...
            </>
          ) : (
            'إنشاء المحتوى'
          )}
        </button>
      </div>
    </form>
  )
}
