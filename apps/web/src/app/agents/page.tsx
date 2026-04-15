import { PageShell, SectionHeader } from '@/components/PageShell'
import { AgentCard } from '@/components/AgentCard'

async function getAgents(q?: string) {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001'
  try {
    const params = q ? `?q=${encodeURIComponent(q)}` : ''
    const res = await fetch(`${apiUrl}/agents${params}`, { next: { revalidate: 60 } })
    if (!res.ok) return []
    return res.json()
  } catch { return [] }
}

export default async function AgentDirectory({ searchParams }: { searchParams: { q?: string } }) {
  const agents = await getAgents(searchParams.q)

  return (
    <PageShell badge="Our Agents" title="Meet Our Expert Agents" subtitle="Connect with verified, PRC-licensed real estate professionals across the Philippines.">
      {/* Search */}
      <form style={{ display: 'flex', gap: 10, marginBottom: 40, maxWidth: 480 }}>
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search by name or location..."
          style={{
            flex: 1, background: '#0D0D0D', border: '1px solid #1A1A1A',
            borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#fff', outline: 'none',
          }}
        />
        <button type="submit" style={{
          background: '#703BF7', color: '#fff', border: 'none',
          borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          Search
        </button>
      </form>

      {agents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#595959' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#999', marginBottom: 8 }}>No agents found</div>
          <div style={{ fontSize: 14 }}>Agents will appear here once they register and get verified</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#595959', marginBottom: 24 }}>
            <span style={{ color: '#fff', fontWeight: 600 }}>{agents.length}</span> agent{agents.length !== 1 ? 's' : ''} found
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {agents.map((agent: any) => <AgentCard key={agent.id} agent={agent} />)}
          </div>
        </>
      )}
    </PageShell>
  )
}
