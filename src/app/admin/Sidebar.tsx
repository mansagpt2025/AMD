'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaWallet, FaKey, FaCode, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import './Sidebar.css';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { href: '/admin', label: 'الرئيسية', icon: <FaHome /> },
    { href: '/admin/wallet', label: 'المحفظة', icon: <FaWallet /> },
    { href: '/admin/codes', label: 'الأكواد', icon: <FaCode /> },
    { href: '/admin/passwords', label: 'كلمات المرور', icon: <FaKey /> },
  ];

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>لوحة التحكم</h2>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <button className="logout-btn">
            <FaSignOutAlt />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}