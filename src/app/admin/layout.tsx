import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import { AuthProvider } from '@/contexts/AuthContext';
import './layout.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="admin-layout">
        <Sidebar />
        <div className="admin-content">
          <Header />
          <main className="admin-main">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}