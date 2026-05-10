'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { section: 'Overview', items: [
    { icon: '📊', label: 'Dashboard',      href: '/' },
  ]},
  { section: 'Users & Verification', items: [
    { icon: '👥', label: 'All Users',       href: '/users' },
    { icon: '🔐', label: 'Verifications',   href: '/verifications' },
    { icon: '🏢', label: 'Brokerages',      href: '/brokerages' },
  ]},
  { section: 'Marketplace', items: [
    { icon: '🏘️', label: 'Listings',        href: '/listings' },
    { icon: '💬', label: 'Inquiries',       href: '/inquiries' },
    { icon: '🤝', label: 'Deal Rooms',      href: '/deal-rooms' },
  ]},
  { section: 'Portals', items: [
    { icon: '🏗️', label: 'Developers',      href: '/developers' },
    { icon: '🛠️', label: 'Services',        href: '/services' },
    { icon: '🌐', label: 'B2B Network',     href: '/b2b' },
  ]},
  { section: 'System', items: [
    { icon: '🤖', label: 'AI Concierge',    href: '/ai' },
    { icon: '⚙️', label: 'Settings',        href: '/settings' },
  ]},
]

const PORTAL_LINKS = [
  { label: 'Web',        href: process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000' },
  { label: 'Agent',      href: process.env.NEXT_PUBLIC_AGENT_PORTAL_URL ?? 'http://localhost:3002' },
  { label: 'Broker',     href: process.env.NEXT_PUBLIC_BROKER_PORTAL_URL ?? 'http://localhost:3003' },
  { label: 'Developer',  href: process.env.NEXT_PUBLIC_DEVELOPER_PORTAL_URL ?? 'http://localhost:3005' },
  { label: 'Services',   href: process.env.NEXT_PUBLIC_SERVICES_PORTAL_URL ?? 'http://localhost:3006' },
  { label: 'AI',         href: 'http://localhost:3007' },
  { label: 'B2B',        href: 'http://localhost:3008' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  return (
    <aside style={{ width: 220, background: '#0A0A0A', borderRight: '1px solid #1A1A1A', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, flexShrink: 0, overflowY: 'auto' }}>
      {/* Logo */}
      <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid #1A1A1A' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>LUPA <span style={{ color: '#703BF7' }}>PH</span></div>
        <div style={{ fontSize: 10, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2, fontWeight: 600 }}>Admin Portal</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {NAV.map(group => (
          <div key={group.section} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: '#333', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 10px', marginBottom: 4 }}>{group.section}</div>
            {group.items.map(item => {
              const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 7, marginBottom: 1,
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  background: active ? 'rgba(112,59,247,0.15)' : 'transparent',
                  color: active ? '#703BF7' : '#666',
                  borderLeft: `2px solid ${active ? '#703BF7' : 'transparent'}`,
                }}>
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}

        {/* Live portal links */}
        <div style={{ borderTop: '1px solid #1A1A1A', paddingTop: 12, marginTop: 4 }}>
          <div style={{ fontSize: 10, color: '#333', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 10px', marginBottom: 6 }}>Live Portals</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '0 6px' }}>
            {PORTAL_LINKS.map(p => (
              <a key={p.label} href={p.href} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 10, color: '#595959', background: '#141414', border: '1px solid #1A1A1A', borderRadius: 6, padding: '3px 7px' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#595959')}
              >{p.label} ↗</a>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  )
}
