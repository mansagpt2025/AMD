'use client'

import { useState } from 'react'
import { Eye, Download, Loader2 } from 'lucide-react'
import styles from './PDFViewer.module.css'

interface PDFViewerProps {
  pdfUrl: string
  contentId: string
  userId: string
  theme: any
}

export default function PDFViewer({ pdfUrl, contentId, userId, theme }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  const handleIframeError = () => {
    setError('حدث خطأ في تحميل الملف')
    setIsLoading(false)
  }

  return (
    <div className={styles.pdfViewerContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconContainer} style={{ background: theme.primary }}>
            <Eye className={styles.headerIcon} />
          </div>
          <div>
            <h3 className={styles.title}>عارض الملفات</h3>
            <p className={styles.subtitle}>عرض آمن للمستندات</p>
          </div>
        </div>
        
        <div className={styles.headerActions}>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.openButton}
            style={{ 
              borderColor: theme.primary, 
              color: theme.primary 
            }}
          >
            <Eye className={styles.buttonIcon} />
            <span>فتح في نافذة جديدة</span>
          </a>
          
          <a
            href={pdfUrl}
            download
            className={styles.downloadButton}
            style={{ background: theme.primary }}
          >
            <Download className={styles.buttonIcon} />
            <span>تحميل الملف</span>
          </a>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className={styles.viewerContainer}>
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingContent}>
              <Loader2 className={styles.spinner} style={{ color: theme.primary }} />
              <p className={styles.loadingText}>جاري تحميل الملف...</p>
            </div>
          </div>
        )}

        {error ? (
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h4 className={styles.errorTitle}>حدث خطأ</h4>
            <p className={styles.errorMessage}>{error}</p>
            <a
              href={pdfUrl}
              download
              className={styles.errorButton}
              style={{ background: theme.primary }}
            >
              <Download className={styles.buttonIcon} />
              تحميل الملف مباشرة
            </a>
          </div>
        ) : (
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
            className={styles.pdfFrame}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="PDF Viewer"
          />
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.securityInfo}>
          <div className={styles.securityItem}>
            <div className={styles.securityDot}></div>
            <span>الملف للعرض فقط</span>
          </div>
          <div className={styles.securityItem}>
            <div className={styles.securityDot}></div>
            <span>تم تسجيل وقت الفتح</span>
          </div>
          <div className={styles.securityItem}>
            <div className={styles.securityDot}></div>
            <span>لا يمكن طباعة الملف</span>
          </div>
        </div>
        <p className={styles.watermark}>الأبــارع محمود الـديــب © 2024</p>
      </div>
    </div>
  )
}