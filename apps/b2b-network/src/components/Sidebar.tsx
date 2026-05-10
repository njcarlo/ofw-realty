'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  { icon: '🏠', label: 'Feed',         href: '/feed' },
  { icon: '🔍', label: 'Discover',     href: '/discover' },
  { icon: '🤝', label: 'My Network',   href: '/network' },
  { icon: '🏘️', label: 'Listings',     href: '/listings' },
  { icon: '🛠️', label: 'Services',     href: '/services' },
  { icon: '💬', label: 'Messages',     href: '/messages' },
  { icon: '👤', label: 'My Profile',   href: '/profile' },
  { icon: '🔐', label: 'Verification', href: '/verify' },
]

const PORTAL_LINKS = [
  { icon: '🌐', label: 'Web Listings',    href: process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000' },
  { icon: '👤', label: 'Agent Portal',    href: process.env.NEXT_PUBLIC_AGENT_PORTAL_URL ?? 'http://localhost:3002' },
  { icon: '🏢', label: 'Broker Portal',   href: process.env.NEXT_PUBLIC_BROKER_PORTAL_URL ?? 'http://localhost:3003' },
  { icon: '🛠️', label: 'Services Portal', href: process.env.NEXT_PUBLIC_SERVICES_PORTAL_URL ?? 'http://localhost:3006' },
]

interface SidebarProps {
  profile?: {
    id?: string
    display_name: string
    headline?: string
    avatar_url?: string
    prc_verified: boolean
    connection_count: number
    listing_count?: number
    post_count?: number
  }
  pendingCount?: number
}

export function Sidebar({ profile, pendingCount = 0 }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 260, background: '#0D0D0D', borderRight: '1px solid #1A1A1A',
      display: 'flex', flexDirection: 'column', height: '100vh',
      position: 'sticky', top: 0, flexShrink: 0, overflowY: 'auto',
    }}>
      <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid #1A1A1A' }}>
        <Link href="/feed" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#703BF7,#9B6DFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 0 16px rgba(112,59,247,0.4)' }}>🏠</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1 }}>LUPA <span style={{ color: '#703BF7' }}>PH</span></div>
            <div style={{ fontSize: 9, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.1em' }}>B2B Network</div>
          </div>
        </Link>
      </div>

      {profile && (
        <Link href="/profile" style={{ padding: '14px 16px', borderBottom: '1px solid #1A1A1A', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(112,59,247,0.04)' }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(112,59,247,0.2)', border: '2px solid rgba(112,59,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, overflow: 'hidden' }}>
            {profile.avatar_url ? <img src={profile.avatar_url} style={{ width: 42, height: 42, objectFit: 'cover' }} alt="" /> : '👤'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.display_name}</span>
              {profile.prc_verified && <span style={{ fontSize: 10, color: '#10B981', flexShrink: 0 }}>✓</span>}
            </div>
            <div style={{ fontSize: 11, color: '#595959', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.headline ?? 'Real Estate Professional'}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
              <span style={{ fontSize: 10, color: '#703BF7' }}>{profile.connection_count} connections</span>
              {profile.listing_count !== undefined && <span style={{ fontSize: 10, color: '#595959' }}>{profile.listing_count} listings</span>}
            </div>
          </div>
        </Link>
      )}

      <nav style={{ padding: '10px 10px', flex: 1 }}>
        {NAV.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const badge = item.href === '/network' && pendingCount > 0 ? pendingCount : 0
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, marginBottom: 2,
              fontSize: 14, fontWeight: active ? 600 : 400,
              background: active ? 'rgba(112,59,247,0.15)' : 'transparent',
              color: active ? '#703BF7' : '#999',
              borderLeft: '2px solid ' + (active ? '#703BF7' : 'transparent'),
              transition: 'all 0.1s', position: 'relative',
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {badge > 0 && (
                <span style={{ background: '#703BF7', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, minWidth: 18, textAlign: 'center' }}>{badge}</span>
              )}
            </Link>
          )
        })}

        <div style={{ height: 1, background: '#1A1A1A', margin: '12px 4px' }} />
        <div style={{ fontSize: 10, color: '#333', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 12px', marginBottom: 8 }}>Other Portals</div>
        {PORTAL_LINKS.map(p => (
          <a key={p.href} href={p.href} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 12px', borderRadius: 8, marginBottom: 2,
            fontSize: 12, color: '#595959', transition: 'color 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#595959')}
          >
            <span>{p.icon}</span><span style={{ flex: 1 }}>{p.label}</span><span style={{ fontSize: 10 }}>↗</span>
          </a>
        ))}
      </nav>
    </aside>
  )
}
