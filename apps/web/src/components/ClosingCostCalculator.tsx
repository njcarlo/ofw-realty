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

export function ClosingCostCalculator({ listingId, listingPrice }: Props) {
  const [sellingPrice, setSellingPrice] = useState(listingPrice)
  const [result, setResult] = useState<ClosingCostResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCosts(listingPrice)
  }, [listingId])

  async function fetchCosts(price: number) {
    setLoading(true)
    try {
      const res = await fetch(`/api/listings/${listingId}/closing-costs?selling_price=${price}`)
      const data = await res.json()
      setResult(data)
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  const rows = result ? [
    { label: 'Capital Gains Tax (6%)', value: result.breakdown.cgt },
    { label: 'Documentary Stamp Tax (1.5%)', value: result.breakdown.dst },
    { label: 'Transfer Tax (LGU rate)', value: result.breakdown.transfer_tax },
    { label: 'Registration Fee (LRA)', value: result.breakdown.registration_fee },
    { label: 'Notarial Fee (~1.5%)', value: result.breakdown.notarial_fee },
    { label: 'Miscellaneous Fees', value: result.breakdown.misc_fees },
  ] : []

  return (
    <div className="border rounded-xl p-4">
      <h2 className="font-semibold mb-3">Closing Cost Calculator</h2>

      <div className="flex gap-2 mb-3">
        <input
          type="number"
          value={sellingPrice}
          onChange={e => setSellingPrice(Number(e.target.value))}
          className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
          placeholder="Selling price (PHP)"
        />
        <button
          onClick={() => fetchCosts(sellingPrice)}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700"
        >
          Calculate
        </button>
      </div>

      {loading && <p className="text-xs text-gray-400">Calculating...</p>}

      {result && (
        <>
          <div className="space-y-1.5 text-sm">
            {rows.map(row => (
              <div key={row.label} className="flex justify-between">
                <span className="text-gray-600">{row.label}</span>
                <span className="font-medium">₱{row.value.toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-2 mt-1 font-bold">
              <span>Total Closing Costs</span>
              <span className="text-blue-700">₱{result.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>Total Investment</span>
              <span className="text-green-700">₱{(sellingPrice + result.total).toLocaleString()}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">{result.disclaimer}</p>
        </>
      )}
    </div>
  )
}
