'use client'

import { Wallet } from 'lucide-react'
import './WelcomeCard.css'

interface WelcomeCardProps {
  studentName: string
  walletBalance: number
}

export default function WelcomeCard({ studentName, walletBalance }: WelcomeCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="welcome-card">
      <div className="welcome-content">
        <div className="welcome-text">
          <h1>مرحباً بعودتك، <span className="highlight">{studentName}</span>! 👋</h1>
          <p>استمر في رحلتك التعليمية نحو التفوق والتميز</p>
        </div>
        
        <div className="wallet-card">
          <div className="wallet-icon">
            <Wallet />
          </div>
          <div className="wallet-info">
            <span className="wallet-label">رصيدك المتاح</span>
            <span className="wallet-amount">{formatCurrency(walletBalance)}</span>
          </div>
          <button className="add-funds-button">إضافة رصيد</button>
        </div>
      </div>
    </div>
  )
}