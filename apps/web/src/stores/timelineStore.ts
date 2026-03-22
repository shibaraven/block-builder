import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CanvasNode, CanvasEdge } from '@block-builder/types'

export type TimelineAction =
  | 'node:add' | 'node:remove' | 'node:update' | 'node:move'
  | 'edge:add' | 'edge:remove'
  | 'canvas:clear' | 'canvas:load'
  | 'generate'

export interface TimelineEntry {
  id: string
  timestamp: number
  action: TimelineAction
  label: string
  nodeCount: number
  edgeCount: number
  snapshot: { nodes: CanvasNode[]; edges: CanvasEdge[] }
}

interface TimelineStore {
  entries: TimelineEntry[]
  isOpen: boolean
  record: (action: TimelineAction, label: string, nodes: CanvasNode[], edges: CanvasEdge[]) => void
  restoreTo: (id: string, setNodesEdges: (n: CanvasNode[], e: CanvasEdge[]) => void) => void
  clear: () => void
  setOpen: (v: boolean) => void
}

const MAX_ENTRIES = 50

export const useTimelineStore = create<TimelineStore>()(
  persist(
    (set, get) => ({
      entries: [],
      isOpen: false,
      record: (action, label, nodes, edges) => {
        const entry: TimelineEntry = {
          id: `tl-${Date.now()}`,
          timestamp: Date.now(),
          action,
          label,
          nodeCount: nodes.length,
          edgeCount: edges.length,
          snapshot: { nodes: structuredClone(nodes), edges: structuredClone(edges) },
        }
        set(s => ({ entries: [entry, ...s.entries].slice(0, MAX_ENTRIES) }))
      },
      restoreTo: (id, setNodesEdges) => {
        const entry = get().entries.find(e => e.id === id)
        if (entry) setNodesEdges(entry.snapshot.nodes, entry.snapshot.edges)
      },
      clear: () => set({ entries: [] }),
      setOpen: (v) => set({ isOpen: v }),
    }),
    {
      name: 'bb-timeline',
      partialize: (s) => ({ entries: s.entries.slice(0, 20) }), // only persist recent 20
    }
  )
)

// ─── Action labels ────────────────────────────────────────────────────
export function getActionIcon(action: TimelineAction): string {
  const map: Record<TimelineAction, string> = {
    'node:add':     '➕',
    'node:remove':  '🗑',
    'node:update':  '✏️',
    'node:move':    '↔️',
    'edge:add':     '🔗',
    'edge:remove':  '✂️',
    'canvas:clear': '🧹',
    'canvas:load':  '📂',
    'generate':     '⚡',
  }
  return map[action] ?? '•'
}

export function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diff = (now.getTime() - ts) / 1000

  if (diff < 60) return `${Math.round(diff)}s 前`
  if (diff < 3600) return `${Math.round(diff / 60)}m 前`
  if (diff < 86400) return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
