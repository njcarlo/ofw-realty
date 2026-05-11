import { AdminSidebar } from '@/components/AdminSidebar'
import Link from 'next/link'

const AI_URL = process.env.NEXT_PUBLIC_AI_CONCIERGE_URL ?? 'https://ofw-realty-concierge-portal.vercel.app'

export default function AIPage() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: 'Inter, sans-serif', color: '#fff' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>AI Concierge — Listahan</h1>
            <p style={{ fontSize: 14, color: '#595959', marginTop: 4 }}>Voice-based real estate AI assistant</p>
          </div>
          <a href={AI_URL} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, color: '#EC4899', border: '1px solid rgba(236,72,153,0.3)', borderRadius: 8, padding: '8px 14px' }}>
            Open Listahan AI ↗
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Config */}
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Configuration</div>
            {[
              { label: 'AI Model', value: 'GPT-4o-mini / Llama 3.3 (Groq)', color: '#EC4899' },
              { label: 'TTS Voice', value: 'Onyx (OpenAI) — deep male', color: '#EC4899' },
              { label: 'TTS Fallback', value: 'Browser speechSynthesis', color: '#595959' },
              { label: 'STT Language', value: 'en-PH (Taglish support)', color: '#EC4899' },
              { label: 'Silence Detection', value: '1.5 seconds', color: '#EC4899' },
              { label: 'Persona', value: 'Lobby concierge — warm male', color: '#EC4899' },
            ].map(c => (
              <div key={c.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #141414' }}>
                <span style={{ fontSize: 13, color: '#595959' }}>{c.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: c.color }}>{c.value}</span>
              </div>
            ))}
          </div>

          {/* Capabilities */}
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Capabilities</div>
            {[
              { icon: '🎙️', label: 'Voice input', desc: 'Continuous speech recognition' },
              { icon: '🔊', label: 'Voice output', desc: 'OpenAI TTS or browser speech' },
              { icon: '🏘️', label: 'Live listing search', desc: 'Queries Supabase in real-time' },
              { icon: '🤝', label: 'Broker referrals', desc: 'Top brokers by area (demo data)' },
              { icon: '🌐', label: 'Multilingual', desc: 'English, Filipino, Taglish' },
              { icon: '📞', label: 'Call simulation', desc: 'Ring, connect, end call UI' },
            ].map(c => (
              <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #141414' }}>
                <span style={{ fontSize: 18 }}>{c.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: '#595959' }}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Env vars status */}
        <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Environment Variables</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { key: 'OPENAI_API_KEY', set: !!process.env.OPENAI_API_KEY, desc: 'Required for TTS voice' },
              { key: 'GROQ_API_KEY', set: !!process.env.GROQ_API_KEY, desc: 'Free alternative for chat AI' },
              { key: 'NEXT_PUBLIC_SUPABASE_URL', set: !!process.env.NEXT_PUBLIC_SUPABASE_URL, desc: 'Listing database' },
              { key: 'SUPABASE_SERVICE_ROLE_KEY', set: !!process.env.SUPABASE_SERVICE_ROLE_KEY, desc: 'Bypass RLS for listing search' },
            ].map(v => (
              <div key={v.key} style={{ background: '#141414', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', fontFamily: 'monospace' }}>{v.key}</div>
                  <div style={{ fontSize: 11, color: '#595959' }}>{v.desc}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: v.set ? '#10B981' : '#EF4444' }}>
                  {v.set ? '✓ Set' : '✗ Missing'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
