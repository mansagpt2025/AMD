'use client'

import { useState } from 'react'
import { createLecture } from '../actions'
import styles from './LectureForm.module.css'

interface LectureFormProps {
  packages: any[]
  selectedPackageId?: string
  onSuccess: () => void
}

type LectureFormState = {
  package_id: string
  title: string
  description: string
  image_url: string
  order_number: number
}

export function LectureForm({ packages, selectedPackageId, onSuccess }: LectureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<LectureFormState>({
    package_id: selectedPackageId || '',
    title: '',
    description: '',
    image_url: '',
    order_number: 0
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'order_number' ? Number(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await createLecture({
        ...formData,
        description: formData.description || null,
        image_url: formData.image_url || null
      })

      setFormData({
        package_id: selectedPackageId || '',
        title: '',
        description: '',
        image_url: '',
        order_number: 0
      })

      onSuccess()
      alert('تم إنشاء المحاضرة بنجاح!')
    } catch (error) {
      console.error('Error creating lecture:', error)
      alert('حدث خطأ أثناء إنشاء المحاضرة')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label htmlFor="package_id">الباقة *</label>
          <select
            id="package_id"
            name="package_id"
            value={formData.package_id}
            onChange={handleChange}
            required
          >
            <option value="">اختر الباقة</option>
            {packages.map(pkg => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="title">عنوان المحاضرة *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="أدخل عنوان المحاضرة"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="order_number">ترتيب المحاضرة</label>
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
          <label htmlFor="image_url">رابط الصورة</label>
          <input
            type="url"
            id="image_url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
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
          placeholder="أدخل وصف المحاضرة..."
        />
      </div>

      <div className={styles.formActions}>
        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.submitButton}
        >
          {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء المحاضرة'}
        </button>
      </div>
    </form>
  )
}
