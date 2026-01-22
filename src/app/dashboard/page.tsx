'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './components/Sidebar/Sidebar'
import Header from './components/Header/Header'
import WelcomeCard from './components/WelcomeCard/WelcomeCard'
import StatsCards from './components/StatsCards/StatsCards'
import GradesSection from './components/GradesSection/GradesSection'
import PackagesSection from './components/PackagesSection/PackagesSection'
import { supabase } from '@/lib/supabase'
import './dashboard.css'

export default function DashboardPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [grades, setGrades] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
    fetchGrades()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile) {
        console.error('Profile not found')
        return
      }

      const { data: wallet } = await supabase
        .from('student_wallet')
        .select('*')
        .eq('student_id', user.id)
        .single()

      const { data: purchases } = await supabase
        .from('student_purchases')
        .select('id')
        .eq('student_id', user.id)
        .eq('status', 'active')

      setDashboardData({
        student: {
          name: profile.name || 'طالب',
          grade: profile.grade || 'غير محدد',
          section: profile.section || 'عام',
          avatar: (profile.name || 'ط').charAt(0),
          email: profile.email,
          phone: profile.student_phone
        },
        wallet: {
          balance: wallet?.balance || 0,
          last_updated: wallet?.last_updated
        },
        stats: {
          totalPackages: purchases?.length || 0,
          completedLectures: 0,
          totalLectures: 0,
          averageScore: 0,
          studyHours: 0
        }
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGrades = async () => {
    try {
      const { data } = await supabase
        .from('grades')
        .select('*')
        .order('id', { ascending: true })

      setGrades(data || [])
    } catch (error) {
      console.error('Error fetching grades:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>جاري تحميل البيانات...</p>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-error">
        <h2>❌ خطأ في تحميل البيانات</h2>
        <button onClick={fetchDashboardData}>
          إعادة المحاولة
        </button>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        studentData={dashboardData.student}
        onLogout={handleLogout}
      />
      
      <main className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Header 
          activeTab={activeTab}
          studentName={dashboardData.student.name}
        />
        
        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <>
              <WelcomeCard 
                studentName={dashboardData.student.name}
                walletBalance={dashboardData.wallet.balance}
              />
              
              <StatsCards stats={dashboardData.stats} />
              
              <GradesSection 
                grades={grades}
                studentGrade={dashboardData.student.grade}
              />
              
              <PackagesSection />
            </>
          )}
          
          {activeTab === 'packages' && (
            <div className="tab-content">
              <h2>الباقات المشتراة</h2>
              {/* محتوى الباقات */}
            </div>
          )}
          
          {activeTab === 'wallet' && (
            <div className="tab-content">
              <h2>المحفظة المالية</h2>
              {/* محتوى المحفظة */}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}