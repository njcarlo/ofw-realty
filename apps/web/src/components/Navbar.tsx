'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from './ThemeProvider'
import { DemoLoginPanel } from './DemoLoginPanel'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/map', label: 'Find Properties' },
  { href: '/sell', label: 'Sell' },
  { href: '/agents', label: 'Agents' },
  { href: '/brokers', label: 'Brokerages' },
  { href: '/spa', label: 'SPA Guide' },
  { href: '/remittance', label: 'Remittance' },
]

export function Navbar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const [showDemo, setShowDemo] = useState(false)
  const isDark = theme === 'dark'

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: isDark ? 'rgba(0,0,0,0.92)' : 'rgba(255,255,255,0.98)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${isDark ? '#1A1A1A' : '#E5E7EB'}`,
        height: 80,
        display: 'flex', alignItems: 'center',
        padding: '0 40px',
        justifyContent: 'space-between',
        transition: 'background 0.2s, border-color 0.2s',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40,
            background: 'linear-gradient(135deg, #703BF7 0%, #9B6DFF 100%)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, boxShadow: '0 0 24px rgba(112,59,247,0.5)',
          }}>🏠</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: isDark ? '#fff' : '#111', letterSpacing: '-0.5px', lineHeight: 1 }}>
              LUPA <span style={{ color: '#703BF7' }}>PH</span>
            </div>
            <div style={{ fontSize: 9, color: isDark ? '#595959' : '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 1 }}>
              Lots · Units · Properties Anywhere
            </div>
          </div>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {NAV_LINKS.map(link => {
            const active = pathname === link.href
            return (
              <Link key={link.href} href={link.href} style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                color: active ? (isDark ? '#fff' : '#111') : (isDark ? '#999' : '#6B7280'),
                background: active ? (isDark ? '#1A1A1A' : '#F3F4F6') : 'transparent',
                border: active ? `1px solid ${isDark ? '#262626' : '#E5E7EB'}` : '1px solid transparent',
                transition: 'all 0.15s',
              }}>
                {link.label}
              </Link>
            )
          })}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Theme toggle — disabled, dark mode only */}
          {/* <button onClick={toggle} ... /> */}

          {/* Demo login button — temporary for testing */}
          <button
            onClick={() => setShowDemo(v => !v)}
            style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'rgba(245,158,11,0.1)', color: '#F59E0B',
              border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🧪 Demo
          </button>

          <Link href="/login" style={{
            padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500,
            color: isDark ? '#999' : '#6B7280',
            border: `1px solid ${isDark ? '#262626' : '#E5E7EB'}`,
            background: 'transparent', transition: 'all 0.15s',
          }}>
            Sign In
          </Link>
          <Link href="/login" style={{
            padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600,
            background: '#703BF7', color: '#fff',
            boxShadow: '0 0 24px rgba(112,59,247,0.35)',
          }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Demo login panel */}
      {showDemo && <DemoLoginPanel onClose={() => setShowDemo(false)} />}
    </>
  )
}
