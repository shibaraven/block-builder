import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search } from 'lucide-react'
import { BLOCK_DEFINITIONS, CATEGORIES } from '../../lib/blockDefinitions'
import { useCanvasStore } from '../../stores/canvasStore'
import type { BlockDefinition, BlockCategory, CanvasNode } from '@block-builder/types'
import clsx from 'clsx'

const CATEGORY_COLORS: Record<BlockCategory, string> = {
  api:    'bg-blue-50 text-blue-700',
  type:   'bg-green-50 text-green-700',
  logic:  'bg-amber-50 text-amber-700',
  ui:     'bg-pink-50 text-pink-700',
  auth:   'bg-purple-50 text-purple-700',
  infra:  'bg-orange-50 text-orange-700',
  layout: 'bg-gray-50 text-gray-700',
}

interface SpotlightProps {
  onClose: () => void
}

export function Spotlight({ onClose }: SpotlightProps) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { addNode } = useCanvasStore()

  const filtered = BLOCK_DEFINITIONS.filter(
    (b) =>
      !query ||
      b.label.toLowerCase().includes(query.toLowerCase()) ||
      b.description.toLowerCase().includes(query.toLowerCase()) ||
      b.category.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    inputRef.current?.focus()
    setCursor(0)
  }, [])

  useEffect(() => { setCursor(0) }, [query])

  const select = useCallback(
    (block: BlockDefinition) => {
      const node: CanvasNode = {
        id: `n-${Date.now()}`,
        type: 'blockNode',
        position: { x: 200 + Math.random() * 300, y: 100 + Math.random() * 200 },
        data: {
          blockDefId: block.id,
          category: block.category,
          label: block.label,
          blockData: structuredClone(block.defaultData) as any,
        },
      }
      addNode(node)
      onClose()
    },
    [addNode, onClose]
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
    else if (e.key === 'Enter' && filtered[cursor]) { select(filtered[cursor]) }
    else if (e.key === 'Escape') { onClose() }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24"
      onClick={onClose}
    >
      <div
        className="w-[520px] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="搜尋積木... (API、Interface、Form...)"
            className="flex-1 text-sm outline-none bg-transparent placeholder-gray-300"
          />
          <kbd className="text-xs text-gray-300 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {CATEGORIES.map((cat) => {
            const items = filtered.filter((b) => b.category === cat.id)
            if (!items.length) return null
            return (
              <div key={cat.id}>
                <div className="px-4 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {cat.label}
                </div>
                {items.map((block, i) => {
                  const globalIdx = filtered.indexOf(block)
                  return (
                    <button
                      key={block.id}
                      onClick={() => select(block)}
                      onMouseEnter={() => setCursor(globalIdx)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        globalIdx === cursor ? 'bg-blue-50' : 'hover:bg-gray-50'
                      )}
                    >
                      <span className={clsx('text-xs font-bold font-mono px-1.5 py-0.5 rounded', CATEGORY_COLORS[block.category as BlockCategory])}>
                        {block.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{block.label}</p>
                        <p className="text-xs text-gray-400 truncate">{block.description}</p>
                      </div>
                      {globalIdx === cursor && (
                        <kbd className="text-xs text-gray-400 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">
                          ↵
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              找不到「{query}」的積木
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100 bg-gray-50">
          <span className="text-xs text-gray-400 flex items-center gap-1"><kbd className="bg-white border border-gray-200 rounded px-1">↑↓</kbd> 選擇</span>
          <span className="text-xs text-gray-400 flex items-center gap-1"><kbd className="bg-white border border-gray-200 rounded px-1">↵</kbd> 新增</span>
          <span className="text-xs text-gray-400 flex items-center gap-1"><kbd className="bg-white border border-gray-200 rounded px-1">Space</kbd> 開啟</span>
        </div>
      </div>
    </div>
  )
}
