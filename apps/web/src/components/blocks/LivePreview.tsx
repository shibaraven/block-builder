import React, { useMemo, useState } from 'react'
import { Monitor, Code2, RefreshCw } from 'lucide-react'
import { generatePreviewHtml, PREVIEWABLE_KINDS } from '../../lib/previewGenerator'
import type { BlockData } from '@block-builder/types'
import clsx from 'clsx'

interface LivePreviewProps {
  blockData: BlockData
  blockLabel: string
}

export function LivePreview({ blockData, blockLabel }: LivePreviewProps) {
  const [tab, setTab] = useState<'preview' | 'html'>('preview')
  const [key, setKey] = useState(0)

  const html = useMemo(() => generatePreviewHtml(blockData), [blockData])

  if (!PREVIEWABLE_KINDS.has(blockData.kind)) return null

  return (
    <div className="absolute left-[calc(100%+8px)] top-0 w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-30 animate-slide-in"
      style={{ maxHeight: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <Monitor size={13} className="text-gray-400" />
          <span className="text-xs font-semibold text-gray-700">Live Preview</span>
          <span className="text-xs text-gray-400">— {blockLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Tab switcher */}
          <button
            onClick={() => setTab('preview')}
            className={clsx('p-1 rounded text-xs transition-colors', tab === 'preview' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-600')}
          >
            <Monitor size={12} />
          </button>
          <button
            onClick={() => setTab('html')}
            className={clsx('p-1 rounded text-xs transition-colors', tab === 'html' ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:text-gray-600')}
          >
            <Code2 size={12} />
          </button>
          <button
            onClick={() => setKey(k => k + 1)}
            className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
            title="重新整理"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Content */}
      {tab === 'preview' ? (
        <div className="relative" style={{ height: '380px' }}>
          {html ? (
            <iframe
              key={key}
              srcDoc={html}
              className="w-full h-full border-0"
              sandbox="allow-scripts"
              title="Component Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300 text-sm">
              無法預覽此積木類型
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-auto" style={{ height: '380px' }}>
          <pre className="text-xs font-mono text-gray-600 p-3 leading-relaxed whitespace-pre-wrap break-all">
            {html ?? '// No preview available'}
          </pre>
        </div>
      )}

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-400">修改屬性時自動更新 · 僅供視覺參考</p>
      </div>
    </div>
  )
}
