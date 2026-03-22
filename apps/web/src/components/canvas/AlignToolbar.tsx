import React from 'react'
import {
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  AlignHorizontalSpaceAround, AlignVerticalSpaceAround,
  LayoutGrid,
} from 'lucide-react'
import { useCanvasStore } from '../../stores/canvasStore'
import type { CanvasNode } from '@block-builder/types'

interface AlignToolbarProps {
  selectedIds: string[]
}

export function AlignToolbar({ selectedIds }: AlignToolbarProps) {
  const { nodes, setNodesEdges, edges } = useCanvasStore()

  if (selectedIds.length < 2) return null

  const selected = nodes.filter(n => selectedIds.includes(n.id))

  const update = (updater: (nodes: CanvasNode[]) => CanvasNode[]) => {
    const updated = nodes.map(n => {
      const match = selected.find(s => s.id === n.id)
      if (!match) return n
      const newSelected = updater(selected)
      const newN = newSelected.find(s => s.id === n.id)
      return newN ?? n
    })
    setNodesEdges(updated, edges)
  }

  const alignLeft = () => {
    const minX = Math.min(...selected.map(n => n.position.x))
    update(sel => sel.map(n => ({ ...n, position: { ...n.position, x: minX } })))
  }

  const alignCenterH = () => {
    const centerX = selected.reduce((sum, n) => sum + n.position.x, 0) / selected.length
    update(sel => sel.map(n => ({ ...n, position: { ...n.position, x: centerX } })))
  }

  const alignRight = () => {
    const maxX = Math.max(...selected.map(n => n.position.x))
    update(sel => sel.map(n => ({ ...n, position: { ...n.position, x: maxX } })))
  }

  const alignTop = () => {
    const minY = Math.min(...selected.map(n => n.position.y))
    update(sel => sel.map(n => ({ ...n, position: { ...n.position, y: minY } })))
  }

  const alignCenterV = () => {
    const centerY = selected.reduce((sum, n) => sum + n.position.y, 0) / selected.length
    update(sel => sel.map(n => ({ ...n, position: { ...n.position, y: centerY } })))
  }

  const alignBottom = () => {
    const maxY = Math.max(...selected.map(n => n.position.y))
    update(sel => sel.map(n => ({ ...n, position: { ...n.position, y: maxY } })))
  }

  const distributeH = () => {
    const sorted = [...selected].sort((a, b) => a.position.x - b.position.x)
    const minX = sorted[0].position.x
    const maxX = sorted[sorted.length - 1].position.x
    const step = (maxX - minX) / (sorted.length - 1)
    update(_ => sorted.map((n, i) => ({ ...n, position: { ...n.position, x: minX + i * step } })))
  }

  const distributeV = () => {
    const sorted = [...selected].sort((a, b) => a.position.y - b.position.y)
    const minY = sorted[0].position.y
    const maxY = sorted[sorted.length - 1].position.y
    const step = (maxY - minY) / (sorted.length - 1)
    update(_ => sorted.map((n, i) => ({ ...n, position: { ...n.position, y: minY + i * step } })))
  }

  const autoLayout = () => {
    // Grid layout: 4 per row, 220px wide, 160px tall
    const sorted = [...selected].sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y)
    const cols = Math.min(4, sorted.length)
    update(_ => sorted.map((n, i) => ({
      ...n,
      position: {
        x: 60 + (i % cols) * 240,
        y: 60 + Math.floor(i / cols) * 180,
      },
    })))
  }

  const buttons = [
    { icon: <AlignStartVertical size={13} />, label: '左對齊', fn: alignLeft },
    { icon: <AlignCenterVertical size={13} />, label: '水平置中', fn: alignCenterH },
    { icon: <AlignEndVertical size={13} />, label: '右對齊', fn: alignRight },
    { icon: null, label: '', fn: () => {} }, // divider
    { icon: <AlignStartHorizontal size={13} />, label: '上對齊', fn: alignTop },
    { icon: <AlignCenterHorizontal size={13} />, label: '垂直置中', fn: alignCenterV },
    { icon: <AlignEndHorizontal size={13} />, label: '下對齊', fn: alignBottom },
    { icon: null, label: '', fn: () => {} }, // divider
    { icon: <AlignHorizontalSpaceAround size={13} />, label: '水平均等', fn: distributeH },
    { icon: <AlignVerticalSpaceAround size={13} />, label: '垂直均等', fn: distributeV },
    { icon: null, label: '', fn: () => {} }, // divider
    { icon: <LayoutGrid size={13} />, label: '自動網格排列', fn: autoLayout },
  ]

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-1.5 shadow-lg">
      <span className="text-xs text-gray-400 mr-1 font-medium">{selectedIds.length} 個</span>
      {buttons.map((btn, i) =>
        btn.icon === null ? (
          <div key={i} className="w-px h-4 bg-gray-200 mx-0.5" />
        ) : (
          <button
            key={i}
            onClick={btn.fn}
            title={btn.label}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
          >
            {btn.icon}
          </button>
        )
      )}
    </div>
  )
}
