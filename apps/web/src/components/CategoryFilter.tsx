'use client'
import { useRouter, useSearchParams } from 'next/navigation'

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'House & Lot', value: 'house_and_lot' },
  { label: 'Condo', value: 'condo' },
  { label: 'Lot', value: 'residential_lot' },
  { label: 'Farm Lot', value: 'farm_lot' },
  { label: 'Commercial', value: 'commercial' },
]

export function CategoryFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentType = searchParams.get('type') ?? ''

  function handleFilter(value: string) {
    const url = value ? `/?type=${value}` : '/'
    // Replace state so it doesn't scroll to top
    router.push(url, { scroll: false })
  }

  return (
    <div style={{ display: 'flex', gap: 6, background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 10, padding: 6 }}>
      {CATEGORIES.map(cat => (
        <button
          key={cat.value}
          onClick={() => handleFilter(cat.value)}
          style={{
            padding: '7px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500,
            background: currentType === cat.value ? '#703BF7' : 'transparent',
            color: currentType === cat.value ? '#fff' : '#595959',
            border: 'none', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}
