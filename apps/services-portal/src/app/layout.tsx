import './globals.css'
import { SessionProvider } from '@/components/SessionProvider'
import { ServicesSidebar } from '@/components/ServicesSidebar'

export const metadata = {
  title: 'LUPA PH Services Portal',
  description: 'Find and hire real estate professionals — appraisers, surveyors, notaries, and more.',
}

export default function ServicesPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SessionProvider>
          <div style={{ display: 'flex', height: '100vh', background: '#000' }}>
            <ServicesSidebar />
            <main style={{ flex: 1, overflow: 'auto' }}>
              {children}
            </main>
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}
