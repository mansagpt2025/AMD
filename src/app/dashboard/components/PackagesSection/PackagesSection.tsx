'use client'

import { Package } from 'lucide-react'
import './PackagesSection.css'

export default function PackagesSection() {
  const packages = [
    {
      id: 1,
      name: 'الفيزياء - الفصل الأول',
      progress: 75,
      nextLecture: 'غداً 10:00 ص',
      color: 'blue'
    },
    {
      id: 2,
      name: 'الكيمياء - التفاعلات الكيميائية',
      progress: 60,
      nextLecture: 'بعد غد 2:00 م',
      color: 'green'
    },
    {
      id: 3,
      name: 'الأحياء - الوراثة',
      progress: 45,
      nextLecture: 'اليوم 6:00 م',
      color: 'purple'
    }
  ]

  return (
    <div className="packages-section">
      <div className="section-header">
        <h2 className="section-title">الباقات النشطة</h2>
        <button className="view-all-button">عرض الكل</button>
      </div>
      
      {packages.length === 0 ? (
        <div className="packages-empty">
          <Package className="empty-icon" />
          <h3>لا توجد باقات نشطة</h3>
          <p>اشترك في باقة لتبدأ رحلتك التعليمية</p>
          <button className="browse-packages-button">تصفح الباقات</button>
        </div>
      ) : (
        <div className="packages-grid">
          {packages.map((pkg) => (
            <div key={pkg.id} className="package-card">
              <div className="package-header">
                <div className={`package-badge package-badge-${pkg.color}`}>
                  {pkg.name.split(' - ')[0]}
                </div>
                <div className="package-progress">
                  <span>{pkg.progress}%</span>
                </div>
              </div>
              
              <h3 className="package-name">{pkg.name}</h3>
              
              <div className="package-info">
                <div className="info-item">
                  <span className="info-label">المحاضرة القادمة:</span>
                  <span className="info-value">{pkg.nextLecture}</span>
                </div>
              </div>
              
              <div className="package-actions">
                <button className="continue-button">استكمال المحاضرات</button>
                <button className="details-button">التفاصيل</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}