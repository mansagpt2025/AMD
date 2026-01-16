import './globals.css'

export const metadata = {
  title: 'Mahmoud Eldeb Platform',
  description: 'Educational Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar">
      <body>{children}</body>
    </html>
  )
}
