import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LUPA PH B2B Network — Broker to Broker',
  description: 'Connect with verified brokers and agents across the Philippines. Share listings, co-broke, and grow your network.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
