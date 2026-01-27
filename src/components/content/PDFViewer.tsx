'use client'

import { useState, useEffect, useCallback } from 'react'
import { Eye, Download, Loader2, AlertCircle, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './PDFViewer.module.css'

interface PDFViewerProps {
  pdfUrl: string
  contentId: string
  userId: string
  packageId: string
  theme: any
  onProgress?: (progress: number) => void
}

export default function PDFViewer({ 
  pdfUrl, 
  contentId, 
  userId, 
  packageId,
  theme,
  onProgress 
}: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeSpent, setTimeSpent] = useState(0)
  const [progressSaved, setProgressSaved] = useState(false)

  // إنشاء عميل Supabase
  const createClientBrowser = () => {
    if (typeof window === 'undefined') return null
    return require('@/lib/supabase/sf2-client').createClientBrowser()
  }

  const saveProgress = useCallback(async () => {
    if (!userId || !contentId || progressSaved) return
    
    try {
      const supabase = createClientBrowser()
      if (!supabase) return

      await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          lecture_content_id: contentId,
          package_id: packageId,
          status: 'completed',
          score: 100,
          last_accessed_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lecture_content_id'
        })

      setProgressSaved(true)
      if (onProgress) onProgress(100)
    } catch (err) {
      console.error('Error saving progress:', err)
    }
  }, [userId, contentId, packageId, onProgress, progressSaved])

  useEffect(() => {
    // محاكاة تحميل PDF
    const timer = setTimeout(() => {
      if (pdfUrl) {
        setIsLoading(false)
        saveProgress() // حفظ مباشر عند فتح PDF
      } else {
        setError('رابط الملف غير متوفر')
        setIsLoading(false)
      }
    }, 1500)

    // تتبع الوقت
    const interval = setInterval(() => {
      if (document.hasFocus()) {
        setTimeSpent(prev => prev + 1)
      }
    }, 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [pdfUrl, saveProgress])

  const handleDownload = () => {
    if (!pdfUrl) return
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `document-${contentId}.pdf`
    link.target = '_blank'
    link.click()
    saveProgress()
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={48} color="#ef4444" />
        <h3>حدث خطأ في تحميل الملف</h3>
        <p>{error}</p>
        {pdfUrl && (
          <button onClick={() => window.open(pdfUrl, '_blank')} className={styles.openButton}>
            فتح الملف في نافذة جديدة
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={styles.pdfViewerContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconContainer} style={{ background: theme.primary }}>
            <BookOpen size={24} color="white" />
          </div>
          <div>
            <h3 className={styles.title}>ملف PDF</h3>
            <p className={styles.subtitle}>وقت القراءة: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</p>
          </div>
        </div>
        
        <div className={styles.headerActions}>
          <button
            onClick={() => window.open(pdfUrl, '_blank')}
            className={styles.openButton}
            style={{ borderColor: theme.primary, color: theme.primary }}
          >
            <Eye size={18} />
            <span>فتح في نافذة جديدة</span>
          </button>
          
          <button
            onClick={handleDownload}
            className={styles.downloadButton}
            style={{ background: theme.primary }}
          >
            <Download size={18} />
            <span>تحميل الملف</span>
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className={styles.viewerContainer}>
        {isLoading ? (
          <div className={styles.loadingOverlay}>
            <Loader2 className={styles.spinner} style={{ color: theme.primary }} />
            <p>جاري تحميل الملف...</p>
          </div>
        ) : (
          <iframe
            src={`https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(pdfUrl)}`}
            className={styles.pdfFrame}
            title="PDF Viewer"
          />
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.progressInfo}>
          <div className={styles.progressBarContainer}>
            <div 
              className={styles.progressBarFill}
              style={{ width: '100%', background: theme.success }}
            />
          </div>
          <div className={styles.progressText}>تم تحميل الملف بنجاح</div>
        </div>
        
        <p className={styles.watermark}>الأبــارع محمود الـديــب © 2024</p>
      </div>
    </div>
  )
}