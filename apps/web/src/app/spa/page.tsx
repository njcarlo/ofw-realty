import { PageShell } from '@/components/PageShell'
import { EmbassyLocator } from '@/components/EmbassyLocator'
import Link from 'next/link'

const SPA_STEPS = [
  { step: 1, icon: '📄', title: 'Prepare Your Documents', desc: 'Gather your valid passport, proof of identity, and property details. Download the SPA template from the listing page.' },
  { step: 2, icon: '🔀', title: 'Choose Notarization Path', desc: 'Notarize at your nearest Philippine Embassy/Consulate (in-person) or use an online notarization service where legally recognized.' },
  { step: 3, icon: '🏛️', title: 'Embassy Appointment', desc: 'Book an appointment at your nearest Philippine Embassy or Consulate. Bring your passport, the completed SPA, and any required fees.' },
  { step: 4, icon: '✍️', title: 'Sign & Notarize', desc: 'Sign the SPA in front of the consular officer. The embassy will authenticate and notarize the document.' },
  { step: 5, icon: '🔏', title: 'Apostille / Authentication', desc: 'For countries under the Hague Convention, request an Apostille. For others, request consularization/authentication.' },
  { step: 6, icon: '📦', title: 'Send to Philippines', desc: 'Courier the original notarized SPA to your agent or attorney-in-fact in the Philippines.' },
  { step: 7, icon: '⬆️', title: 'Upload to Platform', desc: 'Upload a scanned copy of the notarized SPA to the platform so your agent can proceed with the transaction.' },
]

export default function SpaPage() {
  return (
    <PageShell badge="SPA Workflow" title="Sign Your SPA from Abroad" subtitle="Step-by-step guide to signing and notarizing your Special Power of Attorney — so you can buy property in the Philippines without flying home.">

      {/* What is SPA */}
      <div style={{ background: '#0D0D0D', border: '1px solid rgba(112,59,247,0.2)', borderLeft: '3px solid #703BF7', borderRadius: 12, padding: 24, marginBottom: 40 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#703BF7', marginBottom: 8 }}>What is an SPA?</div>
        <p style={{ fontSize: 14, color: '#595959', lineHeight: 1.7, margin: 0 }}>
          A <strong style={{ color: '#999' }}>Special Power of Attorney (SPA)</strong> is a legal document that authorizes a trusted representative in the Philippines to act on your behalf in property transactions — signing contracts, paying fees, and receiving the title — while you remain abroad.
        </p>
      </div>

      {/* Steps */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 24 }}>The 7-Step Process</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SPA_STEPS.map(s => (
            <div key={s.step} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#703BF7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, flexShrink: 0 }}>
                {s.step}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{s.title}</span>
                </div>
                <p style={{ fontSize: 14, color: '#595959', margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two paths */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Two Notarization Paths</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { icon: '🏛️', title: 'In-Person at Embassy', desc: 'Visit your nearest Philippine Embassy or Consulate. Book an appointment, bring your passport and the completed SPA form.', tag: '✓ Most accepted', tagColor: '#10B981', tagBg: 'rgba(16,185,129,0.1)', tagBorder: 'rgba(16,185,129,0.2)' },
            { icon: '💻', title: 'Online Notarization', desc: 'Available in select countries where online notarization is legally recognized. Check with your local Philippine consulate first.', tag: '⚠️ Check availability', tagColor: '#F59E0B', tagBg: 'rgba(245,158,11,0.1)', tagBorder: 'rgba(245,158,11,0.2)' },
          ].map(path => (
            <div key={path.title} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 28 }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{path.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 10 }}>{path.title}</div>
              <p style={{ fontSize: 14, color: '#595959', lineHeight: 1.6, marginBottom: 16 }}>{path.desc}</p>
              <span style={{ fontSize: 12, fontWeight: 600, color: path.tagColor, background: path.tagBg, border: `1px solid ${path.tagBorder}`, padding: '4px 10px', borderRadius: 99 }}>{path.tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Embassy Locator */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Find Your Nearest Embassy</div>
        <EmbassyLocator />
      </div>

      {/* CTA */}
      <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16, padding: '32px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Ready to start?</div>
          <p style={{ fontSize: 14, color: '#595959', margin: 0 }}>Download the SPA template pre-filled with your details from any listing page.</p>
        </div>
        <Link href="/map" style={{ background: '#703BF7', color: '#fff', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, boxShadow: '0 0 24px rgba(112,59,247,0.35)' }}>
          📥 Browse Properties
        </Link>
      </div>
    </PageShell>
  )
}
