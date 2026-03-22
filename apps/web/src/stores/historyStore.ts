import { create } from 'zustand'
import type { CanvasNode, CanvasEdge } from '@block-builder/types'

interface HistoryEntry {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  timestamp: number
}

interface HistoryStore {
  past: HistoryEntry[]
  future: HistoryEntry[]
  canUndo: boolean
  canRedo: boolean
  push: (nodes: CanvasNode[], edges: CanvasEdge[]) => void
  undo: (current: { nodes: CanvasNode[]; edges: CanvasEdge[] }) => HistoryEntry | null
  redo: (current: { nodes: CanvasNode[]; edges: CanvasEdge[] }) => HistoryEntry | null
  clear: () => void
}

const MAX_HISTORY = 50

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  push: (nodes, edges) => {
    set((s) => {
      const past = [
        ...s.past.slice(-MAX_HISTORY + 1),
        { nodes: structuredClone(nodes), edges: structuredClone(edges), timestamp: Date.now() },
      ]
      return { past, future: [], canUndo: past.length > 1, canRedo: false }
    })
  },

  undo: (current) => {
    const { past } = get()
    if (past.length <= 1) return null
    const prev = past[past.length - 2]
    const currentEntry: HistoryEntry = {
      nodes: structuredClone(current.nodes),
      edges: structuredClone(current.edges),
      timestamp: Date.now(),
    }
    set((s) => {
      const newPast = s.past.slice(0, -1)
      const future = [currentEntry, ...s.future]
      return { past: newPast, future, canUndo: newPast.length > 1, canRedo: true }
    })
    return prev
  },

  redo: (current) => {
    const { future } = get()
    if (future.length === 0) return null
    const next = future[0]
    const currentEntry: HistoryEntry = {
      nodes: structuredClone(current.nodes),
      edges: structuredClone(current.edges),
      timestamp: Date.now(),
    }
    set((s) => {
      const newFuture = s.future.slice(1)
      const past = [...s.past, currentEntry]
      return { past, future: newFuture, canUndo: true, canRedo: newFuture.length > 0 }
    })
    return next
  },

  clear: () => set({ past: [], future: [], canUndo: false, canRedo: false }),
}))
