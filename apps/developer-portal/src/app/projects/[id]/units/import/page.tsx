'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DeveloperSidebar } from '@/components/DeveloperSidebar'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

interface ValidationError {
  row: number
  field: string
  message: string
}

interface ImportResult {
  success: boolean
  imported?: number
  errors?: ValidationError[]
}

export default function UnitImportPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setResult(null)
    try {
      const { data: s } = await supabase.auth.getSession()
      const token = s.session?.access_token
      if (!token) { router.replace('/onboarding'); return }

      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${API}/api/projects/${id}/units/bulk`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        setResult({ success: true, imported: data.imported ?? data.count })
      } else {
        setResult({ success: false, errors: data.errors ?? [{ row: 0, field: 'general', message: data.message ?? 'Import failed.' }] })
      }
    } finally {
      setLoading(false)
    }
  }

  const templateCsv = 'unit_type,identifier,floor_area_sqm,price_php,status\nHouse & Lot,Block 1 Lot 1,120,3500000,available\nHouse & Lot,Block 1 Lot 2,120,3500000,available'

  function downloadTemplate() {
    const blob = new Blob([templateCsv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'unit-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#000', fontFamily: "'Inter', system-ui, sans-serif", color: '#fff' }}>
      <DeveloperSidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <a href={`/projects/${id}`} style={{ color: '#595959', fontSize: 14 }}>← Project</a>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>Import Units via CSV</h1>
        </div>

        <div style={{ maxWidth: 600 }}>
          {/* Template download */}
          <div style={{ background: '#0D0D0D', border: '1px solid rgba(112,59,247,0.2)', borderRadius: 12, padding: 20, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Download Template</div>
              <div style={{ fontSize: 13, color: '#595959' }}>Use this template to format your unit data correctly.</div>
            </div>
            <button onClick={downloadTemplate} style={{ background: 'transparent', color: '#703BF7', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
              📥 Download CSV Template
            </button>
          </div>

          {/* Required columns info */}
          <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Required Columns</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { col: 'unit_type', desc: 'e.g. House & Lot, Condo Unit' },
                { col: 'identifier', desc: 'Block/Lot or Floor/Unit number' },
                { col: 'floor_area_sqm', desc: 'Numeric, greater than 0' },
                { col: 'price_php', desc: 'Numeric, greater than 0' },
                { col: 'status', desc: 'available, reserved, or sold' },
              ].map(c => (
                <div key={c.col} style={{ background: '#141414', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#703BF7', fontFamily: 'monospace', marginBottom: 3 }}>{c.col}</div>
                  <div style={{ fontSize: 11, color: '#595959' }}>{c.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload form */}
          <form onSubmit={handleUpload} style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Upload CSV File</div>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#141414', border: `2px dashed ${file ? '#10B981' : '#1A1A1A'}`, borderRadius: 10, padding: '32px 20px', cursor: 'pointer', marginBottom: 20 }}>
              <span style={{ fontSize: 36 }}>{file ? '✅' : '📄'}</span>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: file ? '#10B981' : '#999', fontWeight: 500 }}>{file ? file.name : 'Click to select CSV file'}</div>
                <div style={{ fontSize: 12, color: '#595959', marginTop: 4 }}>Only .csv files accepted</div>
              </div>
              <input type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={e => { setFile(e.target.files?.[0] ?? null); setResult(null) }} />
            </label>

            <button type="submit" disabled={!file || loading} style={{ width: '100%', background: !file || loading ? '#333' : '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: !file || loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Uploading & Validating…' : 'Upload and Import'}
            </button>
          </form>

          {/* Validation report */}
          {result && (
            <div style={{ marginTop: 20 }}>
              {result.success ? (
                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#10B981', marginBottom: 6 }}>✅ Import Successful</div>
                  <p style={{ fontSize: 14, color: '#595959', margin: 0 }}>{result.imported} unit{result.imported !== 1 ? 's' : ''} imported successfully.</p>
                  <a href={`/projects/${id}`} style={{ display: 'inline-block', marginTop: 14, color: '#703BF7', fontSize: 13 }}>← Back to project</a>
                </div>
              ) : (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#EF4444', marginBottom: 12 }}>❌ Validation Failed — No units were imported</div>
                  <p style={{ fontSize: 13, color: '#595959', marginBottom: 14 }}>Fix the following errors and re-upload:</p>
                  <div style={{ background: '#141414', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '60px 120px 1fr', padding: '8px 14px', borderBottom: '1px solid #1A1A1A' }}>
                      {['Row', 'Field', 'Error'].map(h => (
                        <div key={h} style={{ fontSize: 11, color: '#595959', fontWeight: 600, textTransform: 'uppercase' }}>{h}</div>
                      ))}
                    </div>
                    {result.errors?.map((err, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 120px 1fr', padding: '10px 14px', borderBottom: i < (result.errors?.length ?? 0) - 1 ? '1px solid #1A1A1A' : 'none' }}>
                        <div style={{ fontSize: 13, color: '#EF4444', fontWeight: 600 }}>{err.row || '—'}</div>
                        <div style={{ fontSize: 13, color: '#999', fontFamily: 'monospace' }}>{err.field}</div>
                        <div style={{ fontSize: 13, color: '#fff' }}>{err.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
