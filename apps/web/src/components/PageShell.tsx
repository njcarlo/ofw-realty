import { Navbar } from './Navbar'
import Link from 'next/link'

interface Props {
  children: React.ReactNode
  badge?: string
  title?: string
  subtitle?: string
  backHref?: string
  backLabel?: string
}

export function PageShell({ children, badge, title, subtitle, backHref, backLabel }: Props) {
  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 1596, margin: '0 auto', padding: '100px 162px 80px' }}>
        {backHref && (
          <Link href={backHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            ← {backLabel ?? 'Back'}
          </Link>
        )}
        {(badge || title) && (
          <div style={{ marginBottom: 40 }}>
            {badge && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--purple-dim)', border: '1px solid var(--purple-border)',
                borderRadius: 99, padding: '5px 14px', marginBottom: 16,
              }}>
                <span style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 500 }}>{badge}</span>
              </div>
            )}
            {title && <h1 style={{ fontSize: 40, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px', marginBottom: subtitle ? 12 : 0 }}>{title}</h1>}
            {subtitle && <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7 }}>{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function SectionHeader({ badge, title, subtitle, center = false }: { badge?: string; title: string; subtitle?: string; center?: boolean }) {
  return (
    <div style={{ marginBottom: 40, textAlign: center ? 'center' : 'left' }}>
      {badge && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--purple-dim)', border: '1px solid var(--purple-border)',
          borderRadius: 99, padding: '5px 14px', marginBottom: 16,
        }}>
          <span style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 500 }}>{badge}</span>
        </div>
      )}
      <h2 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: subtitle ? 12 : 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: center ? 520 : '100%', margin: center ? '0 auto' : 0 }}>{subtitle}</p>}
    </div>
  )
}

export function DarkCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, ...style }}>
      {children}
    </div>
  )
}
