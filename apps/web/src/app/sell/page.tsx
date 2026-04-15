'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const DEMO_LISTINGS = [
  { id: 's1', title: 'House & Lot in Bacoor Cavite', property_type: 'house_and_lot', price_php: 3200000, city: 'Bacoor', province: 'Cavite', status: 'active', views: 142, inquiries: 8, agent_requested: false, created_at: '2026-04-01' },
  { id: 's2', title: 'Lot in Sta. Rosa Laguna', property_type: 'residential_lot', price_php: 1800000, city: 'Sta. Rosa', province: 'Laguna', status: 'active', views: 67, inquiries: 3, agent_requested: true, created_at: '2026-03-15' },
]

const TYPE_LABELS: Record<string, string> = {
  residential_lot: 'Residential Lot', house_and_lot: 'House & Lot',
  condo: 'Condo', commercial: 'Commercial', farm_lot: 'Farm Lot',
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active:      { bg: 'rgba(16,185,129,0.15)', color: '#10B981' },
  reserved:    { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
  sold:        { bg: 'rgba(112,59,247,0.15)', color: '#703BF7' },
  deactivated: { bg: 'rgba(89,89,89,0.15)',   color: '#595959' },
}

export default function SellerDashboard() {
  const [listings, setListings] = useState(DEMO_LISTINGS)
  const [userName, setUserName] = useState('Seller')
  const [toast, setToast] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserName(session.user.user_metadata?.full_name?.split(' ')[0] ?? 'Seller')
      }
    })
  }, [])

  function requestAgent(id: string) {
    setListings(prev => prev.map(l => l.id === id ? { ...l, agent_requested: true } : l))
    setToast('✅ Request sent! Verified agents and brokers will contact you within 24 hours.')
    setTimeout(() => setToast(''), 5000)
  }

  const totalViews = listings.reduce((s, l) => s + l.views, 0)
  const totalInquiries = listings.reduce((s, l) => s + l.inquiries, 0)

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Navbar />

      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, background: '#0D0D0D', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 10, padding: '14px 20px', fontSize: 14, color: '#10B981', zIndex: 9999 }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '100px 32px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(112,59,247,0.1)', border: '1px solid rgba(112,59,247,0.25)', borderRadius: 99, padding: '5px 14px', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#703BF7', fontWeight: 500 }}>Seller Dashboard</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>Welcome back, {userName}</h1>
            <p style={{ fontSize: 14, color: '#595959', margin: 0 }}>Manage your property listings and connect with agents</p>
          </div>
          <Link href="/sell/new" style={{ background: '#703BF7', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', boxShadow: '0 0 20px rgba(112,59,247,0.3)' }}>
            + List a Property
          </Link>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'Active Listings', value: listings.filter(l => l.status === 'active').length, color: '#10B981', icon: '🏠' },
            { label: 'Total Views', value: totalViews, color: '#703BF7', icon: '👁️' },
            { label: 'Inquiries', value: totalInquiries, color: '#F59E0B', icon: '💬' },
            { label: 'Agent Requests', value: listings.filter(l => l.agent_requested).length, color: '#06B6D4', icon: '🤝' },
          ].map(s => (
            <div key={s.label} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: '18px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#595959' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{ background: 'rgba(112,59,247,0.06)', border: '1px solid rgba(112,59,247,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#703BF7', marginBottom: 10 }}>💡 How selling on LUPA PH works</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { step: '1', title: 'List your property', desc: 'Add photos, price, and details' },
              { step: '2', title: 'Get discovered', desc: 'Buyers find you on the map' },
              { step: '3', title: 'Optional: Get an agent', desc: 'Request a verified agent to handle inquiries' },
              { step: '4', title: 'Close the deal', desc: 'Agent or direct — your choice' },
            ].map(s => (
              <div key={s.step} style={{ background: '#0D0D0D', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#703BF7', marginBottom: 4 }}>{s.step}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: '#595959' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Listings */}
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>My Listings</div>

        {listings.length === 0 ? (
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: '60px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#999', marginBottom: 8 }}>No listings yet</div>
            <div style={{ fontSize: 13, color: '#595959', marginBottom: 20 }}>List your first property to start receiving inquiries from buyers</div>
            <Link href="/sell/new" style={{ background: '#703BF7', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              + List a Property
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {listings.map(listing => (
              <div key={listing.id} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{listing.title}</div>
                    <div style={{ fontSize: 13, color: '#595959' }}>
                      {TYPE_LABELS[listing.property_type]} · 📍 {listing.city}, {listing.province} · Listed {listing.created_at}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: STATUS_STYLE[listing.status].bg, color: STATUS_STYLE[listing.status].color, textTransform: 'capitalize' }}>
                      {listing.status}
                    </span>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#703BF7' }}>₱{listing.price_php.toLocaleString()}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Views', value: listing.views, color: '#703BF7' },
                    { label: 'Inquiries', value: listing.inquiries, color: '#F59E0B' },
                    { label: 'Agent', value: listing.agent_requested ? 'Requested' : 'None', color: listing.agent_requested ? '#10B981' : '#595959' },
                  ].map(s => (
                    <div key={s.label} style={{ background: '#141414', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: '#595959', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link href={`/listings/${listing.id}`} style={{ background: 'transparent', color: '#703BF7', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                    View Listing
                  </Link>
                  <Link href={`/sell/edit/${listing.id}`} style={{ background: 'transparent', color: '#999', border: '1px solid #1A1A1A', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                    Edit
                  </Link>
                  {!listing.agent_requested && (
                    <button
                      onClick={() => requestAgent(listing.id)}
                      style={{ background: 'rgba(6,182,212,0.1)', color: '#06B6D4', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      🤝 Request Agent/Broker
                    </button>
                  )}
                  {listing.agent_requested && (
                    <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500 }}>
                      ✓ Agent Notified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
