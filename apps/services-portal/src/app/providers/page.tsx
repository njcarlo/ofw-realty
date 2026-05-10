// Services Portal — Provider Directory
export default function ProvidersPage() {
  return (
    <div style={{ padding: 32, fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0 }}>Service Providers</h1>
        <p style={{ fontSize: 14, color: '#595959', margin: '6px 0 0' }}>
          Browse licensed real estate professionals available in your area.
        </p>
      </div>
      <div style={{
        background: '#0D0D0D',
        border: '1px solid #1A1A1A',
        borderRadius: 12,
        padding: '40px 32px',
        textAlign: 'center',
        color: '#595959',
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>👷</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 6 }}>Provider directory coming soon</div>
        <div style={{ fontSize: 13 }}>Filterable by service type, coverage area, and availability.</div>
      </div>
    </div>
  )
}
