import React, { useState } from 'react'
import { Search } from 'lucide-react'
import { BLOCK_DEFINITIONS, CATEGORIES } from '../../lib/blockDefinitions'
import { useFavouritesStore } from '../../stores/favouritesStore'
import type { BlockCategory, BlockDefinition } from '@block-builder/types'
import { Star } from 'lucide-react'
import clsx from 'clsx'

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  api:    { bg: 'bg-api-50',   text: 'text-api-800',   dot: 'bg-api-400',   border: 'border-api-600' },
  type:   { bg: 'bg-type-50',  text: 'text-type-800',  dot: 'bg-type-400',  border: 'border-type-600' },
  logic:  { bg: 'bg-logic-50', text: 'text-logic-800', dot: 'bg-logic-400', border: 'border-logic-600' },
  auth:   { bg: 'bg-purple-50',text: 'text-purple-800', dot: 'bg-purple-400', border: 'border-purple-400' },
  infra:  { bg: 'bg-orange-50',text: 'text-orange-800', dot: 'bg-orange-400', border: 'border-orange-400' },
  ui:     { bg: 'bg-ui-50',   text: 'text-ui-800',   dot: 'bg-ui-400',   border: 'border-ui-600' },
  layout: { bg: 'bg-gray-100', text: 'text-gray-700',  dot: 'bg-gray-400',  border: 'border-gray-400' },
}

export function BlockSidebar({ highlightedBlocks = new Set<string>(), compact = false }: { highlightedBlocks?: Set<string>; compact?: boolean }) {
  const [search, setSearch] = useState('')
  const { favourites, toggle: toggleFav, isFavourite } = useFavouritesStore()
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(CATEGORIES.map(c => c.id)))

  const filtered = BLOCK_DEFINITIONS.filter(b =>
    !search ||
    b.label.toLowerCase().includes(search.toLowerCase()) ||
    b.description.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  )

  const toggleCat = (id: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleDragStart = (e: React.DragEvent, block: BlockDefinition) => {
    e.dataTransfer.setData('application/block-builder', JSON.stringify(block))
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <aside style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }} className="bg-white dark:bg-gray-900">
      <div className="px-3 pt-3 pb-2 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">積木庫</p>
          <span className="text-xs text-gray-300">{BLOCK_DEFINITIONS.length} 個</span>
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜尋積木..."
            className="w-full pl-7 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md outline-none focus:border-blue-400 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {/* Favourites section */}
        {favourites.length > 0 && !search && (
          <div className="mb-1">
            <div className="flex items-center gap-1.5 px-3 py-1.5">
              <Star size={10} className="text-amber-400 fill-amber-400" />
              <span className="text-xs font-medium text-gray-500 flex-1">收藏</span>
              <span className="text-xs text-gray-300">{favourites.length}</span>
            </div>
            {BLOCK_DEFINITIONS.filter(b => favourites.includes(b.id)).map(block => {
              const c = CATEGORY_COLORS[block.category as BlockCategory] ?? CATEGORY_COLORS.layout
              return (
                <div
                  key={block.id}
                  draggable
                  onDragStart={e => handleDragStart(e, block)}
                  className={clsx('mx-2 mb-1 px-2.5 py-2 rounded-lg border cursor-grab active:cursor-grabbing hover:shadow-sm transition-all select-none', c.bg, c.border, 'border-opacity-30 hover:border-opacity-60')}
                >
                  <div className="flex items-center gap-2">
                    <span className={clsx('text-xs font-bold font-mono px-1.5 py-0.5 rounded flex-shrink-0', c.bg, c.text)}>{block.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className={clsx('text-xs font-semibold truncate', c.text)}>{block.label}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); toggleFav(block.id) }} className="opacity-60 hover:opacity-100">
                      <Star size={10} className="text-amber-400 fill-amber-400" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {CATEGORIES.map(cat => {
          const blocks = filtered.filter(b => b.category === cat.id)
          if (blocks.length === 0) return null
          const c = CATEGORY_COLORS[cat.id] ?? CATEGORY_COLORS.layout
          const isExpanded = expandedCats.has(cat.id)

          return (
            <div key={cat.id} className="mb-1">
              <button
                onClick={() => toggleCat(cat.id)}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 text-left hover:bg-gray-50 transition-colors"
              >
                <div className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', c.dot)} />
                <span className="text-xs font-medium text-gray-500 flex-1">{cat.label}</span>
                <span className="text-gray-300 text-xs">{blocks.length}</span>
                <span className={clsx('text-gray-300 text-xs transition-transform ml-1', isExpanded ? 'rotate-180' : '')}>▾</span>
              </button>

              {isExpanded && (
                <div className="pb-1">
                  {blocks.map(block => (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={e => handleDragStart(e, block)}
                      className={clsx(
                        'mx-2 mb-1 px-2.5 py-2 rounded-lg border cursor-grab active:cursor-grabbing',
                        'hover:shadow-sm transition-all select-none',
                        c.bg, c.border, 'border-opacity-30 hover:border-opacity-60'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={clsx('text-xs font-bold font-mono px-1.5 py-0.5 rounded flex-shrink-0', c.bg, c.text)}>
                          {block.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={clsx('text-xs font-semibold truncate', c.text)}>{block.label}</p>
                          {!compact && <p className="text-xs text-gray-400 truncate">{block.description}</p>}
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); e.preventDefault(); toggleFav(block.id) }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-0.5"
                        >
                          <Star size={10} className={isFavourite(block.id) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="px-3 py-2 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">拖曳 或 按 Space 搜尋</p>
      </div>
    </aside>
  )
}
