interface Props {
  city: string
  province: string
}

export async function ZonalValueBadge({ city, province }: Props) {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001'
  try {
    const res = await fetch(
      `${apiUrl}/map/zonal-value?city=${encodeURIComponent(city)}&province=${encodeURIComponent(province)}`,
      { next: { revalidate: 86400 } } // cache 24h
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data.zonal_value_per_sqm) return null

    return (
      <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs">
        <span className="text-amber-600 font-medium">BIR Zonal Value</span>
        <span className="font-bold text-amber-800">₱{Number(data.zonal_value_per_sqm).toLocaleString()}/sqm</span>
        <span className="text-amber-500">· {city}</span>
      </div>
    )
  } catch {
    return null
  }
}
