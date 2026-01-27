'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Key,
  Wallet,
  BookOpen,
  GraduationCap,
  Package,
  LogOut
} from 'lucide-react';

const menuItems = [
  { href: '/admin', icon: Home, label: 'الرئيسية' },
  { href: '/admin/first-secondary', icon: BookOpen, label: 'الصف الأول الثانوي' },
  { href: '/admin/second-secondary', icon: BookOpen, label: 'الصف الثاني الثانوي' },
  { href: '/admin/third-secondary', icon: BookOpen, label: 'الصف الثالث الثانوي' },
  { href: '/admin/codes', icon: Key, label: 'الأكواد' },
  { href: '/admin/students', icon: Users, label: 'إدارة الطلاب' },
  { href: '/admin/password', icon: Package, label: 'كلمة المرور' },
  { href: '/admin/wallet', icon: Wallet, label: 'المحفظة' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed right-0 top-0 h-screen w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-xl">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-white/10 rounded-lg">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold">الديب أكاديمي</h1>
            <p className="text-sm text-blue-200">لوحة التحكم الإدارية</p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white/20 text-white shadow-md'
                    : 'hover:bg-white/10 text-blue-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 right-0 left-0 px-6">
          <button className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </aside>
  );
}