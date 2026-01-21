'use client'
import Image from 'next/image';

import { useState, useEffect } from 'react'
import { 
  Phone, Mail, MessageCircle, Instagram, Facebook, Youtube, 
  MapPin, Clock, Send, Users, Sparkles, Award, Shield, Zap,
  BookOpen, GraduationCap, Star, ChevronLeft, ChevronRight,
  CheckCircle, Globe, Heart, ThumbsUp, Target, Brain
} from 'lucide-react'
import Link from 'next/link'
import './contact-styles.css'
import { FiFacebook, FiYoutube, FiInstagram, FiTwitter, FiMail, FiPhone } from 'react-icons/fi';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('تم إرسال رسالتك بنجاح! سنتواصل معك قريبًا.')
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }


    const socialLinks = [
      { icon: <FiYoutube />, label: 'يوتيوب', href: 'https://youtube.com' },
      { icon: <FiFacebook />, label: 'فيسبوك', href: 'https://facebook.com' },
      { icon: <FiInstagram />, label: 'انستاجرام', href: 'https://instagram.com' },
    ];
  
  return (
    <div className="contact-container">
      {/* شريط التنقل العلوي */}
      <nav className="navbar">
        <div className="nav-container">
          <Link href="/" className="logo">
            <div className="logo-icon">
              <GraduationCap />
            </div>
            <span className="logo-text">البارع محمود الديب</span>
          </Link>
          
          <div className="nav-links">
            <Link href="/" className="nav-link">الرئيسية</Link>
          </div>
        </div>
      </nav>

      {/* الهيدر الرئيسي */}
      <header className="header">
        <div className="header-content">
          <div className="icon-container float-animation">
<Image
  src="/لوجو1.png"
  alt="Logo"
  width={80}
  height={80}
  priority
/>
          </div>
          
          <h1 className="fade-in">البارع محمود الديب</h1>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="main-content">
          <div className="contact-cards">
            {/* بطاقة الدعم الفني */}
            <div className="contact-card fade-in">
              <div className="contact-header">
                <div className="contact-icon bg-blue-100">
                  <Shield className="text-green-600" />
                </div>
                <div className="contact-header-text">
                  <h4>تواصل مع الدعم</h4>
                </div>
              </div>
              
              <div className="contact-items">
                <div className="contact-item">
                  <div className="contact-item-content">
                    <div className="item-icon bg-green-100">
                      <MessageCircle className="text-black-600" />
                    </div>
                    <div className="item-text">
                      <h5>الدعم الفنى ( التواصل واتساب فقط ) </h5>
                      <p>011 00 196 131</p>
                    </div>
                  </div>
                </div>
                
                <div className="contact-item">
                  <div className="contact-item-content">
                    <div className="item-icon bg-blue-100">
                      <Phone className="text-black-600" />
                    </div>
                    <div className="item-text">
                      <h5>هاتف الدعم العلمي</h5>
                      <p>0120 357 8747</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </main>
    </div>
  )
}