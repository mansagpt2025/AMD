// app/grades/[grade]/packages/[packageId]/not-found.tsx
'use client'

import { useRouter } from 'next/navigation'
import { AlertCircle, Home } from 'lucide-react'
import styles from './PackagePage.module.css'

export default function PackageNotFound() {
  const router = useRouter()
  
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <AlertCircle className={styles.errorIcon} />
        <h2 className={styles.errorTitle}>الباقة غير متاحة</h2>
        <p className={styles.errorMessage}>
          الباقة التي تحاول الوصول إليها غير متاحة حالياً. قد تكون:
        </p>
        <ul className={styles.errorList}>
          <li>غير نشطة</li>
          <li>منتهية الصلاحية</li>
          <li>تم إلغاؤها</li>
        </ul>
        <div className={styles.errorActions}>
          <button
            onClick={() => router.push('/grades/first')} // استبدل بالصف المناسب
            className={styles.backButton}
          >
            <Home className={styles.buttonIcon} />
            العودة إلى الباقات
          </button>
        </div>
      </div>
    </div>
  )
}