import { AdminSidebar } from '@/components/AdminSidebar'

export const metadata = {
  title: 'LUPA PH Admin',
  description: 'Platform administration — verifications, users, listings.',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#000', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ display: 'flex', height: '100vh' }}>
          <AdminSidebar />
          <main style={{ flex: 1, overflow: 'auto' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
