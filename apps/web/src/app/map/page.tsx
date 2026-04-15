import { MapViewWithPanel } from '@/components/Map/MapViewWithPanel'
import { Navbar } from '@/components/Navbar'

export default function MapPage() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0 }}>
        <Navbar />
      </div>
      <div style={{ flex: 1, marginTop: 80, overflow: 'hidden', position: 'relative' }}>
        <MapViewWithPanel />
      </div>
    </div>
  )
}
