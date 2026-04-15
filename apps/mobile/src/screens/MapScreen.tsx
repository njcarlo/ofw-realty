import React, { useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import MapLibreGL from '@maplibre/maplibre-react-native'
import { PHILIPPINES_CENTER, PHILIPPINES_BOUNDS, DEFAULT_STYLE_URL } from '@ofw-realty/map'

MapLibreGL.setAccessToken(null) // Not needed for OpenFreeMap

export function MapScreen() {
  const camera = useRef<MapLibreGL.Camera>(null)

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        styleURL={DEFAULT_STYLE_URL}
        logoEnabled={false}
        compassEnabled
        zoomEnabled
        scrollEnabled
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <MapLibreGL.Camera
          ref={camera}
          zoomLevel={6}
          centerCoordinate={PHILIPPINES_CENTER}
          maxBounds={{
            ne: [PHILIPPINES_BOUNDS[1][0] + 2, PHILIPPINES_BOUNDS[1][1] + 2],
            sw: [PHILIPPINES_BOUNDS[0][0] - 2, PHILIPPINES_BOUNDS[0][1] - 2],
          }}
        />
      </MapLibreGL.MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
})
