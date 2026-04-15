'use client'
import { useState } from 'react'
import { BrokerSidebar } from '@/components/BrokerSidebar'

const LEADERBOARD = [
  { rank: 1, name: 'Maria Cruz', listings: 6, leads: 9, sold: 2, points: 1580, badge: '🥇', trend: '+120', breakdown: { siteVisits: 8, leads: 9, docs: 4, openHouses: 3, sold: 2 } },
  { rank: 2, name: 'Juan Santos', listings: 8, leads: 12, sold: 3, points: 1240, badge: '🥈', trend: '+340', breakdown: { siteVisits: 5, leads: 12, docs: 6, openHouses: 2, sold: 3 } },
  { rank: 3, name: 'Pedro Reyes', listings: 5, leads: 7, sold: 2, points: 870, badge: '🥉', trend: '+80', breakdown: { siteVisits: 4, leads: 7, docs: 3, openHouses: 1, sold: 2 } },
  { rank: 4, name: 'Ana Dela Cruz', listings: 4, leads: 6, sold: 1, points: 650, badge: '', trend: '+60', breakdown: { siteVisits: 3, leads: 6, docs: 2, openHouses: 2, sold: 1 } },
  { rank: 5, name: 'Carlo Mendoza', listings: 3, leads: 4, sold: 0, points: 420, badge: '', trend: '+40', breakdown: { siteVisits: 2, leads: 4, docs: 1, openHouses: 1, sold: 0 } },
]

const POINT_CONFIG = [
  { action: 'GPS Site Visit completed', points: 50, icon: '📍', key: 'siteVisits' },
  { action: 'Messenger lead response < 5 min', points: 30, icon: '⚡', key: 'leads' },
  { action: 'Document approved in checklist', points: 20, icon: '✅', key: 'docs' },
  { action: 'Open House completed', points: 40, icon: '🏛️', key: 'openHouses' },
  { action: 'Transaction closed as Sold', points: 200, icon: '🏆', key: 'sold' },
]

const REDEMPTION_HISTORY = [
  { agent: 'Juan Santos', date: 'Apr 1, 2026', reward: 'PHP 1,200 cash bonus', points: 1000, status: 'Paid' },
  { agent: 'Maria Cruz', date: 'Mar 20, 2026', reward: 'PHP 500 cash bonus', points: 500, status: 'Paid' },
  { agent: 'Pedro Reyes', date: 'Mar 10, 2026', reward: 'PHP 500 cash bonus', points: 500, status: 'Paid' },
]

