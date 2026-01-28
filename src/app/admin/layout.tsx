import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import { AuthProvider } from '@/contexts/AuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <html lang="ar" dir="rtl">
        <head>
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
            integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        </head>
        <body>
          <div className="admin-layout">
            <Sidebar />
            <div className="admin-content">
              <Header />
              <main className="admin-main">{children}</main>
            </div>
          </div>
        </body>
      </html>
    </AuthProvider>
  );
}