'use client'
import { useState, useEffect } from 'react'

interface ClosingCostBreakdown {
  cgt: number
  dst: number
  transfer_tax: number
  registration_fee: number
  notarial_fee: number
  misc_fees: number
}

interface ClosingCostResult {
  selling_price: number
  breakdown: ClosingCostBreakdown
  total: number
  disclaimer: string
}

interface Props {
  listingId: string
  listingPrice: number
}

// Local fallback calculator — matches the NestJS service logic
function calculateLocally(price: number): ClosingCostResult {
  const cgt = price * 0.06
  const dst = price * 0.015
  const transferTax = price * 0.005
  const registrationFee = price <= 1_750_000 ? 8_796
    : price <= 2_000_000 ? 10_621
    : price <= 3_000_000 ? 13_621
    : price <= 5_000_000 ? 18_621
    : 18_621 + (price - 5_000_000) * 0.0025
  const notarialFee = price * 0.015
  const miscFees = price * 0.005
  const total = cgt + dst + transferTax + registrationFee + notarialFee + miscFees

  return {
    selling_price: price,
    breakdown: {
      cgt: Math.round(cgt * 100) / 100,
      dst: Math.round(dst * 100) / 100,
      transfer_tax: Math.round(transferTax * 100) / 100,
      registration_fee: Math.round(registrationFee * 100) / 100,
      notarial_fee: Math.round(notarialFee * 100) / 100,
      misc_fees: Math.round(miscFees * 100) / 100,
    },
    total: Math.round(total * 100) / 100,
    disclaimer: 'These are estimates only. Actual fees may vary by LGU and are subject to change. Consult a licensed real estate attorney for exact figures.',
  }
}

export function ClosingCostCalculator({ listingId, listingPrice }: Props) {
  const [sellingPrice, setSellingPrice] = useState(listingPrice)
  const [inputValue, setInputValue] = useState(listingPrice.toString())
  const [result, setResult] = useState<ClosingCostResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    calculate(listingPrice)
  }, [listingId, listingPrice])

  async function calculate(price: number) {
    if (!price || price <= 0) return
    setLoading(true)
    try {
      const res = await fetch(`/api/listings/${listingId}/closing-costs?selling_price=${price}`)
      if (res.ok) {
        const data = await res.json()
        if (data && data.total) {
          setResult(data)
          setLoading(false)
          return
        }
      }
    } catch {}
    // Fallback to local calculation
    setResult(calculateLocally(price))
    setLoading(false)
  }

  function handlePriceChange(val: string) {
    setInputValue(val)
    const num = parseFloat(val.replace(/,/g, ''))
    if (!isNaN(num) && num > 0) setSellingPrice(num)
  }

  async function downloadPDF() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/listings/${listingId}/closing-costs/pdf?selling_price=${sellingPrice}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `closing-costs-${listingId}.html`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {}
    setDownloading(false)
  }

  const rows = result ? [
    { label: 'Capital Gains Tax (6%)', value: result.breakdown.cgt, color: '#fff' },
    { label: 'Documentary Stamp Tax (1.5%)', value: result.breakdown.dst, color: '#fff' },
    { label: 'Transfer Tax (LGU ~0.5%)', value: result.breakdown.transfer_tax, color: '#fff' },
    { label: 'Registration Fee (LRA)', value: result.breakdown.registration_fee, color: '#fff' },
    { label: 'Notarial Fee (~1.5%)', value: result.breakdown.notarial_fee, color: '#fff' },
    { label: 'Miscellaneous Fees', value: result.breakdown.misc_fees, color: '#fff' },
  ] : []

  const totalInvestment = result ? sellingPrice + result.total : 0

  return (
    <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, padding: 24 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>🧮 Closing Cost Calculator</div>
      <div style={{ fontSize: 13, color: '#595959', marginBottom: 20 }}>Estimate all taxes and fees for this property</div>

      {/* Price input */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#595959', fontWeight: 600 }}>₱</span>
          <input
            type="text"
            value={inputValue}
            onChange={e => handlePriceChange(e.target.value)}
            onBlur={() => calculate(sellingPrice)}
            onKeyDown={e => e.key === 'Enter' && calculate(sellingPrice)}
            placeholder="Enter selling price"
            style={{ width: '100%', background: '#141414', border: '1px solid #262626', borderRadius: 8, padding: '10px 14px 10px 28px', fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <button
          onClick={() => calculate(sellingPrice)}
          disabled={loading}
          style={{ background: '#703BF7', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '...' : 'Calculate'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {rows.map((row, i) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #141414' }}>
                <span style={{ fontSize: 13, color: '#595959' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>₱{row.value.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </div>
            ))}

            {/* Total closing costs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #1A1A1A' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Total Closing Costs</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#F59E0B' }}>₱{result.total.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>

            {/* Selling price */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #141414' }}>
              <span style={{ fontSize: 13, color: '#595959' }}>Selling Price</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>₱{sellingPrice.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>

            {/* Total investment */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0 0' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Total Investment</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#10B981' }}>₱{totalInvestment.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
          </div>

          {/* Breakdown bar */}
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', gap: 1 }}>
              <div style={{ flex: sellingPrice, background: '#703BF7' }} title="Selling Price" />
              <div style={{ flex: result.total, background: '#F59E0B' }} title="Closing Costs" />
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: '#595959' }}>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#703BF7', marginRight: 4 }} />Selling Price</span>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#F59E0B', marginRight: 4 }} />Closing Costs ({((result.total / sellingPrice) * 100).toFixed(1)}%)</span>
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={downloadPDF}
            disabled={downloading}
            style={{ width: '100%', background: 'transparent', color: '#703BF7', border: '1px solid rgba(112,59,247,0.3)', borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: downloading ? 'not-allowed' : 'pointer', marginBottom: 12 }}
          >
            {downloading ? 'Generating...' : '📄 Download Cost Summary'}
          </button>

          <p style={{ fontSize: 11, color: '#595959', lineHeight: 1.6, margin: 0 }}>{result.disclaimer}</p>
        </>
      )}
    </div>
  )
}
