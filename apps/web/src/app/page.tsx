import { Navbar } from '@/components/Navbar'
import { ListingsGrid } from '@/components/ListingsGrid'
import { FeaturesGrid } from '@/components/FeaturesGrid'
import { CategoryFilter } from '@/components/CategoryFilter'
import Link from 'next/link'
import { Suspense } from 'react'

const STATS = [
  { value: '7,500+', label: 'Properties Listed' },
  { value: '3,200+', label: 'Happy Clients' },
  { value: '15+', label: 'Years Experience' },
  { value: '100%', label: 'Blockchain Verified' },
]

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'House & Lot', value: 'house_and_lot' },
  { label: 'Condo', value: 'condo' },
  { label: 'Lot', value: 'residential_lot' },
  { label: 'Farm Lot', value: 'farm_lot' },
  { label: 'Commercial', value: 'commercial' },
]

const DEMO_LISTINGS = [
  { id: 'd1', title: 'Modern House & Lot in Bacoor Cavite', property_type: 'house_and_lot', price_php: 3200000, city: 'Bacoor', province: 'Cavite', lot_area_sqm: 120, is_featured: true, blockchain_verified: true, scam_flagged: false, status: 'active', listing_photos: [{ url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80', is_primary: true }], realtors: { users: { full_name: 'Maria Santos' }, verified_badge: true } },
  { id: 'd2', title: 'Condo Unit in Cebu IT Park', property_type: 'condo', price_php: 4500000, city: 'Cebu City', province: 'Cebu', lot_area_sqm: 32, is_featured: true, blockchain_verified: true, scam_flagged: false, status: 'active', listing_photos: [{ url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80', is_primary: true }], realtors: { users: { full_name: 'Juan Santos' }, verified_badge: true } },
  { id: 'd3', title: 'Residential Lot in Sta. Rosa Laguna', property_type: 'residential_lot', price_php: 1800000, city: 'Sta. Rosa', province: 'Laguna', lot_area_sqm: 200, is_featured: false, blockchain_verified: true, scam_flagged: false, status: 'active', listing_photos: [{ url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80', is_primary: true }], realtors: { users: { full_name: 'Ana Cruz' }, verified_badge: false } },
  { id: 'd4', title: 'Farm Lot in Batangas', property_type: 'farm_lot', price_php: 2500000, city: 'Lipa', province: 'Batangas', lot_area_sqm: 1000, is_featured: false, blockchain_verified: false, scam_flagged: false, status: 'active', listing_photos: [{ url: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=600&q=80', is_primary: true }], realtors: { users: { full_name: 'Pedro Reyes' }, verified_badge: false } },
  { id: 'd5', title: 'House & Lot in Davao City', property_type: 'house_and_lot', price_php: 5800000, city: 'Davao City', province: 'Davao del Sur', lot_area_sqm: 180, is_featured: true, blockchain_verified: true, scam_flagged: false, status: 'active', listing_photos: [{ url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80', is_primary: true }], realtors: { users: { full_name: 'Liza Flores' }, verified_badge: true } },
  { id: 'd6', title: 'Commercial Space in BGC Taguig', property_type: 'commercial', price_php: 12000000, city: 'Taguig', province: 'Metro Manila', lot_area_sqm: 85, is_featured: false, blockchain_verified: true, scam_flagged: false, status: 'active', listing_photos: [{ url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80', is_primary: true }], realtors: { users: { full_name: 'Carlo Mendoza' }, verified_badge: true } },
]

async function getListings(type?: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? ''
  if (!apiUrl) return type ? DEMO_LISTINGS.filter(l => l.property_type === type) : DEMO_LISTINGS
  const params = new URLSearchParams()
  if (type) params.set('property_type', type)
  try {
    const res = await fetch(`${apiUrl}/listings?${params}`, { next: { revalidate: 60 } })
    if (!res.ok) return type ? DEMO_LISTINGS.filter(l => l.property_type === type) : DEMO_LISTINGS
    const data = await res.json()
    return data.length > 0 ? data : (type ? DEMO_LISTINGS.filter((l: any) => l.property_type === type) : DEMO_LISTINGS)
  } catch { return type ? DEMO_LISTINGS.filter(l => l.property_type === type) : DEMO_LISTINGS }
}

export const dynamic = 'force-dynamic'

export default async function HomePage({ searchParams }: { searchParams: { type?: string } }) {
  const listings = await getListings(searchParams.type)

  return (
    <div style={{ background: '#000', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh' }}>
      <Navbar />

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh',
        padding: '160px 162px 100px',
        background: '#000',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* Subtle grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          pointerEvents: 'none',
        }} />
        {/* Purple glow */}
        <div style={{
          position: 'absolute', top: '20%', right: '10%',
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(112,59,247,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1596, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          {/* Left */}
          <div>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(112,59,247,0.1)', border: '1px solid rgba(112,59,247,0.25)',
              borderRadius: 99, padding: '6px 16px', marginBottom: 28,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#703BF7' }} />
              <span style={{ fontSize: 13, color: '#703BF7', fontWeight: 500 }}>No. 1 OFW Real Estate Platform</span>
            </div>

            <h1 style={{
              fontSize: 72, fontWeight: 800, lineHeight: 1.0,
              letterSpacing: '-2.5px', marginBottom: 24, color: '#fff',
            }}>
              Discover Your<br />
              Dream <span style={{ color: '#703BF7' }}>Property</span><br />
              in the Philippines
            </h1>

            <p style={{ fontSize: 18, color: '#999', lineHeight: 1.7, marginBottom: 40, maxWidth: 500 }}>
              Your journey to finding the perfect property begins here. Explore our listings with blockchain-verified agents — from anywhere in the world.
            </p>

            <div style={{ display: 'flex', gap: 14, marginBottom: 60 }}>
              <Link href="/map" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#703BF7', color: '#fff',
                padding: '14px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600,
                boxShadow: '0 0 32px rgba(112,59,247,0.4)',
              }}>
                Explore Properties
              </Link>
              <Link href="/agents" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'transparent', color: '#fff',
                padding: '14px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600,
                border: '1px solid #262626',
              }}>
                Find an Agent →
              </Link>
            </div>

            {/* Stats row */}
            <div style={{
              display: 'flex', gap: 0,
              border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden',
              background: '#0D0D0D',
            }}>
              {STATS.map((stat, i) => (
                <div key={stat.label} style={{
                  flex: 1, padding: '20px 24px', textAlign: 'center',
                  borderRight: i < STATS.length - 1 ? '1px solid #1A1A1A' : 'none',
                }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: '#595959' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Property showcase */}
          <div style={{ position: 'relative' }}>
            {/* Main card */}
            <div style={{
              background: '#141414', border: '1px solid #1A1A1A', borderRadius: 16,
              overflow: 'hidden',
            }}>
              <div style={{ position: 'relative', height: 320 }}>
                <img
                  src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=700&q=80"
                  alt="Featured property"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(20,20,20,0.9) 0%, rgba(20,20,20,0.2) 60%, transparent 100%)',
                }} />
                <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8 }}>
                  <span style={{ background: '#703BF7', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99 }}>⭐ Featured</span>
                  <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, border: '1px solid rgba(16,185,129,0.3)' }}>✓ Verified</span>
                </div>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#595959', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Condo · BGC, Taguig</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Modern Studio in BGC</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#703BF7' }}>₱4.5M</div>
                    <div style={{ fontSize: 11, color: '#595959' }}>≈ $79,000</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, paddingTop: 16, borderTop: '1px solid #1A1A1A' }}>
                  {[['🏢', '32 sqm'], ['📍', 'BGC'], ['✓', 'PRC Verified']].map(([icon, label]) => (
                    <span key={label} style={{ fontSize: 12, color: '#595959', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {icon} {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div style={{
              position: 'absolute', bottom: -16, right: -16,
              background: '#141414', border: '1px solid #1A1A1A', borderRadius: 12,
              padding: '14px 18px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>
              <div style={{ fontSize: 10, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>OFW Friendly</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>✈️ Buy from Abroad</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED PROPERTIES ── */}
      <section style={{ padding: '80px 162px', background: '#000', borderTop: '1px solid #0D0D0D' }}>
        <div style={{ maxWidth: 1596, margin: '0 auto' }}>
          {/* Section header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(112,59,247,0.1)', border: '1px solid rgba(112,59,247,0.25)',
                borderRadius: 99, padding: '5px 14px', marginBottom: 16,
              }}>
                <span style={{ fontSize: 12, color: '#703BF7', fontWeight: 500 }}>Featured Properties</span>
              </div>
              <h2 style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: '-1px', lineHeight: 1.1 }}>
                Discover a World of<br />Possibilities
              </h2>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* Category filters */}
              <Suspense fallback={<div style={{ height: 44 }} />}>
                <CategoryFilter />
              </Suspense>
              <Link href="/map" style={{
                padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: '1px solid #262626', color: '#999', background: 'transparent',
              }}>
                View All →
              </Link>
            </div>
          </div>

          {/* Listings */}
          <ListingsGrid listings={listings} />
        </div>
      </section>

      {/* ── WHY LUPAPH ── */}
      <section style={{ padding: '80px 162px', background: '#000', borderTop: '1px solid #0D0D0D' }}>
        <div style={{ maxWidth: 1596, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(112,59,247,0.1)', border: '1px solid rgba(112,59,247,0.25)',
              borderRadius: 99, padding: '5px 14px', marginBottom: 16,
            }}>
              <span style={{ fontSize: 12, color: '#703BF7', fontWeight: 500 }}>Our Value</span>
            </div>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: '-1px', marginBottom: 16 }}>
              The LUPAPH Advantage
            </h2>
            <p style={{ fontSize: 16, color: '#595959', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              Built specifically for OFWs — every feature solves a real problem Filipinos abroad face when buying property back home.
            </p>
          </div>
          <FeaturesGrid />
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '80px 162px', background: '#000', borderTop: '1px solid #0D0D0D' }}>
        <div style={{ maxWidth: 1596, margin: '0 auto' }}>
          <div style={{
            background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 20,
            padding: '64px 80px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 32,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', right: -100, top: -100,
              width: 400, height: 400,
              background: 'radial-gradient(circle, rgba(112,59,247,0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(112,59,247,0.1)', border: '1px solid rgba(112,59,247,0.25)',
                borderRadius: 99, padding: '5px 14px', marginBottom: 16,
              }}>
                <span style={{ fontSize: 12, color: '#703BF7', fontWeight: 500 }}>Start Your Journey</span>
              </div>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 12 }}>
                Your Dream Property<br />Awaits
              </h2>
              <p style={{ fontSize: 16, color: '#595959', maxWidth: 480, lineHeight: 1.7 }}>
                Join thousands of OFWs who found their dream home through LUPAPH. Blockchain-verified. OFW-first.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/map" style={{
                background: '#703BF7', color: '#fff',
                padding: '14px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600,
                boxShadow: '0 0 32px rgba(112,59,247,0.4)',
              }}>
                Browse Properties
              </Link>
              <Link href="/login" style={{
                background: 'transparent', color: '#fff',
                padding: '14px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600,
                border: '1px solid #262626',
              }}>
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#000', borderTop: '1px solid #0D0D0D', padding: '60px 162px 40px' }}>
        <div style={{ maxWidth: 1596, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 60, marginBottom: 48 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #703BF7, #9B6DFF)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏠</div>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>LUPA <span style={{ color: '#703BF7' }}>PH</span></span>
              </div>
              <p style={{ fontSize: 14, color: '#595959', lineHeight: 1.7, maxWidth: 280 }}>
                Philippine real estate for Filipinos worldwide. Blockchain-verified. OFW-first.
              </p>
            </div>
            {[
              { title: 'Properties', links: [{ href: '/map', label: 'Map View' }, { href: '/?type=house_and_lot', label: 'House & Lot' }, { href: '/?type=condo', label: 'Condo' }, { href: '/?type=residential_lot', label: 'Lots' }] },
              { title: 'Services', links: [{ href: '/agents', label: 'Find Agents' }, { href: '/brokers', label: 'Brokerages' }, { href: '/spa', label: 'SPA Guide' }, { href: '/remittance', label: 'Remittance' }] },
              { title: 'Company', links: [{ href: '/login', label: 'Sign In' }, { href: '/login', label: 'Register' }, { href: '/dashboard', label: 'Dashboard' }, { href: '/map', label: 'Explore Map' }] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 20 }}>{col.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {col.links.map(link => (
                    <Link key={link.label} href={link.href} style={{ fontSize: 14, color: '#595959' }}>{link.label}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #0D0D0D', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 13, color: '#595959' }}>© 2026 LUPA PH. All rights reserved.</p>
            <p style={{ fontSize: 13, color: '#595959' }}>Lots · Units · Properties Anywhere</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
