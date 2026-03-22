import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UsageStore {
  counts: Record<string, number>   // blockDefId → count
  pairCounts: Record<string, number> // "defA:defB" → count
  track: (blockDefId: string) => void
  trackPair: (defA: string, defB: string) => void
  getTopBlocks: (n?: number) => { defId: string; count: number }[]
  getTopPairs: (n?: number) => { pair: string; count: number }[]
  reset: () => void
}

export const useUsageStore = create<UsageStore>()(
  persist(
    (set, get) => ({
      counts: {},
      pairCounts: {},
      track: (defId) => set(s => ({
        counts: { ...s.counts, [defId]: (s.counts[defId] ?? 0) + 1 }
      })),
      trackPair: (defA, defB) => {
        const key = [defA, defB].sort().join(':')
        set(s => ({ pairCounts: { ...s.pairCounts, [key]: (s.pairCounts[key] ?? 0) + 1 } }))
      },
      getTopBlocks: (n = 10) =>
        Object.entries(get().counts)
          .map(([defId, count]) => ({ defId, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, n),
      getTopPairs: (n = 5) =>
        Object.entries(get().pairCounts)
          .map(([pair, count]) => ({ pair, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, n),
      reset: () => set({ counts: {}, pairCounts: {} }),
    }),
    { name: 'bb-usage-stats' }
  )
)

// ─── Heat level ───────────────────────────────────────────────────────
export function getHeatLevel(count: number, max: number): 'cold' | 'warm' | 'hot' | 'fire' {
  if (max === 0) return 'cold'
  const ratio = count / max
  if (ratio >= 0.75) return 'fire'
  if (ratio >= 0.5)  return 'hot'
  if (ratio >= 0.25) return 'warm'
  return 'cold'
}

export const HEAT_COLORS = {
  cold: 'opacity-100',
  warm: 'ring-1 ring-amber-200',
  hot:  'ring-2 ring-amber-400',
  fire: 'ring-2 ring-red-400 ring-offset-1',
}
