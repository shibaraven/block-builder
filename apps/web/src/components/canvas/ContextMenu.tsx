import React, { useEffect, useRef } from 'react'
import {
  Copy, Trash2, Eye, Clipboard, AlignLeft,
  Plus, RotateCcw, ZoomIn, Layers, StickyNote,
} from 'lucide-react'
import { useCanvasStore } from '../../stores/canvasStore'
import clsx from 'clsx'

export interface ContextMenuState {
  x: number
  y: number
  type: 'canvas' | 'node'
  nodeId?: string
}

interface ContextMenuProps {
  menu: ContextMenuState
  onClose: () => void
  onOpenSpotlight: () => void
}

export function ContextMenu({ menu, onClose, onOpenSpotlight }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { nodes, removeNode, selectNode, setClipboard, pasteClipboard, clipboard, clearCanvas } = useCanvasStore()
  const node = menu.nodeId ? nodes.find(n => n.id === menu.nodeId) : null

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    setTimeout(() => {
      document.addEventListener('mousedown', handler)
      document.addEventListener('keydown', esc)
    }, 10)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', esc)
    }
  }, [onClose])

  const Item = ({ icon, label, onClick, danger, disabled, shortcut }: {
    icon: React.ReactNode
    label: string
    onClick: () => void
    danger?: boolean
    disabled?: boolean
    shortcut?: string
  }) => (
    <button
      onClick={() => { if (!disabled) { onClick(); onClose() } }}
      className={clsx(
        'w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-xs transition-colors rounded-md',
        disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer',
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
      )}
    >
      <span className="flex-shrink-0 w-3.5">{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut && <kbd className="text-gray-300 text-xs font-mono">{shortcut}</kbd>}
    </button>
  )

  const Sep = () => <div className="h-px bg-gray-100 my-1 mx-2" />

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 w-52"
      style={{ left: menu.x, top: menu.y }}
    >
      {menu.type === 'node' && node ? (
        <>
          <div className="px-3 py-1 mb-1">
            <p className="text-xs font-semibold text-gray-500 truncate">{node.data.label}</p>
            <p className="text-xs text-gray-400 font-mono">{node.data.blockData.kind}</p>
          </div>
          <Sep />
          <Item icon={<Copy size={12} />} label="複製積木" shortcut="Ctrl+C"
            onClick={() => { setClipboard(node); selectNode(node.id) }} />
          <Item icon={<Clipboard size={12} />} label="複製並貼上" shortcut="Ctrl+D"
            onClick={() => { setClipboard(node); pasteClipboard(30, 30) }} />
          <Sep />
          <Item icon={<AlignLeft size={12} />} label="編輯屬性"
            onClick={() => selectNode(node.id)} />
          <Item icon={<Eye size={12} />} label="Live Preview"
            onClick={() => selectNode(node.id)}
            disabled={!['data-table','form','card','chart','navigation','search-bar','notification'].includes(node.data.blockData.kind)} />
          <Sep />
          <Item icon={<Trash2 size={12} />} label="刪除積木" shortcut="Del"
            danger onClick={() => removeNode(node.id)} />
        </>
      ) : (
        <>
          <Item icon={<Plus size={12} />} label="新增積木" shortcut="Space"
            onClick={onOpenSpotlight} />
          <Item icon={<Clipboard size={12} />} label="貼上" shortcut="Ctrl+V"
            disabled={!clipboard} onClick={() => pasteClipboard()} />
          <Sep />
          <Item icon={<ZoomIn size={12} />} label="縮放到全部積木"
            onClick={() => {
              const event = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true })
              // Trigger fit view via doubleclick simulation
              document.querySelector('.react-flow__pane')?.dispatchEvent(new MouseEvent('dblclick'))
            }} />
          <Item icon={<RotateCcw size={12} />} label="重置縮放"
            onClick={() => {}} />
          <Sep />
          <Item icon={<Layers size={12} />} label="全選積木" shortcut="Ctrl+A"
            onClick={() => {}} />
          <Item icon={<Trash2 size={12} />} label="清除畫布"
            danger onClick={clearCanvas} />
        </>
      )}
    </div>
  )
}
