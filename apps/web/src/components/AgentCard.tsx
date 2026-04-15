'use client'
import { useState } from 'react'
import Link from 'next/link'

interface Props {
  agent: {
    id: string
    slug: string
    prc_license_number?: string
    verified_badge?: boolean
    users?: { full_name: string; avatar_url?: string }
    broker_companies?: { name: string; slug: string }
  }
}

export function AgentCard({ agent }: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link href={`/agents/${agent.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          background: '#0D0D0D',
          border: `1px solid ${hovered ? 'rgba(112,59,247,0.3)' : '#1A1A1A'}`,
          borderRadius: 12, padding: 24, cursor: 'pointer',
          transition: 'border-color 0.2s, transform 0.2s',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(112,59,247,0.1)', border: '1px solid rgba(112,59,247,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, flexShrink: 0, overflow: 'hidden',
          }}>
            {agent.users?.avatar_url
              ? <img src={agent.users.avatar_url} style={{ width: 56, height: 56, objectFit: 'cover' }} alt="" />
              : '👤'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {agent.users?.full_name}
            </div>
            {agent.broker_companies && (
              <div style={{ fontSize: 12, color: '#595959', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                🏢 {agent.broker_companies.name}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {agent.verified_badge && (
            <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, border: '1px solid rgba(16,185,129,0.2)' }}>
              ✓ Verified
            </span>
          )}
          {agent.prc_license_number && (
            <span style={{ background: 'rgba(112,59,247,0.1)', color: '#703BF7', fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 99, border: '1px solid rgba(112,59,247,0.2)' }}>
              PRC Licensed
            </span>
          )}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 14, borderTop: '1px solid #1A1A1A',
          fontSize: 13, color: '#703BF7', fontWeight: 600,
        }}>
          View Profile
          <span>→</span>
        </div>
      </div>
    </Link>
  )
}
