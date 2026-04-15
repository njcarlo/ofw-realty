export interface FinancingInput {
  loanAmount: number
  downPaymentPct: number
  interestRateAnnual: number
  termYears: number
}

export interface FinancingResult {
  monthlyAmortization: number
  totalInterest: number
  totalCost: number
  loanAmount: number
  downPayment: number
}

export function computeAmortization(input: FinancingInput): FinancingResult {
  const downPayment = input.loanAmount * (input.downPaymentPct / 100)
  const principal = input.loanAmount - downPayment
  const monthlyRate = input.interestRateAnnual / 100 / 12
  const n = input.termYears * 12

  let monthlyAmortization: number
  if (monthlyRate === 0) {
    monthlyAmortization = principal / n
  } else {
    monthlyAmortization = principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) /
      (Math.pow(1 + monthlyRate, n) - 1)
  }

  const totalCost = monthlyAmortization * n + downPayment
  const totalInterest = totalCost - input.loanAmount

  return {
    monthlyAmortization: Math.round(monthlyAmortization * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    loanAmount: input.loanAmount,
    downPayment: Math.round(downPayment * 100) / 100,
  }
}

// Pag-IBIG constraints
export const PAGIBIG_CONSTRAINTS = {
  minRate: 3.0,
  maxRate: 10.0,
  minTermYears: 1,
  maxTermYears: 30,
  maxLoanAmount: 6_500_000,
  defaultRate: 6.5,
  defaultTermYears: 20,
  defaultDownPaymentPct: 10,
}

// Bank mortgage constraints
export const BANK_CONSTRAINTS = {
  minRate: 5.0,
  maxRate: 15.0,
  minTermYears: 1,
  maxTermYears: 20,
  defaultRate: 7.5,
  defaultTermYears: 15,
  defaultDownPaymentPct: 20,
}

// In-house financing constraints
export const INHOUSE_CONSTRAINTS = {
  minRate: 10.0,
  maxRate: 24.0,
  minTermYears: 1,
  maxTermYears: 10,
  defaultRate: 18.0,
  defaultTermYears: 5,
  defaultDownPaymentPct: 20,
}
