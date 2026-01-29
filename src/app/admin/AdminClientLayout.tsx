'use client';

import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import { AuthProvider } from '@/contexts/AuthContext';

export default function AdminClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="admin-layout">
        <div className="admin-content">
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}
