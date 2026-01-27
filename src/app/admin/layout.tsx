import AdminSidebar from '@/components/admin/Sidebar';
import AdminHeader from '@/components/admin/Header';
import { verifyAdmin } from '@/lib/auth-admin';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'لوحة تحكم إدارة المنصة',
  description: 'لوحة تحكم إدارة المنصة التعليمية للثانوية العامة',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // التحقق من صلاحية المدير
  const isAdmin = await verifyAdmin();
  
  if (!isAdmin) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="mr-64"> {/* مساحة للشريط الجانبي */}
        <AdminHeader />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}