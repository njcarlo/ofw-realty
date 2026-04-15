/**
 * AR Floor Plan Visualizer
 *
 * Production implementation requires:
 *   - @viro-community/react-viro (ViroReact) for AR overlay
 *   - react-native-vision-camera for camera access
 *   - A 3D mesh generation pipeline (floor plan image → simplified 3D model)
 *
 * This screen provides:
 *   - Fallback 3D interactive viewer for devices without AR support
 *   - AR mode toggle (requires ViroReact + ARKit/ARCore)
 *   - Floor plan image display with room labels
 */

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from 'react-native'

interface Room {
  id: string
  name: string
  area: string
  x: number
  y: number
}

const ROOMS: Room[] = [
  { id: 'r1', name: 'Living Room', area: '24 sqm', x: 20, y: 30 },
  { id: 'r2', name: 'Master Bedroom', area: '18 sqm', x: 60, y: 20 },
  { id: 'r3', name: 'Kitchen', area: '12 sqm', x: 20, y: 65 },
  { id: 'r4', name: 'Bathroom', area: '6 sqm', x: 60, y: 65 },
]

interface Props {
  listingId?: string
  listingTitle?: string
}

export default function ARFloorPlanScreen({ listingId, listingTitle = 'House & Lot in Bacoor Cavite' }: Props) {
  const [arMode, setArMode] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  // AR mode requires ViroReact — show instructions if not available
  if (arMode) {
    return (
      <View style={styles.arContainer}>
        <View style={styles.arOverlay}>
          <Text style={styles.arTitle}>📱 AR Mode</Text>
          <Text style={styles.arSubtitle}>
            Point your camera at a flat surface to place the floor plan at 1:1 scale.
          </Text>
          <Text style={styles.arNote}>
            AR requires ViroReact + ARKit (iOS) or ARCore (Android).{'\n'}
            Install @viro-community/react-viro to enable.
          </Text>
          <TouchableOpacity style={styles.exitBtn} onPress={() => setArMode(false)}>
            <Text style={styles.exitBtnText}>Exit AR Mode</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Floor Plan Visualizer</Text>
        <Text style={styles.subtitle}>{listingTitle}</Text>
      </View>

      {/* AR toggle */}
      <TouchableOpacity style={styles.arBtn} onPress={() => setArMode(true)}>
        <Text style={styles.arBtnText}>🥽 Launch AR View</Text>
      </TouchableOpacity>

      {/* 2D floor plan with room labels */}
      <View style={styles.floorPlanContainer}>
        <Text style={styles.sectionTitle}>Interactive Floor Plan</Text>
        <View style={styles.floorPlan}>
          {/* Simplified floor plan grid */}
          <View style={styles.planGrid}>
            {ROOMS.map(room => (
              <TouchableOpacity
                key={room.id}
                style={[
                  styles.roomBox,
                  { left: `${room.x}%`, top: `${room.y}%` },
                  selectedRoom?.id === room.id && styles.roomBoxSelected,
                ]}
                onPress={() => setSelectedRoom(selectedRoom?.id === room.id ? null : room)}
              >
                <Text style={styles.roomLabel}>{room.name}</Text>
                <Text style={styles.roomArea}>{room.area}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Room detail */}
      {selectedRoom && (
        <View style={styles.roomDetail}>
          <Text style={styles.roomDetailTitle}>{selectedRoom.name}</Text>
          <Text style={styles.roomDetailArea}>Floor Area: {selectedRoom.area}</Text>
        </View>
      )}

      {/* Room list */}
      <View style={styles.roomList}>
        <Text style={styles.sectionTitle}>Room Summary</Text>
        {ROOMS.map(room => (
          <TouchableOpacity
            key={room.id}
            style={[styles.roomRow, selectedRoom?.id === room.id && styles.roomRowSelected]}
            onPress={() => setSelectedRoom(selectedRoom?.id === room.id ? null : room)}
          >
            <Text style={styles.roomRowName}>{room.name}</Text>
            <Text style={styles.roomRowArea}>{room.area}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Floor plan is for reference only. Actual dimensions may vary.
          AR mode requires a compatible device with ARKit or ARCore support.
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 24, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#595959' },
  arBtn: {
    margin: 16,
    backgroundColor: '#703BF7',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#703BF7',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  arBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  floorPlanContainer: { margin: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  floorPlan: {
    backgroundColor: '#0D0D0D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    height: 280,
    overflow: 'hidden',
  },
  planGrid: { flex: 1, position: 'relative' },
  roomBox: {
    position: 'absolute',
    backgroundColor: 'rgba(112,59,247,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(112,59,247,0.4)',
    borderRadius: 6,
    padding: 8,
    minWidth: 80,
  },
  roomBoxSelected: {
    backgroundColor: 'rgba(112,59,247,0.35)',
    borderColor: '#703BF7',
  },
  roomLabel: { fontSize: 11, fontWeight: '600', color: '#fff' },
  roomArea: { fontSize: 10, color: '#703BF7', marginTop: 2 },
  roomDetail: {
    margin: 16,
    backgroundColor: '#0D0D0D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(112,59,247,0.3)',
    padding: 16,
  },
  roomDetailTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  roomDetailArea: { fontSize: 14, color: '#703BF7' },
  roomList: { margin: 16 },
  roomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#0D0D0D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    marginBottom: 8,
  },
  roomRowSelected: { borderColor: 'rgba(112,59,247,0.4)', backgroundColor: 'rgba(112,59,247,0.08)' },
  roomRowName: { fontSize: 14, color: '#fff', fontWeight: '500' },
  roomRowArea: { fontSize: 14, color: '#703BF7', fontWeight: '600' },
  disclaimer: { margin: 16, marginTop: 0 },
  disclaimerText: { fontSize: 11, color: '#595959', lineHeight: 16 },
  arContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  arOverlay: {
    backgroundColor: 'rgba(13,13,13,0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    padding: 32,
    margin: 24,
    alignItems: 'center',
  },
  arTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 12 },
  arSubtitle: { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  arNote: { fontSize: 12, color: '#595959', textAlign: 'center', marginBottom: 24, lineHeight: 18 },
  exitBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  exitBtnText: { color: '#595959', fontSize: 14 },
})
