import { Injectable, BadRequestException } from '@nestjs/common'

// Pag-IBIG: 30-year term, 6.5% rate, 90% LTV, max loan PHP 6.5M
// Bank: 20-year term, 7.5% rate, 30% DSR
// In-house: 5-year term, 18% rate, 35% DSR

function monthlyPaymentToLoan(monthlyPayment: number, annualRate: number, termYears: number): number {
  const r = annualRate / 100 / 12
  const n = termYears * 12
  if (r === 0) return monthlyPayment * n
  return monthlyPayment * (1 - Math.pow(1 + r, -n)) / r
}

@Injectable()
export class PreQualifyService {
  compute(input: {
    monthly_gross_income: number
    existing_monthly_debts: number
    age: number
    employment_type: string
  }) {
    if (input.monthly_gross_income <= 0) {
      throw new BadRequestException('Monthly gross income must be positive')
    }

    const disposable = input.monthly_gross_income - input.existing_monthly_debts

    // Pag-IBIG: max 35% of gross income for amortization
    const pagibigMonthly = input.monthly_gross_income * 0.35
    const pagibigLoan = Math.min(
      monthlyPaymentToLoan(pagibigMonthly, 6.5, 30) * 0.90,
      6_500_000
    )

    // Bank: max 30% of gross income
    const bankMonthly = input.monthly_gross_income * 0.30
    const bankLoan = monthlyPaymentToLoan(bankMonthly, 7.5, 20)

    // In-house: max 35% of gross income
    const inhouseMonthly = input.monthly_gross_income * 0.35
    const inhouseLoan = monthlyPaymentToLoan(inhouseMonthly, 18.0, 5)

    return {
      pagibig_max_loan: Math.round(pagibigLoan),
      bank_max_loan: Math.round(bankLoan),
      inhouse_max_loan: Math.round(inhouseLoan),
      breakdown: {
        income_basis: input.monthly_gross_income,
        debt_deductions: input.existing_monthly_debts,
        pagibig_ratio: 0.35,
        bank_ratio: 0.30,
      },
      disclaimer: 'These are estimates only. Actual loan approval is subject to formal bank or Pag-IBIG assessment, credit history, and other qualifying criteria.',
    }
  }
}
