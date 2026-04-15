'use client'
import { useState } from 'react'

const EMBASSIES = [
  { country: 'UAE', city: 'Abu Dhabi', flag: '🇦🇪', name: 'Philippine Embassy in Abu Dhabi', address: 'Villa No. 11, Ahmed Hilal Street, Khalidiyah, Abu Dhabi', phone: '+971-2-635-4212', hours: 'Mon-Fri 8:00AM-5:00PM GST' },
  { country: 'UAE', city: 'Dubai', flag: '🇦🇪', name: 'Philippine Consulate General in Dubai', address: 'Emarat Atrium Building, Sheikh Zayed Road, Dubai', phone: '+971-4-220-7100', hours: 'Mon-Fri 8:00AM-5:00PM GST' },
  { country: 'Saudi Arabia', city: 'Riyadh', flag: '🇸🇦', name: 'Philippine Embassy in Riyadh', address: 'Diplomatic Quarter, Riyadh', phone: '+966-11-488-0001', hours: 'Sun-Thu 8:00AM-4:00PM AST' },
  { country: 'Saudi Arabia', city: 'Jeddah', flag: '🇸🇦', name: 'Philippine Consulate General in Jeddah', address: 'Al-Hamra District, Jeddah', phone: '+966-12-665-0001', hours: 'Sun-Thu 8:00AM-4:00PM AST' },
  { country: 'Singapore', city: 'Singapore', flag: '🇸🇬', name: 'Philippine Embassy in Singapore', address: '20 Nassim Road, Singapore 258395', phone: '+65-6737-3977', hours: 'Mon-Fri 8:30AM-5:30PM SGT' },
  { country: 'Hong Kong', city: 'Hong Kong', flag: '🇭🇰', name: 'Philippine Consulate General in Hong Kong', address: 'United Centre, 95 Queensway, Admiralty, Hong Kong', phone: '+852-2823-8500', hours: 'Mon-Fri 8:30AM-5:30PM HKT' },
  { country: 'Qatar', city: 'Doha', flag: '🇶🇦', name: 'Philippine Embassy in Doha', address: 'Al Hilal Area, Doha', phone: '+974-4467-0010', hours: 'Sun-Thu 8:00AM-4:00PM AST' },
  { country: 'Kuwait', city: 'Kuwait City', flag: '🇰🇼', name: 'Philippine Embassy in Kuwait', address: 'Block 1, Street 12, Rumaithiya, Kuwait City', phone: '+965-2531-0900', hours: 'Sun-Thu 8:00AM-4:00PM AST' },
  { country: 'Bahrain', city: 'Manama', flag: '🇧🇭', name: 'Philippine Embassy in Manama', address: 'Villa 939, Road 3220, Block 332, Manama', phone: '+973-1727-2700', hours: 'Sun-Thu 8:00AM-4:00PM AST' },
  { country: 'Oman', city: 'Muscat', flag: '🇴🇲', name: 'Philippine Embassy in Muscat', address: 'Way 3017, Shatti Al Qurum, Muscat', phone: '+968-2469-5900', hours: 'Sun-Thu 8:00AM-4:00PM GST' },
  { country: 'Italy', city: 'Rome', flag: '🇮🇹', name: 'Philippine Embassy in Rome', address: "Viale delle Medaglie d'Oro 112, Rome", phone: '+39-06-3975-0671', hours: 'Mon-Fri 9:00AM-5:00PM CET' },
  { country: 'Japan', city: 'Tokyo', flag: '🇯🇵', name: 'Philippine Embassy in Tokyo', address: '5-15-5 Roppongi, Minato-ku, Tokyo', phone: '+81-3-5562-1600', hours: 'Mon-Fri 8:30AM-5:30PM JST' },
  { country: 'South Korea', city: 'Seoul', flag: '🇰🇷', name: 'Philippine Embassy in Seoul', address: '5-1 Itaewon-dong, Yongsan-gu, Seoul', phone: '+82-2-577-6147', hours: 'Mon-Fri 8:30AM-5:30PM KST' },
  { country: 'USA', city: 'Washington DC', flag: '🇺🇸', name: 'Philippine Embassy in Washington DC', address: '1600 Massachusetts Avenue NW, Washington DC', phone: '+1-202-467-9300', hours: 'Mon-Fri 9:00AM-5:00PM EST' },
  { country: 'USA', city: 'Los Angeles', flag: '🇺🇸', name: 'Philippine Consulate General in Los Angeles', address: '3600 Wilshire Blvd, Suite 500, Los Angeles', phone: '+1-213-639-0980', hours: 'Mon-Fri 8:00AM-5:00PM PST' },
  { country: 'Canada', city: 'Ottawa', flag: '🇨🇦', name: 'Philippine Embassy in Ottawa', address: '130 Albert Street, Suite 606, Ottawa', phone: '+1-613-233-1121', hours: 'Mon-Fri 9:00AM-5:00PM EST' },
  { country: 'Australia', city: 'Canberra', flag: '🇦🇺', name: 'Philippine Embassy in Canberra', address: '1 Moonah Place, Yarralumla, Canberra', phone: '+61-2-6273-2535', hours: 'Mon-Fri 8:30AM-4:30PM AEST' },
  { country: 'UK', city: 'London', flag: '🇬🇧', name: 'Philippine Embassy in London', address: '6-11 Suffolk Street, London SW1Y 4HG', phone: '+44-20-7451-1780', hours: 'Mon-Fri 9:00AM-5:00PM GMT' },
]

