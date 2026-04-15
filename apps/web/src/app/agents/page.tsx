import { PageShell } from '@/components/PageShell'
import { AgentCard } from '@/components/AgentCard'

const DEMO_AGENTS = [
  { id: 'd1', slug: 'maria-santos', prc_license_number: 'PRC-2024-001234', verified_badge: true, users: { full_name: 'Maria Santos', avatar_url: null }, broker_companies: { name: 'LUPA PH Realty', slug: 'lupaph-realty' } },
  { id: 'd2', slug: 'juan-dela-cruz', prc_license_number: 'PRC-2024-005678', verified_badge: true, users: { full_name: 'Juan Dela Cruz', avatar_url: null }, broker_companies: { name: 'Metro Realty Group', slug: 'metro-realty' } },
  { id: 'd3', slug: 'ana-reyes', prc_license_number: 'PRC-2023-009012', verified_badge: false, users: { full_name: 'Ana Reyes', avatar_url: null }, broker_companies: null },
  { id: 'd4', slug: 'carlo-mendoza', prc_license_number: 'PRC-2024-003456', verified_badge: true, users: { full_name: 'Carlo Mendoza', avatar_url: null }, broker_companies: { name: 'Visayas Properties', slug: 'visayas-properties' } },
  { id: 'd5', slug: 'liza-flores', prc_license_number: 'PRC-2022-007890', verified_badge: true, users: { full_name: 'Liza Flores', avatar_url: null }, broker_companies: { name: 'LUPA PH Realty', slug: 'lupaph-realty' } },
  { id: 'd6', slug: 'pedro-garcia', prc_license_number: 'PRC-2023-002345', verified_badge: false, users: { full_name: 'Pedro Garcia', avatar_url: null }, broker_companies: null },
]

async function getAgents(q?: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? ''
  if (!apiUrl) return DEMO_AGENTS
  try {
    const params = q ? `?q=${encodeURIComponent(q)}` : ''
    const res = await fetch(`${apiUrl}/agents${params}`, { next: { revalidate: 60 } })
    if (!res.ok) return DEMO_AGENTS
    const data = await res.json()
    return data.length > 0 ? data : DEMO_AGENTS
  } catch { return DEMO_AGENTS }
}

export default async function AgentDirectory({ searchParams }: { searchParams: { q?: string } }) {
  const agents = await getAgents(searchParams.q)
  const filtered = searchParams.q
    ? agents.filter((a: any) => a.users?.full_name?.toLowerCase().includes(searchParams.q!.toLowerCase()))
    : agents

  return (
    <PageShell badge="Our Agents" title="Meet Our Expert Agents" subtitle="Connect with verified, PRC-licensed real estate professionals across the Philippines.">
      <form style={{ display: 'flex', gap: 10, marginBottom: 40, maxWidth: 480 }}>
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search by name or location..."
          style={{ flex: 1, background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#fff', outline: 'none' }}
        />
        <button type="submit" style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Search
        </button>
      </form>

      <div style={{ fontSize: 13, color: '#595959', marginBottom: 24 }}>
        <span style={{ color: '#fff', fontWeight: 600 }}>{filtered.length}</span> agent{filtered.length !== 1 ? 's' : ''} found
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filtered.map((agent: any) => <AgentCard key={agent.id} agent={agent} />)}
      </div>
    </PageShell>
  )
}
