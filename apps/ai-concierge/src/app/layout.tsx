import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Listahan — Lista ng Broker. Listahan ng Tiwala.',
  description: 'Kausapin si Listahan, ang iyong AI property advisor para sa OFW real estate sa Pilipinas.',
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
