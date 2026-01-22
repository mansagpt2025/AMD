'use client'

import { Bell, Clock } from 'lucide-react'
import './Header.css'

interface HeaderProps {
  activeTab: string
  studentName: string
}

export default function Header({ activeTab, studentName }: HeaderProps) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview': return 'الملخص العام'
      case 'packages': return 'الباقات'
      case 'lectures': return 'المحاضرات'
      case 'exams': return 'الامتحانات'
      case 'wallet': return 'المحفظة'
      case 'progress': return 'التقدم الدراسي'
      default: return 'لوحة التحكم'
    }
  }

  const getTabDescription = () => {
    switch (activeTab) {
      case 'overview': return 'مرحباً بعودتك، تابع تقدمك الدراسي'
      case 'packages': return 'ادارة باقاتك التعليمية'
      case 'lectures': return 'شاهد واستكمل محاضراتك'
      case 'exams': return 'استعد للامتحانات القادمة'
      case 'wallet': return 'ادارة رصيدك المالي'
      case 'progress': return 'تابع تقدمك الدراسي'
      default: return 'مرحباً بك في منصتك التعليمية'
    }
  }

  const currentTime = new Date().toLocaleTimeString('ar-EG', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  const currentDate = new Date().toLocaleDateString('ar-EG', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <h1 className="page-title">{getTabTitle()}</h1>
        <p className="page-subtitle">{getTabDescription()}</p>
      </div>

      <div className="header-right">
        <div className="search-container">
          <input 
            type="search" 
            placeholder="ابحث عن محاضرة، امتحان، أو مادة..." 
            className="search-input"
          />
          <div className="search-icon">🔍</div>
        </div>

        <button className="notifications-button">
          <Bell className="bell-icon" />
          <span className="notification-badge">3</span>
        </button>

        <div className="time-widget">
          <Clock className="clock-icon" />
          <div className="time-info">
            <div className="current-time">{currentTime}</div>
            <div className="current-date">{currentDate}</div>
          </div>
        </div>
      </div>
    </header>
  )
}