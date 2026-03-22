import React, { useState } from 'react'
import { LayoutTemplate, ChevronRight } from 'lucide-react'
import { DraggableModal } from './DraggableModal'
import { TEMPLATES } from '../../lib/templates'
import { useCanvasStore } from '../../stores/canvasStore'
import clsx from 'clsx'

interface TemplatesModalProps { onClose: () => void }

const TAG_COLORS: Record<string, string> = {
  'NestJS': 'bg-blue-50 text-blue-700',
  'JWT': 'bg-purple-50 text-purple-700',
  'CRUD': 'bg-green-50 text-green-700',
  '入門': 'bg-gray-100 text-gray-600',
  'Blog': 'bg-amber-50 text-amber-700',
  '電商': 'bg-orange-50 text-orange-700',
  'WebSocket': 'bg-indigo-50 text-indigo-700',
  'Prisma': 'bg-teal-50 text-teal-700',
  'Dashboard': 'bg-pink-50 text-pink-700',
  'Charts': 'bg-rose-50 text-rose-700',
  'Cache': 'bg-cyan-50 text-cyan-700',
  'Email': 'bg-violet-50 text-violet-700',
  '四層架構': 'bg-blue-50 text-blue-700',
  '即時': 'bg-red-50 text-red-700',
  'Navigation': 'bg-slate-50 text-slate-700',
  'BullMQ': 'bg-amber-50 text-amber-700',
  '搜尋': 'bg-sky-50 text-sky-700',
  '訂單': 'bg-orange-50 text-orange-700',
}

const CAT_COLOR: Record<string, string> = {
  api: 'bg-blue-400', type: 'bg-green-400', logic: 'bg-amber-400',
  auth: 'bg-purple-400', infra: 'bg-orange-400', ui: 'bg-pink-400', layout: 'bg-gray-400',
}

export function TemplatesModal({ onClose }: TemplatesModalProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const { loadTemplateData } = useCanvasStore()

  const handleLoad = (id: string) => {
    loadTemplateData(id)
    onClose()
  }

  return (
    <DraggableModal
      title="積木模板市集"
      subtitle={`${TEMPLATES.length} 個內建模板，一鍵套用完整配置`}
      icon={<LayoutTemplate size={14} />}
      onClose={onClose}
      width={680}
      maxHeight="80vh"
    >
      <div className="p-4 grid grid-cols-2 gap-3">
        {TEMPLATES.map(t => (
          <div
            key={t.id}
            className={clsx(
              'border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md group',
              preview === t.id
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
            onClick={() => setPreview(preview === t.id ? null : t.id)}
          >
            {/* Card header */}
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-800">{t.name}</h3>
              <span className="text-xs text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 flex-shrink-0 ml-2">
                {t.nodeCount} 積木
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">{t.description}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {t.tags.map(tag => (
                <span
                  key={tag}
                  className={clsx(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600'
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Preview: node list */}
            {preview === t.id && (
              <div className="border-t border-blue-200 pt-3 mt-1 space-y-1">
                {t.nodes.slice(0, 6).map(n => (
                  <div key={n.id} className="flex items-center gap-2 text-xs text-gray-600">
                    <div className={clsx(
                      'w-1.5 h-1.5 rounded-full flex-shrink-0',
                      CAT_COLOR[n.data.category] ?? 'bg-gray-400'
                    )} />
                    <span className="font-mono text-xs truncate">{n.data.label}</span>
                  </div>
                ))}
                {t.nodes.length > 6 && (
                  <div className="text-xs text-gray-400 pl-3.5">
                    ...還有 {t.nodes.length - 6} 個積木
                  </div>
                )}
              </div>
            )}

            {/* Apply button */}
            <button
              onClick={e => { e.stopPropagation(); handleLoad(t.id) }}
              className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100"
            >
              套用此模板 <ChevronRight size={12} />
            </button>
          </div>
        ))}
      </div>
    </DraggableModal>
  )
}
