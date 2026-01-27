'use client'

import { useState, useEffect, useCallback } from 'react'
import { Eye, Download, Loader2, AlertCircle, BookOpen, ExternalLink } from 'lucide-react'
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

  // التحقق من نوع الرابط
  const isGoogleDrive = pdfUrl?.includes('drive.google.com') || pdfUrl?.includes('docs.google.com')
  const isDropbox = pdfUrl?.includes('dropbox.com')
  const isOneDrive = pdfUrl?.includes('onedrive') || pdfUrl?.includes('sharepoint')
  
  // استخراج ID من Google Drive
  const getGoogleDriveId = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/)
    return match ? match[1] : null
  }

  const driveId = isGoogleDrive ? getGoogleDriveId(pdfUrl) : null
  
  // إنشاء رابط العرض المناسب
  const getViewerUrl = () => {
    if (!pdfUrl) return ''
    
    if (isGoogleDrive && driveId) {
      // استخدام Google Drive PDF Viewer
      return `https://drive.google.com/file/d/${driveId}/preview`
    }
    
    if (isDropbox) {
      // تحويل رابط Dropbox إلى مباشر
      return pdfUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '?dl=1')
    }
    
    // للروابط المباشرة، استخدام Google Docs Viewer كـ fallback
    if (!pdfUrl.endsWith('.pdf')) {
      return pdfUrl
    }
    
    return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(pdfUrl)}`
  }

  const viewerUrl = getViewerUrl()
  const directDownloadUrl = isGoogleDrive && driveId 
    ? `https://drive.google.com/uc?export=download&id=${driveId}` 
    : pdfUrl

  // إنشاء عميل Supabase
  const createClientBrowser = () => {
    if (typeof window === 'undefined') return null
    try {
      return require('@/lib/supabase/sf2-client').createClientBrowser()
    } catch (e) {
      return null
    }
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
        saveProgress()
      } else {
        setError('رابط الملف غير متوفر')
        setIsLoading(false)
      }
    }, 1000)

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
    if (!directDownloadUrl) return
    
    if (isGoogleDrive && driveId) {
      // فتح في نافذة جديدة للتحميل من Google Drive
      window.open(directDownloadUrl, '_blank')
    } else {
      const link = document.createElement('a')
      link.href = directDownloadUrl
      link.download = `document-${contentId}.pdf`
      link.target = '_blank'
      link.click()
    }
    saveProgress()
  }

  const handleOpenOriginal = () => {
    window.open(pdfUrl, '_blank')
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={48} color="#ef4444" />
        <h3>حدث خطأ في تحميل الملف</h3>
        <p>{error}</p>
        <div className={styles.errorActions}>
          <button onClick={handleOpenOriginal} className={styles.openButton}>
            <ExternalLink size={18} /> فتح الرابط الأصلي
          </button>
          {isGoogleDrive && (
            <button onClick={handleDownload} className={styles.downloadButton}>
              <Download size={18} /> تحميل الملف
            </button>
          )}
        </div>
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
            <p className={styles.subtitle}>
              {isGoogleDrive ? 'ملف Google Drive' : 'ملف PDF'}
              {timeSpent > 0 && ` | وقت القراءة: ${Math.floor(timeSpent / 60)}:${(timeSpent % 60).toString().padStart(2, '0')}`}
            </p>
          </div>
        </div>
        
        <div className={styles.headerActions}>
          <button
            onClick={handleOpenOriginal}
            className={styles.openButton}
            style={{ borderColor: theme.primary, color: theme.primary }}
          >
            <ExternalLink size={18} />
            <span>فتح في Drive</span>
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
          <div className={styles.iframeContainer}>
            {isGoogleDrive ? (
              // استخدام iframe خاص بـ Google Drive
              <iframe
                src={viewerUrl}
                className={styles.pdfFrame}
                title="PDF Viewer"
                allow="autoplay; fullscreen"
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            ) : (
              // استخدام Google Docs Viewer للروابط الأخرى
              <iframe
                src={`https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(pdfUrl)}`}
                className={styles.pdfFrame}
                title="PDF Viewer"
              />
            )}
            
            {/* طبقة حماية ضد النقر بزر الماوس الأيمن */}
            <div 
              className={styles.protectionOverlay}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
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
          <div className={styles.progressText}>
            {progressSaved ? '✓ تم تحميل الملف بنجاح' : 'جاري تحميل الملف...'}
          </div>
        </div>
        
        {isGoogleDrive && (
          <p className={styles.driveNotice}>
            <AlertCircle size={14} /> 
            إذا لم يظهر الملف، قد تحتاج إلى تسجيل الدخول في Google أو النقر على "فتح في Drive"
          </p>
        )}
        
        <p className={styles.watermark}>الأبــارع محمود الـديــب © 2024</p>
      </div>
    </div>
  )
}