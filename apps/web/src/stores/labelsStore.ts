import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type LabelColor = 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'gray'

export interface BlockLabel {
  nodeId: string
  color: LabelColor
  note: string
}

interface LabelsStore {
  labels: Record<string, BlockLabel>
  setLabel: (nodeId: string, color: LabelColor, note: string) => void
  removeLabel: (nodeId: string) => void
  getLabel: (nodeId: string) => BlockLabel | null
}

export const useLabelsStore = create<LabelsStore>()(
  persist(
    (set, get) => ({
      labels: {},
      setLabel: (nodeId, color, note) =>
        set(s => ({ labels: { ...s.labels, [nodeId]: { nodeId, color, note } } })),
      removeLabel: (nodeId) =>
        set(s => {
          const next = { ...s.labels }
          delete next[nodeId]
          return { labels: next }
        }),
      getLabel: (nodeId) => get().labels[nodeId] ?? null,
    }),
    { name: 'bb-labels' }
  )
)

export const LABEL_COLORS: Record<LabelColor, { bg: string; text: string; dot: string }> = {
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-400' },
  green:  { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-400' },
  amber:  { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  red:    { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-400' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-400' },
  gray:   { bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400' },
}