const QUICK_FILTERS = ['UAE', 'Saudi Arabia', 'Singapore', 'Hong Kong', 'Qatar', 'Japan', 'USA', 'UK']

export function EmbassyLocator() {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  const filtered = EMBASSIES.filter(e => {
    const q = query.toLowerCase()
    const matchesSearch = !q || e.country.toLowerCase().includes(q) || e.city.toLowerCase().includes(q) || e.name.toLowerCase().includes(q)
    const matchesFilter = !activeFilter || e.country === activeFilter
    return matchesSearch && matchesFilter
  })

  return (
    <div style={{ border: '1px solid #1A1A1A', borderRadius: 16, overflow: 'hidden', background: '#0D0D0D' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1A1A1A' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 14px' }}>
          🏛️ Embassy Locator
        </h3>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#141414', border: '1px solid #262626', borderRadius: 10, padding: '10px 14px',
          marginBottom: 12,
        }}>
          <span style={{ fontSize: 15, color: '#595959' }}>🔍</span>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveFilter(null) }}
            placeholder="Search by country or city (e.g. Dubai, Singapore)..."
            style={{ border: 'none', outline: 'none', fontSize: 14, width: '100%', background: 'transparent', color: '#fff' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#595959', fontSize: 16, lineHeight: 1 }}>✕</button>
          )}
        </div>

        {/* Quick filter chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {QUICK_FILTERS.map(country => (
            <button
              key={country}
              onClick={() => { setActiveFilter(activeFilter === country ? null : country); setQuery('') }}
              style={{
                padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                borderColor: activeFilter === country ? 'rgba(112,59,247,0.5)' : '#262626',
                background: activeFilter === country ? 'rgba(112,59,247,0.15)' : '#141414',
                color: activeFilter === country ? '#703BF7' : '#999',
              }}
            >
              {EMBASSIES.find(e => e.country === country)?.flag} {country}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#595959' }}>
            <p style={{ fontSize: 24, margin: '0 0 8px' }}>🔍</p>
            <p style={{ fontSize: 14, margin: 0 }}>No embassies found for "{query}"</p>
          </div>
        ) : (
          filtered.map((e, i) => (
            <div
              key={i}
              style={{
                padding: '16px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid #141414' : 'none',
                transition: 'background 0.1s',
                display: 'flex', alignItems: 'flex-start', gap: 14,
              }}
              onMouseEnter={el => (el.currentTarget.style.background = '#141414')}
              onMouseLeave={el => (el.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{e.flag}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>{e.name}</p>
                <p style={{ fontSize: 12, color: '#595959', margin: '0 0 8px' }}>📍 {e.address}</p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <a href={`tel:${e.phone}`} style={{ fontSize: 12, color: '#703BF7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    📞 {e.phone}
                  </a>
                  <span style={{ fontSize: 12, color: '#595959', display: 'flex', alignItems: 'center', gap: 4 }}>
                    🕐 {e.hours}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid #1A1A1A' }}>
        <p style={{ fontSize: 11, color: '#595959', margin: 0 }}>
          Showing {filtered.length} of {EMBASSIES.length} Philippine embassies and consulates worldwide
        </p>
      </div>
    </div>
  )
}
