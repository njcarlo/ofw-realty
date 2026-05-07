'use client'
import { useState } from 'react'

type RoomStatus = 'active' | 'offer_accepted' | 'reserved' | 'closed' | 'cancelled'

interface DealRoom {
  id: string
  property_address: string
  buyer_name: string
  status: RoomStatus
  latest_offer_amount: number | null
  last_activity_at: string
  unread_count: number
  listing_id: string
}

interface Listing {
  id: string
  address: string
}

interface Filters {
  status: RoomStatus | ''
  listing_id: string
}

interface DealRoomDashboardProps {
  rooms: DealRoom[]
  listings?: Listing[]
  onRoomClick: (roomId: string) => void
  filters: Filters
  onFilterChange: (filters: Filters) => void
}

const STATUS_CONFIG: Record<RoomStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-green-900/50 text-green-400 border-green-700/40' },
  offer_accepted: { label: 'Offer Accepted', className: 'bg-blue-900/50 text-blue-400 border-blue-700/40' },
  reserved: { label: 'Reserved', className: 'bg-yellow-900/50 text-yellow-400 border-yellow-700/40' },
  closed: { label: 'Closed', className: 'bg-gray-700 text-gray-400 border-gray-600' },
  cancelled: { label: 'Cancelled', className: 'bg-red-900/50 text-red-400 border-red-700/40' },
}

function formatPHP(amount: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(amount)
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-PH', { dateStyle: 'medium' })
}

export function DealRoomDashboard({
  rooms,
  listings = [],
  onRoomClick,
  filters,
  onFilterChange,
}: DealRoomDashboardProps) {
  const [search, setSearch] = useState('')

  const filtered = rooms.filter(r => {
    if (filters.status && r.status !== filters.status) return false
    if (filters.listing_id && r.listing_id !== filters.listing_id) return false
    if (search) {
      const q = search.toLowerCase()
      return r.property_address.toLowerCase().includes(q) || r.buyer_name.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by address or buyer…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 w-64"
        />
        <select
          value={filters.status}
          onChange={e => onFilterChange({ ...filters, status: e.target.value as RoomStatus | '' })}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500"
        >
          <option value="">All Statuses</option>
          {(Object.keys(STATUS_CONFIG) as RoomStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
        {listings.length > 0 && (
          <select
            value={filters.listing_id}
            onChange={e => onFilterChange({ ...filters, listing_id: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500 max-w-xs"
          >
            <option value="">All Listings</option>
            {listings.map(l => (
              <option key={l.id} value={l.id}>{l.address}</option>
            ))}
          </select>
        )}
        <span className="text-xs text-gray-500 ml-auto">{filtered.length} room{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Buyer</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Latest Offer</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-500">No deal rooms found.</td>
              </tr>
            )}
            {filtered.map(room => {
              const statusCfg = STATUS_CONFIG[room.status]
              return (
                <tr
                  key={room.id}
                  onClick={() => onRoomClick(room.id)}
                  className="border-b border-gray-800/50 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {room.unread_count > 0 && (
                        <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" aria-label="Unread messages" />
                      )}
                      <span className="text-gray-200 font-medium truncate max-w-xs">{room.property_address}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{room.buyer_name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded border font-medium ${statusCfg.className}`}>
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">
                    {room.latest_offer_amount != null ? formatPHP(room.latest_offer_amount) : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">{formatRelative(room.last_activity_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
