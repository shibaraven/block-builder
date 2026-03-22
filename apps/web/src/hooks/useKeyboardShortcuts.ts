import { useEffect, useCallback } from 'react'
import { useCanvasStore } from '../stores/canvasStore'
import { useHistoryStore } from '../stores/historyStore'
import type { CanvasNode, CanvasEdge } from '@block-builder/types'

export function useKeyboardShortcuts() {
  const store = useCanvasStore()
  const history = useHistoryStore()

  const handleUndo = useCallback(() => {
    const entry = history.undo({ nodes: store.nodes, edges: store.edges })
    if (entry) {
      store.setNodesEdges(entry.nodes, entry.edges)
    }
  }, [store, history])

  const handleRedo = useCallback(() => {
    const entry = history.redo({ nodes: store.nodes, edges: store.edges })
    if (entry) {
      store.setNodesEdges(entry.nodes, entry.edges)
    }
  }, [store, history])

  const handleCopy = useCallback(() => {
    if (!store.selectedNodeId) return
    const node = store.nodes.find((n) => n.id === store.selectedNodeId)
    if (node) store.setClipboard(node)
  }, [store])

  const handlePaste = useCallback(() => {
    if (!store.clipboard) return
    store.pasteClipboard()
  }, [store])

  const handleDuplicate = useCallback(() => {
    if (!store.selectedNodeId) return
    const node = store.nodes.find((n) => n.id === store.selectedNodeId)
    if (node) {
      store.setClipboard(node)
      store.pasteClipboard(20, 20)
    }
  }, [store])

  const handleDelete = useCallback(() => {
    if (!store.selectedNodeId) return
    store.removeNode(store.selectedNodeId)
  }, [store])

  const handleSelectAll = useCallback(() => {
    // Future: select all nodes
  }, [])

  const handleSave = useCallback(() => {
    store.triggerSave()
  }, [store])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      // Don't fire shortcuts when typing in inputs
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) return

      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo() }
      else if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo() }
      else if (ctrl && e.key === 'c') { e.preventDefault(); handleCopy() }
      else if (ctrl && e.key === 'v') { e.preventDefault(); handlePaste() }
      else if (ctrl && e.key === 'd') { e.preventDefault(); handleDuplicate() }
      else if (ctrl && e.key === 's') { e.preventDefault(); handleSave() }
      else if (ctrl && e.key === 'a') { e.preventDefault(); handleSelectAll() }
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (store.selectedNodeId) { e.preventDefault(); handleDelete() }
      }

      // ── Tab: cycle through nodes ──────────────────────────────────
      else if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        const s = useCanvasStore.getState()
        if (s.nodes.length === 0) return
        const idx = s.nodes.findIndex(n => n.id === s.selectedNodeId)
        const next = s.nodes[(idx + 1) % s.nodes.length]
        s.selectNode(next.id)
        window.dispatchEvent(new CustomEvent('bb:focus-node', { detail: { nodeId: next.id } }))
      }
      else if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault()
        const s = useCanvasStore.getState()
        if (s.nodes.length === 0) return
        const idx = s.nodes.findIndex(n => n.id === s.selectedNodeId)
        const prev = s.nodes[(idx - 1 + s.nodes.length) % s.nodes.length]
        s.selectNode(prev.id)
        window.dispatchEvent(new CustomEvent('bb:focus-node', { detail: { nodeId: prev.id } }))
      }
      else if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        const s = useCanvasStore.getState()
        const node = s.nodes.find(n => n.id === s.selectedNodeId)
        if (!node) return
        e.preventDefault()
        const step = e.shiftKey ? 20 : 5
        const deltas: Record<string, {x:number;y:number}> = {
          ArrowUp:    { x: 0,     y: -step },
          ArrowDown:  { x: 0,     y:  step },
          ArrowLeft:  { x: -step, y:  0    },
          ArrowRight: { x:  step, y:  0    },
        }
        const d = deltas[e.key]
        if (!d) return
        const updated = s.nodes.map(n =>
          n.id === s.selectedNodeId
            ? { ...n, position: { x: n.position.x + d.x, y: n.position.y + d.y } }
            : n
        )
        s.setNodesEdges(updated, s.edges)
      }
      else if (e.key === 'Escape') { store.selectNode(null) }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleUndo, handleRedo, handleCopy, handlePaste, handleDuplicate, handleDelete, handleSave, store])
}