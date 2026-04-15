'use client'
import { useState } from 'react'
import Link from 'next/link'

const TYPE_LABELS: Record<string, string> = {
  residential_lot: 'Residential Lot',
  house_and_lot: 'House & Lot',
  condo: 'Condo',
  commercial: 'Commercial',
  farm_lot: 'Farm Lot',
}

interface Props {
  listing: any
  variant?: 'grid' | 'sidebar'
  onHover?: (id: string | null) => void
}

export function ListingCard({ listing, variant = 'grid', onHover }: Props) {
  const [saved, setSaved] = useState(false)
  const [imgErr, setImgErr] = useState(false)
  const [hovered, setHovered] = useState(false)

  const photo = listing.listing_photos?.find((p: any) => p.is_primary)?.url
  const price = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(listing.price_php)
  const typeLabel = TYPE_LABELS[listing.property_type] ?? listing.property_type

  // ── SIDEBAR VARIANT ──
  if (variant === 'sidebar') {
    return (
      <Link href={`/listings/${listing.id}`} style={{ textDecoration: 'none', color: 'inherit' }}
        onMouseEnter={() => onHover?.(listing.id)}
        onMouseLeave={() => onHover?.(null)}
      >
        <div style={{
          display: 'flex', gap: 12, padding: '14px 16px',
          borderBottom: '1px solid #0D0D0D', cursor: 'pointer',
          background: hovered ? '#0D0D0D' : 'transparent', transition: 'background 0.15s',
        }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div style={{ width: 80, height: 72, borderRadius: 8, overflow: 'hidden', background: '#141414', flexShrink: 0 }}>
            {photo && !imgErr
              ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgErr(true)} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#262626' }}>🏠</div>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: '#595959', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{typeLabel}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#703BF7', marginBottom: 3 }}>{price}</div>
            <div style={{ fontSize: 12, color: '#ccc', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.title}</div>
            <div style={{ fontSize: 11, color: '#595959' }}>📍 {listing.city}, {listing.province}</div>
            {listing.blockchain_verified && <div style={{ fontSize: 10, color: '#10B981', fontWeight: 600, marginTop: 2 }}>✓ Blockchain Verified</div>}
          </div>
        </div>
      </Link>
    )
  }

  // ── GRID VARIANT — Estatein card style ──
  return (
    <Link href={`/listings/${listing.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          background: '#141414',
          border: `1px solid ${hovered ? 'rgba(112,59,247,0.35)' : '#1A1A1A'}`,
          borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
          transition: 'border-color 0.2s, transform 0.2s',
          transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Image */}
        <div style={{ position: 'relative', aspectRatio: '16/10', background: '#0D0D0D', overflow: 'hidden' }}>
          {photo && !imgErr
            ? <img src={photo} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }} onError={() => setImgErr(true)} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: '#1A1A1A' }}>🏠</div>}

          {/* Gradient */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,20,20,0.7) 0%, transparent 50%)' }} />

          {/* Top badges */}
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
            {listing.is_featured && (
              <span style={{ background: '#703BF7', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>⭐ Featured</span>
            )}
            {listing.blockchain_verified && (
              <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 99, border: '1px solid rgba(16,185,129,0.25)' }}>✓ Verified</span>
            )}
          </div>

          {/* Save */}
          <button
            onClick={e => { e.preventDefault(); setSaved(v => !v) }}
            style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(0,0,0,0.6)', border: '1px solid #262626',
              borderRadius: '50%', width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, backdropFilter: 'blur(8px)',
            }}
          >
            {saved ? '❤️' : '🤍'}
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ fontSize: 11, color: '#595959', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {typeLabel}{listing.lot_area_sqm ? ` · ${listing.lot_area_sqm} sqm` : ''}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {listing.title}
          </div>
          <div style={{ fontSize: 13, color: '#595959', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
            📍 {listing.city}, {listing.province}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #1A1A1A',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#595959', marginBottom: 2 }}>Price</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{price}</div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(112,59,247,0.1)', border: '1px solid rgba(112,59,247,0.2)',
            padding: '8px 14px', borderRadius: 8,
            fontSize: 13, fontWeight: 600, color: '#703BF7',
          }}>
            View Details →
          </div>
        </div>
      </div>
    </Link>
  )
}
