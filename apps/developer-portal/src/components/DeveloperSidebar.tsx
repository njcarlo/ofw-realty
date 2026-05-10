'use client'
import { usePathname } from 'next/navigation'

const NAV = [
  { icon: '📊', label: 'Dashboard',       href: '/' },
  { icon: '🏗️', label: 'Projects',        href: '/projects' },
  { icon: '🤝', label: 'Broker Network',  href: '/connections' },
  { icon: '🔍', label: 'Find Brokers',    href: '/brokers' },
  { icon: '📋', label: 'Reservations',    href: '/reservations' },
  { icon: '💰', label: 'Commissions',     href: '/commissions' },
  { icon: '👤', label: 'In-House Agents', href: '/in-house-agents' },
  { icon: '🏢', label: 'Company Profile', href: '/profile' },
  { icon: '🔔', label: 'Notifications',   href: '/notifications' },
]

interface DeveloperSidebarProps {
  verified?: boolean
  companyName?: string
}

export function DeveloperSidebar({ verified = false, companyName = 'My Company' }: DeveloperSidebarProps) {
  const pathname = usePathname()
  return (
    <aside style={{ width: 240, background: '#0D0D0D', borderRight: '1px solid #1A1A1A', padding: '24px 0', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh', position: 'sticky', top: 0 }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #1A1A1A' }}>
        <a href="/" style={{ display: 'block' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>LUPA <span style={{ color: '#703BF7' }}>PH</span></div>
          <div style={{ fontSize: 11, color: '#595959', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Developer Portal</div>
        </a>
        {verified && (
          <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 99, padding: '3px 10px' }}>
            <span style={{ fontSize: 11 }}>✓</span>
            <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>Verified Developer</span>
          </div>
        )}
      </div>
      <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
        {NAV.map(item => {
          const active = pathname === item.href
          return (
            <a key={item.label} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, marginBottom: 2,
              fontSize: 14, fontWeight: 500,
              background: active ? 'rgba(112,59,247,0.15)' : 'transparent',
              color: active ? '#703BF7' : '#595959',
              borderLeft: active ? '2px solid #703BF7' : '2px solid transparent',
            }}>
              <span>{item.icon}</span>{item.label}
            </a>
          )
        })}
      </nav>
      <div style={{ padding: '16px 20px', borderTop: '1px solid #1A1A1A' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(112,59,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏗️</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{companyName}</div>
            <div style={{ fontSize: 11, color: '#595959' }}>Developer Account</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
