// Services Portal — Service Request Board
export default function RequestsPage() {
  return (
    <div style={{ padding: 32, fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>Service Requests</h1>
          <p style={{ fontSize: 14, color: '#595959', margin: '6px 0 0' }}>
            Open requests from buyers, sellers, and developers.
          </p>
        </div>
        <a
          href="/requests/new"
          style={{
            background: '#703BF7',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 0 20px rgba(112,59,247,0.3)',
          }}
        >
          + Post Request
        </a>
      </div>
      <div style={{
        background: '#0D0D0D',
        border: '1px solid #1A1A1A',
        borderRadius: 12,
        padding: '40px 32px',
        textAlign: 'center',
        color: '#595959',
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 6 }}>Request board coming soon</div>
        <div style={{ fontSize: 13 }}>Filterable by service type, location, and date posted.</div>
      </div>
    </div>
  )
}
