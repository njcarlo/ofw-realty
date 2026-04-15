'use client'
import { useState, useEffect } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface FbConnection {
  fb_user_name: string
  fb_page_name: string | null
  fb_ad_account_id: string | null
  fb_ad_account_name: string | null
  token_expires_at: string | null
}

interface Props {
  onConnected: (conn: FbConnection) => void
  onDisconnected: () => void
}

export function FacebookConnectBanner({ onConnected, onDisconnected }: Props) {
  const [connection, setConnection] = useState<FbConnection | null>(null)
  const [loading, setLoading] = useState(true)
  const [adAccounts, setAdAccounts] = useState<any[]>([])
  const [pages, setPages] = useState<any[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState('')
  const [selectedPage, setSelectedPage] = useState('')

  useEffect(() => {
    loadConnection()
    // Check if returning from OAuth
    const params = new URLSearchParams(window.location.search)
    if (params.get('fb_connected')) {
      loadConnection()
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  async function loadConnection() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/ads/connection`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setConnection(data)
        if (data) onConnected(data)
      }
    } catch {}
    setLoading(false)
  }

  async function connect() {
    const res = await fetch(`${API}/ads/connect`, { credentials: 'include' })
    if (res.ok) {
      const { url } = await res.json()
      window.location.href = url
    }
  }

  async function disconnect() {
    await fetch(`${API}/ads/disconnect`, { method: 'POST', credentials: 'include' })
    setConnection(null)
    onDisconnected()
  }

  async function openPicker() {
    setShowPicker(true)
    const [accRes, pageRes] = await Promise.all([
      fetch(`${API}/ads/ad-accounts`, { credentials: 'include' }),
      fetch(`${API}/ads/pages`, { credentials: 'include' }),
    ])
    if (accRes.ok) setAdAccounts(await accRes.json())
    if (pageRes.ok) setPages(await pageRes.json())
    setSelectedAccount(connection?.fb_ad_account_id ?? '')
    setSelectedPage(connection?.fb_page_name ?? '')
  }

  async function savePicker() {
    setSaving(true)
    await fetch(`${API}/ads/connection`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fb_ad_account_id: selectedAccount, fb_page_id: selectedPage }),
    })
    setSaving(false)
    setShowPicker(false)
    loadConnection()
  }

  if (loading) return null

  if (!connection) {
    return (
      <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 12, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 32 }}>📘</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Connect your Facebook Ad Account</div>
          <div style={{ fontSize: 13, color: '#595959' }}>Connect your own Facebook account to run ads using your Ad Account and Page. Each agent/broker uses their own FB credentials.</div>
        </div>
        <button onClick={connect} style={{ background: '#1877F2', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>f</span> Connect Facebook
        </button>
      </div>
    )
  }

  const daysLeft = connection.token_expires_at
    ? Math.round((new Date(connection.token_expires_at).getTime() - Date.now()) / 86400000)
    : null

  return (
    <>
      <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 36, height: 36, background: '#1877F2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>f</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
            ✅ Connected as {connection.fb_user_name}
          </div>
          <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>
            {connection.fb_ad_account_name
              ? `Ad Account: ${connection.fb_ad_account_name} · Page: ${connection.fb_page_name ?? 'None selected'}`
              : '⚠️ No Ad Account selected — click "Change" to pick one'}
            {daysLeft !== null && daysLeft < 14 && (
              <span style={{ color: '#F59E0B', marginLeft: 8 }}>⚠️ Token expires in {daysLeft}d</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={openPicker} style={{ background: 'transparent', color: '#703BF7', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
            Change Account
          </button>
          <button onClick={disconnect} style={{ background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
            Disconnect
          </button>
        </div>
      </div>

      {showPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 24 }}>
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 20px' }}>Select Ad Account & Page</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Ad Account</label>
              {adAccounts.length === 0 ? (
                <div style={{ fontSize: 13, color: '#595959', padding: '10px 14px', background: '#141414', borderRadius: 8 }}>Loading ad accounts...</div>
              ) : (
                <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} style={{ width: '100%', background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fff', boxSizing: 'border-box' }}>
                  <option value="">Select an ad account...</option>
                  {adAccounts.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.id})</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Facebook Page</label>
              {pages.length === 0 ? (
                <div style={{ fontSize: 13, color: '#595959', padding: '10px 14px', background: '#141414', borderRadius: 8 }}>Loading pages...</div>
              ) : (
                <select value={selectedPage} onChange={e => setSelectedPage(e.target.value)} style={{ width: '100%', background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fff', boxSizing: 'border-box' }}>
                  <option value="">Select a page...</option>
                  {pages.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowPicker(false)} style={{ background: 'transparent', color: '#595959', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={savePicker} disabled={saving || !selectedAccount} style={{ background: saving ? '#333' : '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
