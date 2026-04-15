'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { PageShell } from '@/components/PageShell'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Portal URLs — in production these are subdomains; locally they're ports
const PORTAL_URLS: Record<string, string> = {
  realtor:      'https://ofw-realty-agent-portal.vercel.app',
  broker_admin: 'https://ofw-realty-broker-portal.vercel.app',
}

const BUYER_SECTIONS = [
  { icon: '🏠', label: 'Saved Properties',   desc: 'View your saved listings and areas',              href: '/saved',     color: '#703BF7' },
  { icon: '💬', label: 'Active Inquiries',    desc: 'Track your property inquiries and offers',        href: '/inquiries',  color: '#10B981' },
  { icon: '📋', label: 'SPA Workflow',        desc: 'Track your Special Power of Attorney process',    href: '/spa',        color: '#F59E0B' },
  { icon: '📅', label: 'Scheduled Viewings',  desc: 'Upcoming property viewings',                      href: '/viewings',   color: '#8B5CF6' },
  { icon: '💬', label: 'Messages',            desc: 'Chat with agents and brokers',                    href: '/messages',   color: '#EC4899' },
  { icon: '📄', label: 'Document Checklist',  desc: 'Prepare your buyer documents',                    href: '/documents',  color: '#06B6D4' },
]

export default function DashboardPage() {
  const [checking, setChecking] = useState(true)
  const [role, setRole] = useState<string | null>(null)
  const [name, setName] = useState('')

  useEffect(() => {
    async function checkRole() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // Not logged in — show buyer dashboard (guest view)
        setChecking(false)
        return
      }

      const userRole = session.user.user_metadata?.role as string | undefined
      const fullName = session.user.user_metadata?.full_name ?? session.user.email ?? ''
      setName(fullName)
      setRole(userRole ?? 'buyer')

      // Redirect agents and brokers to their dedicated portals
      if (userRole === 'realtor' || userRole === 'broker_admin') {
        const portalUrl = PORTAL_URLS[userRole]
        window.location.href = portalUrl
        return
      }

      setChecking(false)
    }

    checkRole()
  }, [])

  // Show a brief redirect screen for agents/brokers
  if (checking) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #703BF7, #9B6DFF)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px' }}>🏠</div>
          <div style={{ fontSize: 16, color: '#999', marginBottom: 8 }}>Checking your account...</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#703BF7', opacity: 0.4, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }`}</style>
        </div>
      </div>
    )
  }

  // Buyer / guest dashboard
  const firstName = name.split(' ')[0] || 'there'

  return (
    <PageShell
      badge="My Dashboard"
      title={`Welcome back, ${firstName}`}
      subtitle="Track your property journey — from inquiry to keys."
    >
      {/* Role-based portal links for agents/brokers who land here */}
      {(role === 'realtor' || role === 'broker_admin') && (
        <div style={{ background: 'rgba(112,59,247,0.08)', border: '1px solid rgba(112,59,247,0.25)', borderRadius: 12, padding: '16px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 24 }}>{role === 'realtor' ? '👤' : '🏢'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
              You have a {role === 'realtor' ? 'Agent' : 'Broker'} account
            </div>
            <div style={{ fontSize: 13, color: '#595959' }}>
              Your dedicated portal has more tools for managing listings, leads, and commissions.
            </div>
          </div>
          <a
            href={PORTAL_URLS[role]}
            style={{ background: '#703BF7', color: '#fff', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 0 20px rgba(112,59,247,0.3)' }}
          >
            Go to {role === 'realtor' ? 'Agent' : 'Broker'} Portal →
          </a>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {BUYER_SECTIONS.map(section => (
          <Link key={section.label} href={section.href} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 28, cursor: 'pointer' }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: `${section.color}15`, border: `1px solid ${section.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>
                {section.icon}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{section.label}</div>
              <div style={{ fontSize: 13, color: '#595959', lineHeight: 1.5 }}>{section.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  )
}
