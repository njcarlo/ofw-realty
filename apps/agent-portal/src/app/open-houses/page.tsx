'use client'
import { useState } from 'react'
import { AgentSidebar } from '@/components/AgentSidebar'

const OPEN_HOUSES = [
  {
    id: 'oh1',
    property: 'House & Lot in Bacoor Cavite',
    date: 'Apr 16, 2026',
    time: '10:00 AM - 12:00 PM',
    type: 'In-Person',
    venue: 'Molino Blvd, Bacoor',
    attending: 5,
    maybe: 2,
    status: 'scheduled',
    facebookLiveUrl: '',
    socialPosted: false,
  },
  {
    id: 'oh2',
    property: 'Condo Unit in Cebu IT Park',
    date: 'Apr 18, 2026',
    time: '2:00 PM - 4:00 PM',
    type: 'Virtual',
    venue: 'Zoom Meeting',
    attending: 12,
    maybe: 4,
    status: 'scheduled',
    facebookLiveUrl: 'https://www.facebook.com/live/123456',
    socialPosted: true,
  },
  {
    id: 'oh3',
    property: 'Lot in Sta. Rosa Laguna',
    date: 'Apr 10, 2026',
    time: '9:00 AM - 11:00 AM',
    type: 'In-Person',
    venue: 'Tagaytay Road, Sta. Rosa',
    attending: 3,
    maybe: 1,
    status: 'completed',
    facebookLiveUrl: '',
    socialPosted: true,
  },
]

export default function OpenHousesPage() {
  const [openHouses, setOpenHouses] = useState(OPEN_HOUSES)
  const [announceModal, setAnnounceModal] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [posting, setPosting] = useState(false)
  const [toast, setToast] = useState('')

  const activeOH = openHouses.find(oh => oh.id === announceModal)

  function generateCaption(oh: typeof OPEN_HOUSES[0]) {
    const emoji = oh.type === 'Virtual' ? '💻' : '🏡'
    return `${emoji} OPEN HOUSE ALERT! 🇵🇭\n\nJoin us for an exclusive viewing of ${oh.property}!\n\n📅 ${oh.date}\n🕐 ${oh.time}\n📍 ${oh.venue}${oh.facebookLiveUrl ? `\n\n🔴 Watch LIVE: ${oh.facebookLiveUrl}` : ''}\n\nDM us or click the link to RSVP!\n\n#LupaPH #OpenHouse #RealEstate #OFWInvestment #Philippines`
  }

  function openAnnounce(id: string) {
    const oh = openHouses.find(o => o.id === id)!
    setCaption(generateCaption(oh))
    setAnnounceModal(id)
  }

  async function postAnnouncement() {
    setPosting(true)
    // Simulate n8n webhook call
    await new Promise(r => setTimeout(r, 1500))
    setOpenHouses(prev => prev.map(oh => oh.id === announceModal ? { ...oh, socialPosted: true } : oh))
    setPosting(false)
    setAnnounceModal(null)
    setToast('✅ Open House announcement posted to Facebook & Instagram!')
    setTimeout(() => setToast(''), 4000)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <AgentSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', top: 24, right: 24, background: '#0D0D0D', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 10, padding: '14px 20px', fontSize: 14, color: '#10B981', zIndex: 9999, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
            {toast}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Open Houses</h1>
            <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Schedule, manage, and announce property viewings</p>
          </div>
          <button style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 20px rgba(112,59,247,0.3)' }}>
            + Schedule Open House
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {openHouses.map(oh => (
            <div key={oh.id} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{oh.property}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#595959', flexWrap: 'wrap' }}>
                    <span>📅 {oh.date}</span>
                    <span>🕐 {oh.time}</span>
                    <span>{oh.type === 'Virtual' ? '💻' : '📍'} {oh.venue}</span>
                    {oh.facebookLiveUrl && (
                      <span style={{ color: '#EF4444' }}>🔴 Facebook Live</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {oh.socialPosted && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>
                      📢 Announced
                    </span>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: oh.status === 'scheduled' ? 'rgba(112,59,247,0.15)' : 'rgba(16,185,129,0.15)', color: oh.status === 'scheduled' ? '#703BF7' : '#10B981', textTransform: 'capitalize' }}>
                    {oh.status}
                  </span>
                  <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, background: oh.type === 'Virtual' ? 'rgba(6,182,212,0.15)' : 'rgba(245,158,11,0.15)', color: oh.type === 'Virtual' ? '#06B6D4' : '#F59E0B' }}>
                    {oh.type}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 24, paddingTop: 14, borderTop: '1px solid #141414', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 18 }}>✅</span>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#10B981' }}>{oh.attending}</div>
                    <div style={{ fontSize: 11, color: '#595959' }}>Attending</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 18 }}>🤔</span>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#F59E0B' }}>{oh.maybe}</div>
                    <div style={{ fontSize: 11, color: '#595959' }}>Maybe</div>
                  </div>
                </div>

                {oh.status === 'scheduled' && (
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    {!oh.socialPosted && (
                      <button
                        onClick={() => openAnnounce(oh.id)}
                        style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                      >
                        📢 Announce on Social
                      </button>
                    )}
                    <button style={{ background: 'transparent', color: '#703BF7', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>View RSVPs</button>
                    <button style={{ background: 'transparent', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
                  </div>
                )}
                {oh.status === 'completed' && (
                  <div style={{ marginLeft: 'auto' }}>
                    <button style={{ background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>View Summary</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Announce Modal */}
        {announceModal && activeOH && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: 32, width: '100%', maxWidth: 560 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>📢 Announce Open House</h2>
              <p style={{ fontSize: 13, color: '#595959', margin: '0 0 20px' }}>
                Post to your connected Facebook Page{activeOH.facebookLiveUrl ? ' with Facebook Live link' : ''} and Instagram.
              </p>

              {/* Platforms */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#3B82F6' }}>
                  📘 Facebook Page
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#EC4899' }}>
                  📸 Instagram
                </div>
                {activeOH.facebookLiveUrl && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#EF4444' }}>
                    🔴 Live Link
                  </div>
                )}
              </div>

              {/* Caption editor */}
              <label style={{ fontSize: 12, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Caption Preview & Edit</label>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                rows={10}
                style={{ width: '100%', background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: 14, fontSize: 13, color: '#fff', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.6 }}
              />

              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setAnnounceModal(null)}
                  style={{ background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={postAnnouncement}
                  disabled={posting}
                  style={{ background: posting ? '#333' : '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: posting ? 'not-allowed' : 'pointer', boxShadow: posting ? 'none' : '0 0 20px rgba(112,59,247,0.3)' }}
                >
                  {posting ? 'Posting...' : '📢 Post Announcement'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
