'use client'
import { useState } from 'react'
import { AgentSidebar } from '@/components/AgentSidebar'

const ACTIONS = [
  { action: 'Closed transaction as Sold', points: 200, date: 'Apr 13, 2026', icon: '🏆', category: 'Transaction' },
  { action: 'Completed GPS Site Visit', points: 50, date: 'Apr 12, 2026', icon: '📍', category: 'Site Visit' },
  { action: 'Responded to Messenger lead within 5 min', points: 30, date: 'Apr 11, 2026', icon: '⚡', category: 'Lead' },
  { action: 'Completed Open House event', points: 40, date: 'Apr 10, 2026', icon: '🏛️', category: 'Open House' },
  { action: 'Document approved in checklist', points: 20, date: 'Apr 9, 2026', icon: '✅', category: 'Document' },
  { action: 'Completed GPS Site Visit', points: 50, date: 'Apr 8, 2026', icon: '📍', category: 'Site Visit' },
  { action: 'Responded to Messenger lead within 5 min', points: 30, date: 'Apr 7, 2026', icon: '⚡', category: 'Lead' },
]

const LEADERBOARD = [
  { rank: 1, name: 'Maria Cruz', points: 1580, badge: '🥇', trend: '+120' },
  { rank: 2, name: 'Juan Santos (You)', points: 1240, badge: '🥈', isYou: true, trend: '+340' },
  { rank: 3, name: 'Pedro Reyes', points: 870, badge: '🥉', trend: '+80' },
  { rank: 4, name: 'Ana Dela Cruz', points: 650, badge: '', trend: '+60' },
  { rank: 5, name: 'Carlo Mendoza', points: 420, badge: '', trend: '+40' },
]

const MILESTONES = [
  { threshold: 500, reward: 'PHP 500 cash bonus', redeemed: true },
  { threshold: 1000, reward: 'PHP 1,200 cash bonus', redeemed: true },
  { threshold: 1500, reward: 'Commission tier upgrade', redeemed: false },
  { threshold: 2000, reward: 'Platform credits (₱2,000)', redeemed: false },
]

const REDEMPTIONS = [
  { date: 'Mar 15, 2026', reward: 'PHP 500 cash bonus', points: 500, status: 'Paid' },
  { date: 'Apr 1, 2026', reward: 'PHP 1,200 cash bonus', points: 1000, status: 'Paid' },
]

const TOTAL_POINTS = 1240
const NEXT_MILESTONE = MILESTONES.find(m => !m.redeemed)

export default function PerformancePage() {
  const [tab, setTab] = useState<'activity' | 'leaderboard' | 'redemptions'>('activity')
  const [toast, setToast] = useState('')

  function redeem() {
    setToast('🎉 Redemption request sent to your broker admin!')
    setTimeout(() => setToast(''), 4000)
  }

  const progress = NEXT_MILESTONE ? Math.min((TOTAL_POINTS / NEXT_MILESTONE.threshold) * 100, 100) : 100

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <AgentSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>

        {toast && (
          <div style={{ position: 'fixed', top: 24, right: 24, background: '#0D0D0D', border: '1px solid rgba(112,59,247,0.4)', borderRadius: 10, padding: '14px 20px', fontSize: 14, color: '#703BF7', zIndex: 9999, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
            {toast}
          </div>
        )}

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Performance Points</h1>
          <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Earn points for high-value actions — redeem for bonuses and tier upgrades</p>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Points', value: '1,240', color: '#703BF7', icon: '🏆' },
            { label: 'This Month', value: '+340', color: '#10B981', icon: '📈' },
            { label: 'Brokerage Rank', value: '#2', color: '#F59E0B', icon: '⭐' },
            { label: 'Points to Next Tier', value: '260', color: '#06B6D4', icon: '🎯' },
          ].map(s => (
            <div key={s.label} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: '18px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 26 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#595959' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Next milestone progress */}
        {NEXT_MILESTONE && (
          <div style={{ background: '#0D0D0D', border: '1px solid rgba(112,59,247,0.2)', borderRadius: 12, padding: 20, marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Next Milestone: {NEXT_MILESTONE.threshold.toLocaleString()} pts</div>
                <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>Reward: {NEXT_MILESTONE.reward}</div>
              </div>
              <div style={{ fontSize: 13, color: '#703BF7', fontWeight: 600 }}>{TOTAL_POINTS} / {NEXT_MILESTONE.threshold}</div>
            </div>
            <div style={{ background: '#1A1A1A', borderRadius: 99, height: 8, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #703BF7, #9B6DFF)', borderRadius: 99, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {(['activity', 'leaderboard', 'redemptions'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? '#703BF7' : 'transparent', color: tab === t ? '#fff' : '#595959', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
              {t === 'activity' ? '📋 Activity' : t === 'leaderboard' ? '🏆 Leaderboard' : '🎁 Redemptions'}
            </button>
          ))}
        </div>

        {tab === 'activity' && (
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
            {ACTIONS.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < ACTIONS.length - 1 ? '1px solid #141414' : 'none' }}>
                <span style={{ fontSize: 20 }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{a.action}</div>
                  <div style={{ fontSize: 11, color: '#595959', marginTop: 2 }}>{a.date} · {a.category}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#703BF7' }}>+{a.points}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'leaderboard' && (
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
            {LEADERBOARD.map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: i < LEADERBOARD.length - 1 ? '1px solid #141414' : 'none', background: l.isYou ? 'rgba(112,59,247,0.08)' : 'transparent' }}>
                <div style={{ fontSize: 20, width: 32, textAlign: 'center' }}>{l.badge || `#${l.rank}`}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: l.isYou ? 700 : 500, color: l.isYou ? '#703BF7' : '#fff' }}>{l.name}</div>
                  <div style={{ fontSize: 11, color: '#10B981', marginTop: 2 }}>{l.trend} this month</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: l.isYou ? '#703BF7' : '#999' }}>{l.points.toLocaleString()} pts</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'redemptions' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Available Milestones</div>
              {MILESTONES.map(m => (
                <div key={m.threshold} style={{ background: '#0D0D0D', border: `1px solid ${m.redeemed ? '#1A1A1A' : 'rgba(112,59,247,0.3)'}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ fontSize: 20 }}>{m.redeemed ? '✅' : TOTAL_POINTS >= m.threshold ? '🎁' : '🔒'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: m.redeemed ? '#595959' : '#fff' }}>{m.threshold.toLocaleString()} pts — {m.reward}</div>
                    <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>{m.redeemed ? 'Already redeemed' : TOTAL_POINTS >= m.threshold ? 'Ready to redeem!' : `${m.threshold - TOTAL_POINTS} pts away`}</div>
                  </div>
                  {!m.redeemed && TOTAL_POINTS >= m.threshold && (
                    <button onClick={redeem} style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Redeem</button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Redemption History</div>
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, overflow: 'hidden' }}>
              {REDEMPTIONS.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < REDEMPTIONS.length - 1 ? '1px solid #141414' : 'none' }}>
                  <span style={{ fontSize: 20 }}>🎁</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{r.reward}</div>
                    <div style={{ fontSize: 11, color: '#595959', marginTop: 2 }}>{r.date} · {r.points} pts redeemed</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
