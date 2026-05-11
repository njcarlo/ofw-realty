'use client'
import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://ofw-realty-api-production.up.railway.app'

const SERVICE_TYPE_LABELS: Record<string, string> = {
  property_appraisal:        'Property Appraisal',
  geodetic_survey:           'Geodetic Survey',
  title_transfer:            'Title Transfer',
  notarization:              'Notarization',
  legal_consultation:        'Legal Consultation',
  property_tax_assistance:   'Property Tax Assistance',
  building_permit_processing:'Building Permit Processing',
  other:                     'Other',
}

const DEMO_PROVIDERS = [
  { id: 'p1', full_name: 'Atty. Maria Santos', service_types: ['notarization', 'legal_consultation'], coverage_areas: ['Metro Manila', 'Cavite'], avg_rating: 4.9, completed_engagements: 87, availability: 'available', is_featured: true, license_verification_status: 'verified', bio: 'Licensed attorney with 15 years of experience in real estate law and notarization.' },
  { id: 'p2', full_name: 'Engr. Jose Reyes', service_types: ['geodetic_survey'], coverage_areas: ['Laguna', 'Cavite', 'Batangas'], avg_rating: 4.8, completed_engagements: 64, availability: 'available', is_featured: true, license_verification_status: 'verified', bio: 'Registered geodetic engineer specializing in land surveys and boundary disputes.' },
  { id: 'p3', full_name: 'Maria Cruz, MAE', service_types: ['property_appraisal'], coverage_areas: ['Metro Manila', 'Rizal'], avg_rating: 4.7, completed_engagements: 52, availability: 'busy', is_featured: false, license_verification_status: 'verified', bio: 'Certified real estate appraiser with expertise in residential and commercial properties.' },
  { id: 'p4', full_name: 'Pedro Dela Cruz', service_types: ['title_transfer', 'property_tax_assistance'], coverage_areas: ['Cebu', 'Negros Occidental'], avg_rating: 4.5, completed_engagements: 38, availability: 'available', is_featured: false, license_verification_status: 'verified', bio: 'Specializes in title transfer processing and property tax compliance.' },
]

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span style={{ fontSize: 12, color: '#595959' }}>No ratings yet</span>
  return (
    <span style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600 }}>
      ★ {rating.toFixed(1)}
    </span>
  )
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [filterAvailability, setFilterAvailability] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (filterType) params.set('service_type', filterType)
    if (filterAvailability) params.set('availability', filterAvailability)

    fetch(`${API}/service-providers?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.length) {
          setProviders(data)
        } else {
          setProviders(DEMO_PROVIDERS)
          setIsDemo(true)
        }
      })
      .catch(() => { setProviders(DEMO_PROVIDERS); setIsDemo(true) })
      .finally(() => setLoading(false))
  }, [filterType, filterAvailability])

  const filtered = providers.filter(p => {
    if (filterType && !p.service_types?.includes(filterType)) return false
    if (filterAvailability && p.availability !== filterAvailability) return false
    return true
  })

  // Featured first, then by rating desc
  const sorted = [...filtered].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1
    if (!a.is_featured && b.is_featured) return 1
    return (b.avg_rating ?? 0) - (a.avg_rating ?? 0)
  })

  return (
    <div style={{ padding: 32, fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>Service Providers</h1>
          <p style={{ fontSize: 14, color: '#595959', margin: '6px 0 0' }}>
            Browse licensed real estate professionals available in your area.
          </p>
        </div>
        <a
          href="/dashboard/provider/register"
          style={{ background: '#0D0D0D', color: '#703BF7', border: '1px solid rgba(112,59,247,0.3)', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}
        >
          Register as Provider
        </a>
      </div>

      {isDemo && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#F59E0B' }}>
          ⚠️ Showing sample providers — API not yet connected.
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
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
        <select
          value={filterAvailability}
          onChange={e => setFilterAvailability(e.target.value)}
          style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: filterAvailability ? '#fff' : '#595959', cursor: 'pointer', outline: 'none' }}
        >
          <option value="">All Availability</option>
          <option value="available">Available</option>
          <option value="busy">Busy</option>
        </select>
        {(filterType || filterAvailability) && (
          <button
            onClick={() => { setFilterType(''); setFilterAvailability('') }}
            style={{ background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}
          >
            Clear filters
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#595959', alignSelf: 'center' }}>
          {sorted.length} provider{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div style={{ color: '#595959', fontSize: 14 }}>Loading providers…</div>
      ) : sorted.length === 0 ? (
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: '40px 32px', textAlign: 'center', color: '#595959' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👷</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 6 }}>No providers found</div>
          <div style={{ fontSize: 13 }}>Try adjusting your filters.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {sorted.map(provider => (
            <div
              key={provider.id}
              style={{
                background: '#0D0D0D',
                border: `1px solid ${provider.is_featured ? 'rgba(245,158,11,0.3)' : '#1A1A1A'}`,
                borderRadius: 12,
                padding: '20px 22px',
                position: 'relative',
              }}
            >
              {provider.is_featured && (
                <span style={{ position: 'absolute', top: 14, right: 14, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⭐ Featured
                </span>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(112,59,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  👤
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{provider.full_name}</span>
                    {provider.license_verification_status === 'verified' && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                        ✓ Licensed
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#595959', marginTop: 3 }}>
                    {provider.coverage_areas?.slice(0, 2).join(', ')}
                    {provider.coverage_areas?.length > 2 && ` +${provider.coverage_areas.length - 2} more`}
                  </div>
                </div>
              </div>

              {/* Service types */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {provider.service_types?.map((t: string) => (
                  <span key={t} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: 'rgba(112,59,247,0.1)', color: '#703BF7', border: '1px solid rgba(112,59,247,0.2)' }}>
                    {SERVICE_TYPE_LABELS[t] ?? t}
                  </span>
                ))}
              </div>

              {/* Bio */}
              {provider.bio && (
                <p style={{ fontSize: 12, color: '#595959', margin: '0 0 14px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {provider.bio}
                </p>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #141414' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <StarRating rating={provider.avg_rating} />
                  <span style={{ fontSize: 12, color: '#595959' }}>{provider.completed_engagements} completed</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: provider.availability === 'available' ? 'rgba(16,185,129,0.15)' : 'rgba(89,89,89,0.15)', color: provider.availability === 'available' ? '#10B981' : '#595959' }}>
                    {provider.availability === 'available' ? '● Available' : '○ Busy'}
                  </span>
                  <a
                    href={`/providers/${provider.id}`}
                    style={{ fontSize: 12, color: '#703BF7', padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(112,59,247,0.3)', background: 'rgba(112,59,247,0.08)', textDecoration: 'none' }}
                  >
                    View Profile
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
