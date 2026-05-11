'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://ofw-realty-api-production.up.railway.app'

const SERVICE_TYPE_LABELS: Record<string, string> = {
  property_appraisal:         'Property Appraisal',
  geodetic_survey:            'Geodetic Survey',
  title_transfer:             'Title Transfer',
  notarization:               'Notarization',
  legal_consultation:         'Legal Consultation',
  property_tax_assistance:    'Property Tax Assistance',
  building_permit_processing: 'Building Permit Processing',
  other:                      'Other',
}

const DEMO_REQUESTS = [
  { id: 'r1', service_type: 'property_appraisal', description: 'Need appraisal for a 200sqm residential lot in Bacoor for bank loan purposes.', province: 'Cavite', city: 'Bacoor', status: 'open', proposal_count: 2, created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'r2', service_type: 'title_transfer', description: 'Transfer of title for inherited property in Quezon City. Seller is abroad.', province: 'Metro Manila', city: 'Quezon City', status: 'open', proposal_count: 5, created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'r3', service_type: 'geodetic_survey', description: 'Boundary survey needed for a 500sqm lot in Sta. Rosa before subdivision.', province: 'Laguna', city: 'Sta. Rosa', status: 'open', proposal_count: 1, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'r4', service_type: 'notarization', description: 'SPA notarization for OFW buyer in Dubai. Need assistance with consular process.', province: 'Metro Manila', city: 'Makati', status: 'open', proposal_count: 3, created_at: new Date(Date.now() - 86400000).toISOString() },
]

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 1) return 'Just now'
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function RequestsContent() {
  const searchParams = useSearchParams()
  const justPosted = searchParams.get('posted') === '1'

  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [filterType, setFilterType] = useState('')

  useEffect(() => {
    const params = new URLSearchParams({ status: 'open' })
    if (filterType) params.set('service_type', filterType)

    fetch(`${API}/service-requests?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.length) {
          setRequests(data)
        } else {
          setRequests(DEMO_REQUESTS)
          setIsDemo(true)
        }
      })
      .catch(() => { setRequests(DEMO_REQUESTS); setIsDemo(true) })
      .finally(() => setLoading(false))
  }, [filterType])

  const filtered = filterType
    ? requests.filter(r => r.service_type === filterType)
    : requests

  return (
    <div style={{ padding: 32, fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>Service Requests</h1>
          <p style={{ fontSize: 14, color: '#595959', margin: '6px 0 0' }}>
            Open requests from buyers, sellers, and developers.
          </p>
        </div>
        <a
          href="/requests/new"
          style={{ background: '#703BF7', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: '0 0 20px rgba(112,59,247,0.3)', textDecoration: 'none' }}
        >
          + Post Request
        </a>
      </div>

      {/* Success banner after posting */}
      {justPosted && (
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#10B981', display: 'flex', alignItems: 'center', gap: 8 }}>
          ✅ Your request has been posted. Providers will respond with proposals.
        </div>
      )}

      {isDemo && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#F59E0B' }}>
          ⚠️ Showing sample requests — API not yet connected.
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: filterType ? '#fff' : '#595959', cursor: 'pointer', outline: 'none' }}
        >
          <option value="">All Service Types</option>
          {Object.entries(SERVICE_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        {filterType && (
          <button onClick={() => setFilterType('')} style={{ background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>
            Clear
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#595959' }}>
          {filtered.length} open request{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div style={{ color: '#595959', fontSize: 14 }}>Loading requests…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: '40px 32px', textAlign: 'center', color: '#595959' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 6 }}>No open requests</div>
          <div style={{ fontSize: 13 }}>Be the first to post a service request.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(req => (
            <a
              key={req.id}
              href={`/requests/${req.id}`}
              style={{ display: 'block', background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: '18px 20px', textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: 'rgba(112,59,247,0.1)', color: '#703BF7', border: '1px solid rgba(112,59,247,0.2)' }}>
                    {SERVICE_TYPE_LABELS[req.service_type] ?? req.service_type}
                  </span>
                  <span style={{ fontSize: 12, color: '#595959' }}>📍 {req.city}, {req.province}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                  {req.proposal_count > 0 && (
                    <span style={{ fontSize: 12, color: '#10B981' }}>{req.proposal_count} proposal{req.proposal_count !== 1 ? 's' : ''}</span>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                    Open
                  </span>
                  <span style={{ fontSize: 11, color: '#595959' }}>{timeAgo(req.created_at)}</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#999', margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {req.description}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RequestsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32, color: '#595959', fontSize: 14 }}>Loading…</div>}>
      <RequestsContent />
    </Suspense>
  )
}
