'use client'
import { useState, useEffect } from 'react'
import { computeAmortization, PAGIBIG_CONSTRAINTS, BANK_CONSTRAINTS, INHOUSE_CONSTRAINTS } from '@ofw-realty/utils'

interface Props {
  listingPrice: number
}

type Scheme = 'pagibig' | 'bank' | 'inhouse'

const SCHEME_CONFIG = {
  pagibig: { label: 'Pag-IBIG', constraints: PAGIBIG_CONSTRAINTS, color: 'blue' },
  bank: { label: 'Bank Loan', constraints: BANK_CONSTRAINTS, color: 'green' },
  inhouse: { label: 'In-House', constraints: INHOUSE_CONSTRAINTS, color: 'purple' },
}

export function FinancingCalculator({ listingPrice }: Props) {
  const [scheme, setScheme] = useState<Scheme>('pagibig')
  const [loanAmount, setLoanAmount] = useState(listingPrice)
  const [downPaymentPct, setDownPaymentPct] = useState(PAGIBIG_CONSTRAINTS.defaultDownPaymentPct)
  const [interestRate, setInterestRate] = useState(PAGIBIG_CONSTRAINTS.defaultRate)
  const [termYears, setTermYears] = useState(PAGIBIG_CONSTRAINTS.defaultTermYears)
  const [error, setError] = useState<string | null>(null)

  const constraints = SCHEME_CONFIG[scheme].constraints

  useEffect(() => {
    setDownPaymentPct(constraints.defaultDownPaymentPct)
    setInterestRate(constraints.defaultRate)
    setTermYears(constraints.defaultTermYears)
    setError(null)
  }, [scheme])

  function validate(): boolean {
    if (interestRate < constraints.minRate || interestRate > constraints.maxRate) {
      setError(`Interest rate must be between ${constraints.minRate}% and ${constraints.maxRate}%`)
      return false
    }
    if (termYears < constraints.minTermYears || termYears > constraints.maxTermYears) {
      setError(`Loan term must be between ${constraints.minTermYears} and ${constraints.maxTermYears} years`)
      return false
    }
    setError(null)
    return true
  }

  const result = validate() ? computeAmortization({ loanAmount, downPaymentPct, interestRateAnnual: interestRate, termYears }) : null

  return (
    <div className="border rounded-xl p-4">
      <h2 className="font-semibold mb-3">Financing Calculator</h2>

      {/* Scheme tabs */}
      <div className="flex gap-2 mb-4">
        {(Object.keys(SCHEME_CONFIG) as Scheme[]).map(s => (
          <button
            key={s}
            onClick={() => setScheme(s)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              scheme === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {SCHEME_CONFIG[s].label}
          </button>
        ))}
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <label className="text-gray-500 text-xs">Loan Amount (PHP)</label>
          <input
            type="number"
            value={loanAmount}
            onChange={e => setLoanAmount(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-1.5 mt-0.5"
          />
        </div>
        <div>
          <label className="text-gray-500 text-xs">Down Payment (%)</label>
          <input
            type="number"
            value={downPaymentPct}
            onChange={e => setDownPaymentPct(Number(e.target.value))}
            min={0} max={100}
            className="w-full border rounded-lg px-3 py-1.5 mt-0.5"
          />
        </div>
        <div>
          <label className="text-gray-500 text-xs">
            Interest Rate (%) — {constraints.minRate}% to {constraints.maxRate}%
          </label>
          <input
            type="number"
            value={interestRate}
            onChange={e => { setInterestRate(Number(e.target.value)); validate() }}
            step={0.1}
            className="w-full border rounded-lg px-3 py-1.5 mt-0.5"
          />
        </div>
        <div>
          <label className="text-gray-500 text-xs">
            Term (years) — max {constraints.maxTermYears} yrs
          </label>
          <input
            type="number"
            value={termYears}
            onChange={e => { setTermYears(Number(e.target.value)); validate() }}
            min={constraints.minTermYears} max={constraints.maxTermYears}
            className="w-full border rounded-lg px-3 py-1.5 mt-0.5"
          />
        </div>
      </div>

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

      {result && (
        <div className="mt-4 bg-blue-50 rounded-xl p-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Monthly Payment</span>
            <span className="font-bold text-blue-700">₱{result.monthlyAmortization.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Down Payment</span>
            <span className="font-medium">₱{result.downPayment.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Interest</span>
            <span className="font-medium">₱{result.totalInterest.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t pt-1 mt-1">
            <span className="text-gray-600">Total Cost</span>
            <span className="font-bold">₱{result.totalCost.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  )
}
