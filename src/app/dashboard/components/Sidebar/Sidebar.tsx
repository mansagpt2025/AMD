'use client'

import { Home, Package, Video, BookOpen, Wallet, TrendingUp, Settings, HelpCircle, LogOut, ChevronRight } from 'lucide-react'
import './Sidebar.css'

interface SidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  studentData: any
  onLogout: () => void
}

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  setActiveTab,
  studentData,
  onLogout
}: SidebarProps) {
  const navItems = [
    { id: 'overview', label: 'الملخص العام', icon: Home },
    { id: 'packages', label: 'الباقات', icon: Package },
    { id: 'lectures', label: 'المحاضرات', icon: Video },
    { id: 'exams', label: 'الامتحانات', icon: BookOpen },
    { id: 'wallet', label: 'المحفظة', icon: Wallet },
    { id: 'progress', label: 'التقدم الدراسي', icon: TrendingUp },
  ]

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-sparkle">✨</div>
          <div className="logo-text">
            <span className="logo-primary">محمود</span>
            <span className="logo-secondary">الديب</span>
          </div>
        </div>
        <button 
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <ChevronRight className={`toggle-icon ${sidebarOpen ? 'rotated' : ''}`} />
        </button>
      </div>

      <div className="sidebar-profile">
        <div className="profile-avatar">
          {studentData.avatar}
        </div>
        <div className="profile-info">
          <h3>{studentData.name}</h3>
          <p>{studentData.grade}</p>
          <span className="profile-badge">{studentData.section}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="nav-icon" />
              <span>{item.label}</span>
            </button>
          )
        })}
        
        <div className="nav-divider"></div>
        
        <button className="nav-item">
          <Settings className="nav-icon" />
          <span>الإعدادات</span>
        </button>
        
        <button className="nav-item">
          <HelpCircle className="nav-icon" />
          <span>المساعدة</span>
        </button>
        
        <button className="nav-item logout-item" onClick={onLogout}>
          <LogOut className="nav-icon" />
          <span>تسجيل الخروج</span>
        </button>
      </nav>
    </aside>
  )
}