'use client'

import { useState } from 'react'
import { Eye, Download, Loader2 } from 'lucide-react'

interface PDFViewerProps {
  pdfUrl: string
  contentId: string
  userId: string
  theme: any
}

export default function PDFViewer({ pdfUrl, contentId, userId, theme }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: theme.border }}>
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5" style={{ color: theme.primary }} />
          <span className="font-medium">عارض الملفات</span>
        </div>
        
        <div className="flex gap-2">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg border flex items-center gap-2 hover:bg-gray-50 transition-all"
            style={{ borderColor: theme.primary, color: theme.primary }}
          >
            <Eye className="w-4 h-4" />
            فتح في نافذة جديدة
          </a>
          
          <a
            href={pdfUrl}
            download
            className="px-4 py-2 rounded-lg text-white flex items-center gap-2 hover:opacity-90 transition-all"
            style={{ background: theme.primary }}
          >
            <Download className="w-4 h-4" />
            تحميل
          </a>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.primary }} />
          </div>
        )}
        
        <iframe
          src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          title="PDF Viewer"
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t text-sm text-gray-600" style={{ borderColor: theme.border }}>
        <p>• الملف للعرض فقط • تم تسجيل وقت الفتح • لا يمكن طباعة الملف</p>
      </div>
    </div>
  )
}