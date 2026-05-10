'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DeveloperSidebar } from '@/components/DeveloperSidebar'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

const STATUS_COLORS: Record<string, string> = {
  pre_selling: '#703BF7',
  ready_for_occupancy: '#10B981',
  sold_out: '#595959',
  on_hold: '#F59E0B',
}
const STATUS_LABELS: Record<string, string> = {
  pre_selling: 'Pre-Selling',
  ready_for_occupancy: 'Ready for Occupancy',
  sold_out: 'Sold Out',
  on_hold: 'On Hold',
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token
      if (!token) { router.replace('/onboarding'); return }
      const res = await fetch(`${API}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) setProjects(await res.json())
      setLoading(false)
    })
  }, [router])

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <DeveloperSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Projects</h1>
            <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <a href="/projects/new" style={{ background: '#703BF7', color: '#fff', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, boxShadow: '0 0 20px rgba(112,59,247,0.3)' }}>
            + Create Project
          </a>
        </div>

        {loading ? (
          <div style={{ color: '#595959', fontSize: 14 }}>Loading…</div>
        ) : projects.length === 0 ? (
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏗️</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>No projects yet</div>
            <p style={{ fontSize: 14, color: '#595959', marginBottom: 24 }}>Create your first project to start publishing inventory.</p>
            <a href="/projects/new" style={{ background: '#703BF7', color: '#fff', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600 }}>
              + Create Project
            </a>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {projects.map((p: any) => {
              const color = STATUS_COLORS[p.status] ?? '#595959'
              return (
                <a key={p.id} href={`/projects/${p.id}`} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 20, display: 'block' }}>
                  {/* Cover photo */}
                  <div style={{ width: '100%', height: 140, borderRadius: 8, background: '#141414', marginBottom: 16, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.primary_photo ? (
                      <img src={p.primary_photo} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 40 }}>🏗️</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', flex: 1, marginRight: 10 }}>{p.name}</div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: `${color}15`, color, flexShrink: 0 }}>
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#595959', marginBottom: 14 }}>{p.city}, {p.province} · {p.project_type?.replace('_', ' ')}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[
                      { label: 'Total', value: p.total_units ?? 0, color: '#999' },
                      { label: 'Avail', value: p.available ?? 0, color: '#10B981' },
                      { label: 'Rsvd', value: p.reserved ?? 0, color: '#F59E0B' },
                      { label: 'Sold', value: p.sold ?? 0, color: '#8B5CF6' },
                    ].map(s => (
                      <div key={s.label} style={{ background: '#141414', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
