'use client'

import { useState } from 'react'
import { createPackage, PackageData } from '../actions'
import styles from './PackageForm.module.css'

interface PackageFormProps {
  onSuccess: () => void
}

// State خاص بالفورم (string فقط)
interface PackageFormState {
  name: string
  description: string
  price: number
  image_url: string
}

export function PackageForm({ onSuccess }: PackageFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<PackageFormState>({
    name: '',
    description: '',
    price: 0,
    image_url: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload: PackageData = {
        name: formData.name,
        description: formData.description || null,
        price: formData.price,
        image_url: formData.image_url || null,
      }

      await createPackage(payload)

      setFormData({
        name: '',
        description: '',
        price: 0,
        image_url: '',
      })

      onSuccess()
      alert('تم إنشاء الباقة بنجاح!')
    } catch (error) {
      console.error('Error creating package:', error)
      alert('حدث خطأ أثناء إنشاء الباقة')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label htmlFor="name">اسم الباقة *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="أدخل اسم الباقة"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="price">السعر (جنيه) *</label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            placeholder="أدخل السعر"
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
          placeholder="أدخل وصف الباقة..."
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
            'إنشاء الباقة'
          )}
        </button>
      </div>
    </form>
  )
}
