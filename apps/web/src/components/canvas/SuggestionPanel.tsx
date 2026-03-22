import React, { useEffect, useState } from 'react'
import { Sparkles, Plus, X, ChevronRight } from 'lucide-react'
import { getSuggestions, getNextBlockSuggestions } from '../../lib/snapAndSuggest'
import { BLOCK_DEF_MAP } from '../../lib/blockDefinitions'
import { useCanvasStore } from '../../stores/canvasStore'
import type { CanvasNode, BlockCategory } from '@block-builder/types'
import clsx from 'clsx'

const CATEGORY_COLORS: Record<BlockCategory, { bg: string; text: string; badge: string }> = {
  api:    { bg: 'bg-api-50',    text: 'text-api-800',    badge: 'bg-api-100 text-api-800' },
  type:   { bg: 'bg-type-50',   text: 'text-type-800',   badge: 'bg-type-100 text-type-800' },
  logic:  { bg: 'bg-logic-50',  text: 'text-logic-800',  badge: 'bg-logic-100 text-logic-800' },
  ui:     { bg: 'bg-ui-50',     text: 'text-ui-800',     badge: 'bg-ui-100 text-ui-800' },
  auth:   { bg: 'bg-purple-50', text: 'text-purple-800', badge: 'bg-purple-100 text-purple-800' },
  infra:  { bg: 'bg-orange-50', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-800' },
  layout: { bg: 'bg-gray-100',  text: 'text-gray-700',   badge: 'bg-gray-200 text-gray-700' },
}

interface SuggestionPanelProps {
  node: CanvasNode
  onClose: () => void
}

export function SuggestionPanel({ node, onClose }: SuggestionPanelProps) {
  const { addNode, onConnect, nodes } = useCanvasStore()
  const [added, setAdded] = useState<Set<string>>(new Set())

  const defId = node.data.blockDefId
  const suggestions = getSuggestions(defId)
  const nextIds = getNextBlockSuggestions(defId)
  const nextBlocks = nextIds
    .map(id => BLOCK_DEF_MAP[id])
    .filter(Boolean)
    .filter(b => !suggestions.find(s => s.blockDefId === b.id))
    .slice(0, 3)

  const addSuggested = (blockDefId: string, autoConnect = true) => {
    const def = BLOCK_DEF_MAP[blockDefId]
    if (!def) return

    const newNode: CanvasNode = {
      id: `sug-${Date.now()}`,
      type: 'blockNode',
      position: {
        x: node.position.x + 280,
        y: node.position.y + added.size * 170,
      },
      data: {
        blockDefId: def.id,
        category: def.category,
        label: def.label,
        blockData: structuredClone(def.defaultData) as any,
      },
    }
    addNode(newNode)

    if (autoConnect) {
      setTimeout(() => {
        onConnect({
          source: node.id,
          sourceHandle: 'output',
          target: newNode.id,
          targetHandle: 'input',
        } as any)
      }, 50)
    }

    setAdded(prev => new Set([...prev, blockDefId]))
  }

  if (suggestions.length === 0 && nextBlocks.length === 0) return null

  return (
    <div
      className="absolute z-30 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden animate-fade-in"
      style={{
        left: node.position.x + 250,
        top: node.position.y - 10,
        width: 260,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-blue-500" />
          <span className="text-xs font-semibold text-blue-800">建議搭配</span>
        </div>
        <button onClick={onClose} className="p-0.5 text-gray-400 hover:text-gray-600 rounded transition-colors">
          <X size={12} />
        </button>
      </div>

      {/* Suggestions with reasons */}
      {suggestions.length > 0 && (
        <div className="p-2">
          <p className="text-xs text-gray-400 px-1 mb-1.5">常見配對</p>
          {suggestions.map((s, i) => {
            const def = BLOCK_DEF_MAP[s.blockDefId]
            if (!def) return null
            const c = CATEGORY_COLORS[def.category]
            const isAdded = added.has(s.blockDefId)
            return (
              <div
                key={i}
                className={clsx(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-xl mb-1 transition-all',
                  isAdded ? 'bg-green-50 border border-green-200' : 'hover:bg-gray-50 border border-transparent'
                )}
              >
                <div className={clsx('flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0', c.bg)}>
                  <span className={clsx('text-xs font-bold font-mono', c.text)}>{def.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{def.label}</p>
                  <p className="text-xs text-gray-400 truncate">{s.reason}</p>
                </div>
                <button
                  onClick={() => !isAdded && addSuggested(s.blockDefId, true)}
                  className={clsx(
                    'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all flex-shrink-0',
                    isAdded
                      ? 'text-green-600 bg-green-100'
                      : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                  )}
                >
                  {isAdded ? '✓ 已加' : <><Plus size={10} />加入</>}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Quick add - no auto connect */}
      {nextBlocks.length > 0 && (
        <>
          <div className="h-px bg-gray-100 mx-3" />
          <div className="p-2">
            <p className="text-xs text-gray-400 px-1 mb-1.5">也可以搭配</p>
            {nextBlocks.map((def, i) => {
              const c = CATEGORY_COLORS[def.category]
              const isAdded = added.has(def.id)
              return (
                <button
                  key={i}
                  onClick={() => !isAdded && addSuggested(def.id, false)}
                  className={clsx(
                    'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors mb-0.5',
                    isAdded ? 'text-green-600 bg-green-50' : 'hover:bg-gray-50'
                  )}
                >
                  <span className={clsx('text-xs font-bold font-mono px-1.5 py-0.5 rounded', c.badge)}>
                    {def.icon}
                  </span>
                  <span className="text-xs text-gray-700 flex-1 truncate">{def.label}</span>
                  {isAdded
                    ? <span className="text-xs text-green-500">✓</span>
                    : <ChevronRight size={10} className="text-gray-300" />
                  }
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-400">點「加入」自動建立積木和連線</p>
      </div>
    </div>
  )
}
