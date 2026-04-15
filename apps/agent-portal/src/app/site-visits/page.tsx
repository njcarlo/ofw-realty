import { AgentSidebar } from '@/components/AgentSidebar'

const VISITS = [
  { id: 'sv1', property: 'House & Lot in Bacoor Cavite', date: 'Apr 13, 2026', duration: '24 min', photos: 8, videos: 2, status: 'completed', buyer: 'Maria Santos' },
  { id: 'sv2', property: 'Lot in Sta. Rosa Laguna', date: 'Apr 11, 2026', duration: '18 min', photos: 5, videos: 1, status: 'completed', buyer: 'Jose Reyes' },
]

export default function SiteVisitsPage() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <AgentSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>GPS Site Visits</h1>
            <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Live GPS-verified property visits for OFW buyers</p>
          </div>
          <button style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 20px rgba(112,59,247,0.3)' }}>
            📍 Start New Visit
          </button>
        </div>

        <div style={{ background: 'rgba(112,59,247,0.08)', border: '1px solid rgba(112,59,247,0.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#703BF7', marginBottom: 4 }}>How GPS Site Visits Work</div>
          <p style={{ fontSize: 13, color: '#595959', margin: 0, lineHeight: 1.6 }}>
            Start a live session from your mobile app. Your GPS coordinates are streamed in real-time and overlaid on the property's master plan map. OFW buyers can watch live and verify you're physically at the lot.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {VISITS.map(v => (
            <div key={v.id} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{v.property}</div>
                  <div style={{ fontSize: 13, color: '#595959' }}>Buyer: {v.buyer} · {v.date}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                  ✓ Completed
                </span>
              </div>
              <div style={{ display: 'flex', gap: 24, paddingTop: 14, borderTop: '1px solid #141414' }}>
                {[
                  { icon: '⏱️', label: 'Duration', value: v.duration },
                  { icon: '📸', label: 'Photos', value: v.photos },
                  { icon: '🎥', label: 'Videos', value: v.videos },
                ].map(stat => (
                  <div key={stat.label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 18 }}>{stat.icon}</span>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{stat.value}</div>
                      <div style={{ fontSize: 11, color: '#595959' }}>{stat.label}</div>
                    </div>
                  </div>
                ))}
                <div style={{ marginLeft: 'auto' }}>
                  <button style={{ background: 'transparent', color: '#703BF7', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>
                    View Site Visit Record
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
