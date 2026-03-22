import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, ZoomIn } from 'lucide-react'
import { useCanvasStore } from '../../stores/canvasStore'
import { useReactFlow } from 'reactflow'
import type { BlockCategory } from '@block-builder/types'
import clsx from 'clsx'

const CATEGORY_COLORS: Record<BlockCategory, string> = {
  api: 'bg-api-50 text-api-800',
  type: 'bg-type-50 text-type-800',
  logic: 'bg-logic-50 text-logic-800',
  ui: 'bg-ui-50 text-ui-800',
  auth: 'bg-purple-50 text-purple-800',
  infra: 'bg-orange-50 text-orange-800',
  layout: 'bg-gray-100 text-gray-700',
}

interface SearchResult {
  nodeId: string
  label: string
  category: BlockCategory
  defId: string
  matchField: string
  matchValue: string
}

function searchNodes(query: string, nodes: any[]): SearchResult[] {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  const results: SearchResult[] = []

  for (const node of nodes) {
    const data = node.data
    const bd = data.blockData as any

    // Search label
    if (data.label?.toLowerCase().includes(q)) {
      results.push({ nodeId: node.id, label: data.label, category: data.category, defId: data.blockDefId, matchField: '名稱', matchValue: data.label })
      continue
    }

    // Search block data fields
    const fields: [string, string][] = []
    if (bd?.name) fields.push(['名稱', bd.name])
    if (bd?.path) fields.push(['路徑', bd.path])
    if (bd?.hookName) fields.push(['Hook', bd.hookName])
    if (bd?.componentName) fields.push(['組件', bd.componentName])
    if (bd?.endpoint) fields.push(['端點', bd.endpoint])
    if (bd?.entity) fields.push(['Entity', bd.entity])
    if (bd?.namespace) fields.push(['Namespace', bd.namespace])
    if (bd?.fields) {
      const fieldNames = bd.fields.map((f: any) => f.name).join(', ')
      fields.push(['欄位', fieldNames])
    }
    if (bd?.methods) {
      const methodNames = bd.methods.map((m: any) => m.name || m).join(', ')
      fields.push(['方法', methodNames])
    }

    for (const [field, value] of fields) {
      if (value?.toLowerCase().includes(q)) {
        results.push({ nodeId: node.id, label: data.label, category: data.category, defId: data.blockDefId, matchField: field, matchValue: value })
        break
      }
    }
  }

  return results.slice(0, 20)
}

interface GlobalSearchProps {
  onClose: () => void
}

export function GlobalSearch({ onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { nodes, selectNode } = useCanvasStore()

  // We can't call useReactFlow here directly because Canvas wraps in its own provider
  // Instead dispatch a custom event that Canvas.tsx listens to
  const focusNode = useCallback((nodeId: string) => {
    selectNode(nodeId)
    window.dispatchEvent(new CustomEvent('bb:focus-node', { detail: { nodeId } }))
    onClose()
  }, [selectNode, onClose])

  const results = searchNodes(query, nodes)

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { setCursor(0) }, [query])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    else if (e.key === 'Enter' && results[cursor]) focusNode(results[cursor].nodeId)
    else if (e.key === 'Escape') onClose()
  }

  function highlight(text: string, q: string) {
    if (!q) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx < 0) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-100 text-yellow-900 rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={onClose}>
      <div
        className="w-[520px] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="搜尋積木名稱、路徑、欄位..."
            className="flex-1 text-sm outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-300 hover:text-gray-500">
              <X size={13} />
            </button>
          )}
          <kbd className="text-xs text-gray-300 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {!query && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300">
              <Search size={24} className="mb-3 opacity-50" />
              <p className="text-sm">輸入關鍵字搜尋畫布上的積木</p>
              <p className="text-xs mt-1 opacity-70">支援名稱、路徑、欄位、Hook 名稱...</p>
            </div>
          )}
          {query && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300">
              <p className="text-sm">找不到「{query}」</p>
            </div>
          )}
          {results.map((r, i) => (
            <button
              key={r.nodeId}
              onClick={() => focusNode(r.nodeId)}
              onMouseEnter={() => setCursor(i)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                i === cursor ? 'bg-blue-50' : 'hover:bg-gray-50'
              )}
            >
              <span className={clsx('text-xs font-bold font-mono px-1.5 py-0.5 rounded flex-shrink-0', CATEGORY_COLORS[r.category])}>
                {r.category.slice(0, 3).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {highlight(r.label, query)}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {r.matchField}: <span className="text-gray-600">{highlight(r.matchValue, query)}</span>
                </p>
              </div>
              {i === cursor && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <ZoomIn size={11} className="text-blue-400" />
                  <kbd className="text-xs text-gray-400 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">↵</kbd>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-400">{results.length} 個結果</span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <kbd className="bg-white border border-gray-200 rounded px-1">↑↓</kbd> 選擇
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <kbd className="bg-white border border-gray-200 rounded px-1">↵</kbd> 跳轉
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
