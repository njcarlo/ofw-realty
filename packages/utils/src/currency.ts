export const OFW_CURRENCIES = ['USD', 'AED', 'SGD', 'HKD', 'SAR'] as const
export type OFWCurrency = typeof OFW_CURRENCIES[number]

interface ExchangeRates {
  rates: Record<OFWCurrency, number>
  fetchedAt: number
}

let cachedRates: ExchangeRates | null = null
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

export async function getExchangeRates(): Promise<Record<OFWCurrency, number>> {
  const now = Date.now()
  if (cachedRates && now - cachedRates.fetchedAt < CACHE_TTL) {
    return cachedRates.rates
  }

  try {
    // Free exchange rate API (no key required for basic rates)
    const res = await fetch('https://open.er-api.com/v6/latest/PHP')
    const data = await res.json()
    const rates: Record<OFWCurrency, number> = {
      USD: data.rates.USD,
      AED: data.rates.AED,
      SGD: data.rates.SGD,
      HKD: data.rates.HKD,
      SAR: data.rates.SAR,
    }
    cachedRates = { rates, fetchedAt: now }
    return rates
  } catch {
    // Return last cached rates or fallback
    return cachedRates?.rates ?? { USD: 0.017, AED: 0.063, SGD: 0.023, HKD: 0.134, SAR: 0.065 }
  }
}

export function convertFromPHP(amountPHP: number, rates: Record<OFWCurrency, number>) {
  return Object.fromEntries(
    OFW_CURRENCIES.map(currency => [
      currency,
      Math.round(amountPHP * rates[currency] * 100) / 100,
    ])
  ) as Record<OFWCurrency, number>
}
