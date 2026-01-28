import { AuthProvider } from '@/contexts/AuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="admin-layout">
        <div className="admin-content">
          <main className="admin-main">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}