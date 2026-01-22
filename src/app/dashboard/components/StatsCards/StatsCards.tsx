'use client'

import { Package, Video, Award, Clock } from 'lucide-react'
import './StatsCards.css'

interface StatsCardsProps {
  stats: {
    totalPackages: number
    completedLectures: number
    totalLectures: number
    averageScore: number
    studyHours: number
  }
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const progressPercentage = stats.totalLectures > 0 
    ? Math.round((stats.completedLectures / stats.totalLectures) * 100)
    : 0

  return (
    <div className="stats-grid">
      {/* بطاقة الباقات */}
      <div className="stat-card stat-card-blue">
        <div className="stat-icon">
          <Package />
        </div>
        <div className="stat-content">
          <div className="stat-info">
            <span className="stat-label">الباقات المشتراة</span>
            <span className="stat-value">{stats.totalPackages}</span>
          </div>
          <div className="stat-trend">
            <span>+2 هذا الشهر</span>
          </div>
        </div>
      </div>

      {/* بطاقة المحاضرات */}
      <div className="stat-card stat-card-green">
        <div className="stat-icon">
          <Video />
        </div>
        <div className="stat-content">
          <div className="stat-info">
            <span className="stat-label">المحاضرات المكتملة</span>
            <span className="stat-value">{stats.completedLectures}</span>
            <span className="stat-progress">{progressPercentage}%</span>
          </div>
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* بطاقة الدرجات */}
      <div className="stat-card stat-card-purple">
        <div className="stat-icon">
          <Award />
        </div>
        <div className="stat-content">
          <div className="stat-info">
            <span className="stat-label">متوسط الدرجات</span>
            <span className="stat-value">{stats.averageScore}%</span>
          </div>
          <div className="stat-trend">
            <span>+5% عن الشهر الماضي</span>
          </div>
        </div>
      </div>

      {/* بطاقة الساعات */}
      <div className="stat-card stat-card-orange">
        <div className="stat-icon">
          <Clock />
        </div>
        <div className="stat-content">
          <div className="stat-info">
            <span className="stat-label">ساعات الدراسة</span>
            <span className="stat-value">{stats.studyHours}</span>
            <span className="stat-unit">ساعة</span>
          </div>
          <div className="stat-trend">
            <span>+12h هذا الأسبوع</span>
          </div>
        </div>
      </div>
    </div>
  )
}