export default function BrokerPerformancePage() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [editingPoints, setEditingPoints] = useState(false)
  const [pointValues, setPointValues] = useState({ siteVisits: 50, leads: 30, docs: 20, openHouses: 40, sold: 200 })
  const [tab, setTab] = useState<'leaderboard' | 'redemptions'>('leaderboard')

  const agentDetail = LEADERBOARD.find(a => a.name === selectedAgent)

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <BrokerSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Agent Performance Engine</h1>
          <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Gamified leaderboard — configure points, track milestones, manage redemptions</p>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Points Awarded', value: '4,760', color: '#703BF7', icon: '🏆' },
            { label: 'Active Agents', value: '5', color: '#10B981', icon: '👥' },
            { label: 'Redemptions This Month', value: '3', color: '#F59E0B', icon: '🎁' },
            { label: 'Top Agent', value: 'Maria Cruz', color: '#06B6D4', icon: '⭐' },
          ].map(s => (
            <div key={s.label} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: '18px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#595959' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {(['leaderboard', 'redemptions'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? '#703BF7' : 'transparent', color: tab === t ? '#fff' : '#595959', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
              {t === 'leaderboard' ? '🏆 Leaderboard' : '🎁 Redemptions'}
            </button>
          ))}
        </div>

        {tab === 'leaderboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
            {/* Leaderboard table */}
            <div>
              <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px 80px 110px', padding: '12px 20px', borderBottom: '1px solid #141414' }}>
                  {['Rank', 'Agent', 'Listings', 'Leads', 'Sold', 'Points'].map(h => (
                    <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                  ))}
                </div>
                {LEADERBOARD.map((a, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedAgent(selectedAgent === a.name ? null : a.name)}
                    style={{ display: 'grid', gridTemplateColumns: '40px 1fr 80px 80px 80px 110px', padding: '16px 20px', borderBottom: i < LEADERBOARD.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center', background: selectedAgent === a.name ? 'rgba(112,59,247,0.08)' : i === 0 ? 'rgba(245,158,11,0.04)' : 'transparent', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: 18 }}>{a.badge || `#${a.rank}`}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: '#10B981', marginTop: 2 }}>{a.trend} this month</div>
                    </div>
                    <div style={{ fontSize: 13, color: '#999' }}>{a.listings}</div>
                    <div style={{ fontSize: 13, color: '#999' }}>{a.leads}</div>
                    <div style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>{a.sold}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#703BF7' }}>{a.points.toLocaleString()}</div>
                  </div>
                ))}
              </div>

              {/* Per-agent breakdown */}
              {agentDetail && (
                <div style={{ background: '#0D0D0D', border: '1px solid rgba(112,59,247,0.2)', borderRadius: 12, padding: 20, marginTop: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 14 }}>📊 {agentDetail.name} — Action Breakdown</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                    {POINT_CONFIG.map(p => {
                      const count = agentDetail.breakdown[p.key as keyof typeof agentDetail.breakdown]
                      const earned = count * p.points
                      return (
                        <div key={p.key} style={{ background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ fontSize: 20, marginBottom: 6 }}>{p.icon}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#703BF7' }}>{count}</div>
                          <div style={{ fontSize: 11, color: '#595959', marginTop: 2 }}>+{earned} pts</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Point config panel */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Point Values</div>
                <button onClick={() => setEditingPoints(!editingPoints)} style={{ background: 'transparent', color: '#703BF7', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
                  {editingPoints ? 'Save' : 'Edit'}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {POINT_CONFIG.map(p => (
                  <div key={p.key} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18 }}>{p.icon}</span>
                    <div style={{ flex: 1, fontSize: 13, color: '#999' }}>{p.action}</div>
                    {editingPoints ? (
                      <input
                        type="number"
                        value={pointValues[p.key as keyof typeof pointValues]}
                        onChange={e => setPointValues(prev => ({ ...prev, [p.key]: Number(e.target.value) }))}
                        style={{ width: 60, background: '#141414', border: '1px solid #703BF7', borderRadius: 6, padding: '4px 8px', fontSize: 14, fontWeight: 700, color: '#703BF7', textAlign: 'right' }}
                      />
                    ) : (
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#703BF7' }}>+{pointValues[p.key as keyof typeof pointValues]}</div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Redemption Tiers</div>
                {[
                  { threshold: '500 pts', reward: 'PHP 500 cash bonus' },
                  { threshold: '1,000 pts', reward: 'PHP 1,200 cash bonus' },
                  { threshold: '1,500 pts', reward: 'Commission tier upgrade' },
                  { threshold: '2,000 pts', reward: 'Platform credits (₱2,000)' },
                ].map(r => (
                  <div key={r.threshold} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: '#703BF7', fontWeight: 600 }}>{r.threshold}</span>
                    <span style={{ color: '#999' }}>{r.reward}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'redemptions' && (
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px 80px', padding: '12px 20px', borderBottom: '1px solid #141414' }}>
              {['Agent', 'Reward', 'Date', 'Points', 'Status'].map(h => (
                <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            {REDEMPTION_HISTORY.map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px 80px', padding: '16px 20px', borderBottom: i < REDEMPTION_HISTORY.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{r.agent}</div>
                <div style={{ fontSize: 13, color: '#999' }}>{r.reward}</div>
                <div style={{ fontSize: 13, color: '#595959' }}>{r.date}</div>
                <div style={{ fontSize: 13, color: '#703BF7', fontWeight: 600 }}>{r.points}</div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
