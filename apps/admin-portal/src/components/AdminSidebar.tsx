'use client'
import { usePathname } from 'next/navigation'

const NAV = [
  { icon: '📋', label: 'Verifications',  href: '/' },
  { icon: '👥', label: 'Users',          href: '/users' },
  { icon: '🏠', label: 'Listings',       href: '/listings' },
  { icon: '🏢', label: 'Brokerages',     href: '/brokerages' },
  { icon: '🤝', label: 'Deal Rooms',     href: '/deal-rooms' },
  { icon: '📊', label: 'Inquiries',      href: '/inquiries' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  return (
    <aside style={{
      width: 240,
      background: '#0D0D0D',
      borderRight: '1px solid #1A1A1A',
      padding: '24px 0',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100vh',
      position: 'sticky',
      top: 0,
    }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #1A1A1A' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
          LUPA <span style={{ color: '#703BF7' }}>PH</span>
        </div>
        <div style={{ fontSize: 11, color: '#595959', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Admin Portal
        </div>
      </div>

      <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
        {NAV.map(item => {
          const active = pathname === item.href
          return (
            <a
              key={item.label}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                marginBottom: 2,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
                background: active ? 'rgba(112,59,247,0.15)' : 'transparent',
                color: active ? '#703BF7' : '#595959',
                borderLeft: active ? '2px solid #703BF7' : '2px solid transparent',
              }}
            >
              <span>{item.icon}</span>{item.label}
            </a>
          )
        })}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #1A1A1A' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
            🛡️
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Admin</div>
            <div style={{ fontSize: 11, color: '#595959' }}>LUPA PH Platform</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
