import { BrokerSidebar } from '@/components/BrokerSidebar'

export default function CompanyProfilePage() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <BrokerSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Company Profile</h1>
            <p style={{ fontSize: 14, color: '#595959', margin: '4px 0 0' }}>Your public brokerage page on LUPAPH</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <a href="http://localhost:3000/brokers/lupaph-realty" target="_blank" style={{ background: '#0D0D0D', color: '#999', padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 500, border: '1px solid #1A1A1A' }}>
              👁️ View Public Page
            </a>
            <button style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 20px rgba(112,59,247,0.3)' }}>
              Save Changes
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Basic info */}
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Basic Information</div>
              {[
                { label: 'Company Name', value: 'LupaPH Realty', type: 'text' },
                { label: 'Office Address', value: 'Makati City, Metro Manila', type: 'text' },
                { label: 'Description', value: 'Premier real estate brokerage serving OFWs and Filipinos abroad.', type: 'textarea' },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: '#595959', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea defaultValue={f.value} rows={3} style={{ width: '100%', background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#fff', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  ) : (
                    <input type="text" defaultValue={f.value} style={{ width: '100%', background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                  )}
                </div>
              ))}
            </div>

            {/* Social links */}
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Social Media Links</div>
              {[
                { label: 'Facebook Page', placeholder: 'https://facebook.com/yourpage', icon: '📘' },
                { label: 'Instagram', placeholder: 'https://instagram.com/yourhandle', icon: '📸' },
                { label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourcompany', icon: '💼' },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: '#595959', display: 'block', marginBottom: 6 }}>{f.icon} {f.label}</label>
                  <input type="url" placeholder={f.placeholder} style={{ width: '100%', background: '#141414', border: '1px solid #1A1A1A', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Verified badge status */}
            <div style={{ background: '#0D0D0D', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🔐</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Verified Brokerage</div>
                  <div style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>✓ Badge Active</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#595959', lineHeight: 1.6, margin: 0 }}>
                Your brokerage has completed all 9 required document verifications. Your Verified Brokerage Badge is displayed on all your listings and company profile.
              </p>
            </div>

            {/* Operating hours */}
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Operating Hours</div>
              {['Monday–Friday', 'Saturday', 'Sunday'].map((day, i) => (
                <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, color: '#999' }}>{day}</span>
                  <input type="text" defaultValue={i === 2 ? 'Closed' : '8:00 AM – 5:00 PM'} style={{ background: '#141414', border: '1px solid #1A1A1A', borderRadius: 6, padding: '6px 12px', fontSize: 13, color: '#fff', outline: 'none', width: 160, textAlign: 'center' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
