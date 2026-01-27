'use client'

import { useState, useEffect, useRef, useCallback } from 'react' // أضف useCallback هنا
import { Eye, Download, Loader2, AlertCircle, BookOpen } from 'lucide-react'
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
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [timeSpent, setTimeSpent] = useState(0)
  const [readingProgress, setReadingProgress] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)

  // إنشاء عميل Supabase
  const createClientBrowser = () => {
    return require('@/lib/supabase/sf-client').createClientBrowser()
  }

  // حفظ التقدم في قاعدة البيانات
  const saveProgressToDB = useCallback(async (progress: number) => {
    try {
      const supabase = createClientBrowser()
      
      // تحديث أو إنشاء سجل التقدم
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          lecture_content_id: contentId,
          package_id: packageId,
          status: progress >= 90 ? 'completed' : 'in_progress',
          score: progress,
          last_accessed_at: new Date().toISOString(),
          ...(progress >= 90 && { completed_at: new Date().toISOString() })
        }, {
          onConflict: 'user_id,lecture_content_id'
        })

      if (!error && onProgress) {
        onProgress(progress)
      }
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }, [userId, contentId, packageId, onProgress])

  // جلب التقدم الحالي
  useEffect(() => {
    const fetchCurrentProgress = async () => {
      try {
        const supabase = createClientBrowser()
        const { data } = await supabase
          .from('user_progress')
          .select('score')
          .eq('user_id', userId)
          .eq('lecture_content_id', contentId)
          .single()

        if (data?.score) {
          setReadingProgress(data.score)
        }
      } catch (error) {
        console.error('Error fetching progress:', error)
      }
    }

    fetchCurrentProgress()
  }, [userId, contentId])

  useEffect(() => {
    // تتبع وقت قراءة الملف
    const interval = setInterval(() => {
      if (document.hasFocus() && !isLoading) {
        setTimeSpent(prev => {
          const newTime = prev + 1
          
          // تحديث التقدم بناءً على الوقت والصفحات
          if (totalPages > 0) {
            const pageProgress = (currentPage / totalPages) * 70 // 70% للصفحات
            const timeProgress = Math.min((newTime / 300) * 30, 30) // 30% للوقت
            const totalProgress = Math.min(pageProgress + timeProgress, 100)
            
            setReadingProgress(totalProgress)
            
            // حفظ التقدم كل 30 ثانية أو عند تغيير الصفحة
            if (newTime % 30 === 0 || currentPage > 1) {
              saveProgressToDB(totalProgress)
            }
          }
          
          return newTime
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isLoading, totalPages, currentPage, saveProgressToDB])

  const handleIframeLoad = () => {
    setIsLoading(false)
    
    // محاولة الحصول على عدد صفحات PDF
    try {
      if (iframeRef.current) {
        // إضافة حدث لحساب الصفحات
        const checkPages = () => {
          try {
            const iframe = iframeRef.current
            if (iframe?.contentDocument) {
              const pdfViewer = iframe.contentDocument.querySelector('.pdfViewer')
              if (pdfViewer) {
                const pages = pdfViewer.querySelectorAll('.page')
                if (pages.length > 0) {
                  setTotalPages(pages.length)
                  return
                }
              }
            }
            
            // إذا لم يتم العثور على عدد الصفحات، استخدم قيمة افتراضية
            setTimeout(() => {
              setTotalPages(prev => prev || 10)
            }, 2000)
          } catch (err) {
            // لا يمكن الوصول إلى iframe بسبب سياسة CORS
            setTotalPages(prev => prev || 10)
          }
        }
        
        setTimeout(checkPages, 1000)
      }
    } catch (err) {
      console.log('Cannot access PDF pages info')
      setTotalPages(prev => prev || 10)
    }
  }

  const handleIframeError = () => {
    setError('حدث خطأ في تحميل الملف. يرجى المحاولة مرة أخرى أو تحميل الملف.')
    setIsLoading(false)
  }

  const handleOpenPDF = () => {
    // فتح PDF في نافذة جديدة مع تتبع
    window.open(`${pdfUrl}#view=FitH&page=${currentPage}`, '_blank', 'noopener,noreferrer')
    
    // تسجيل فتح الملف
    saveProgressToDB(10)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (totalPages > 0 && newPage > totalPages)) return
    
    setCurrentPage(newPage)
    
    // تحديث iframe للصفحة الجديدة
    if (iframeRef.current) {
      const newUrl = `${pdfUrl}#page=${newPage}`
      iframeRef.current.src = newUrl
    }
    
    // حفظ التقدم عند تغيير الصفحة
    if (totalPages > 0) {
      const progress = (newPage / totalPages) * 100
      saveProgressToDB(progress)
    }
  }

  return (
    <div className={styles.pdfViewerContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconContainer} style={{ background: theme.primary }}>
            <BookOpen className={styles.headerIcon} />
          </div>
          <div>
            <h3 className={styles.title}>عارض الملفات</h3>
            <p className={styles.subtitle}>
              {totalPages > 0 ? `${totalPages} صفحة` : 'جارٍ التحميل...'}
            </p>
          </div>
        </div>
        
        <div className={styles.headerActions}>
          {/* إحصائيات القراءة */}
          <div className={styles.readingStats}>
            <span className={styles.statItem}>
              ⏱️ {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
            </span>
            <span className={styles.statSeparator}>•</span>
            <span className={styles.statItem}>
              📄 {currentPage}/{totalPages || '?'}
            </span>
            <span className={styles.statSeparator}>•</span>
            <span className={styles.statItem}>
              📊 {Math.round(readingProgress)}%
            </span>
          </div>
          
          <button
            onClick={handleOpenPDF}
            className={styles.openButton}
            style={{ 
              borderColor: theme.primary, 
              color: theme.primary 
            }}
          >
            <Eye className={styles.buttonIcon} />
            <span>فتح في نافذة جديدة</span>
          </button>
          
          <a
            href={pdfUrl}
            download
            className={styles.downloadButton}
            style={{ background: theme.primary }}
            onClick={() => saveProgressToDB(100)}
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
            <div className={styles.errorIcon}>
              <AlertCircle size={48} color={theme.error || '#ef4444'} />
            </div>
            <h4 className={styles.errorTitle}>حدث خطأ</h4>
            <p className={styles.errorMessage}>{error}</p>
            <div className={styles.errorActions}>
              <button
                onClick={() => {
                  setIsLoading(true)
                  setError(null)
                }}
                className={styles.retryButton}
                style={{ background: theme.primary }}
              >
                إعادة المحاولة
              </button>
              <a
                href={pdfUrl}
                download
                className={styles.downloadButton}
                style={{ background: theme.success }}
                onClick={() => saveProgressToDB(100)}
              >
                <Download className={styles.buttonIcon} />
                تحميل الملف مباشرة
              </a>
            </div>
          </div>
        ) : (
          <>
            <iframe
              ref={iframeRef}
              src={`${pdfUrl}#view=FitH&page=${currentPage}`}
              className={styles.pdfFrame}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title="PDF Viewer"
              allow="fullscreen"
            />
            
            {/* عناصر تحكم PDF */}
            {totalPages > 0 && (
              <div className={styles.pdfControls}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className={styles.controlButton}
                  style={{ 
                    color: theme.primary,
                    borderColor: theme.primary
                  }}
                >
                  الصفحة السابقة
                </button>
                
                <div className={styles.pageNavigator}>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => handlePageChange(parseInt(e.target.value) || 1)}
                    className={styles.pageInput}
                    style={{ 
                      borderColor: theme.primary,
                      color: theme.text 
                    }}
                  />
                  <span className={styles.pageTotal}>/ {totalPages}</span>
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className={styles.controlButton}
                  style={{ 
                    color: theme.primary,
                    borderColor: theme.primary
                  }}
                >
                  الصفحة التالية
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.progressInfo}>
          <div className={styles.progressBarContainer}>
            <div 
              className={styles.progressBarFill}
              style={{ 
                width: `${readingProgress}%`,
                background: theme.primary 
              }}
            />
          </div>
          <div className={styles.progressText}>
            {Math.round(readingProgress)}% مكتمل
          </div>
        </div>
        
        <div className={styles.securityInfo}>
          <div className={styles.securityItem}>
            <div className={styles.securityDot} style={{ background: theme.success }}></div>
            <span>تم تسجيل وقت القراءة</span>
          </div>
          <div className={styles.securityItem}>
            <div className={styles.securityDot} style={{ background: theme.accent }}></div>
            <span>التقدم محفوظ تلقائياً</span>
          </div>
          <div className={styles.securityItem}>
            <div className={styles.securityDot} style={{ background: theme.primary }}></div>
            <span>الصفحة الحالية: {currentPage}</span>
          </div>
        </div>
        
        <p className={styles.watermark}>الأبــارع محمود الـديــب © 2024</p>
      </div>
    </div>
  )
}