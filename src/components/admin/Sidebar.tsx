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
}