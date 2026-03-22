import React, { useEffect, useRef, useState } from 'react'
import { X, Monitor, Tablet, Smartphone, RefreshCw, ExternalLink, Maximize2 } from 'lucide-react'
import { useCanvasStore } from '../../stores/canvasStore'
import { useThemeStore } from '../../stores/themeStore'
import { generateAppPreviewHTML, analyseCanvas } from '../../lib/appPreviewGenerator'
import clsx from 'clsx'

type ViewportSize = 'desktop' | 'tablet' | 'mobile'

const VIEWPORT_SIZES: Record<ViewportSize, { width: string; height: string; label: string }> = {
  desktop: { width: '100%',   height: '100%', label: '桌面' },
  tablet:  { width: '768px',  height: '90%',  label: '平板' },
  mobile:  { width: '375px',  height: '90%',  label: '手機' },
}

interface AppPreviewModalProps {
  onClose: () => void
}

export function AppPreviewModal({ onClose }: AppPreviewModalProps) {
  const { nodes } = useCanvasStore()
  const { dark } = useThemeStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [loading, setLoading] = useState(true)
  const [pageCount, setPageCount] = useState(0)
  const [appName, setAppName] = useState('My App')

  const loadPreview = () => {
    setLoading(true)
    const config = analyseCanvas(nodes)
    setPageCount(config.pages.length)
    setAppName(config.appName)
    const html = generateAppPreviewHTML(nodes)

    if (iframeRef.current) {
      iframeRef.current.srcdoc = html
    }
  }

  useEffect(() => {
    loadPreview()
  }, [])

  const handleIframeLoad = () => {
    setLoading(false)
  }

  const openInNewTab = () => {
    const html = generateAppPreviewHTML(nodes)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  const vp = VIEWPORT_SIZES[viewport]

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: 'rgba(0,0,0,0.85)' }}>

      {/* Header toolbar */}
      <div className={clsx(
        'flex items-center gap-3 px-4 py-2.5 flex-shrink-0',
        'bg-gray-900 border-b border-gray-700'
      )}>
        {/* App info */}
        <div className="flex items-center gap-2.5 mr-2">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-xs font-bold text-white">⊞</div>
          <div>
            <span className="text-sm font-semibold text-white">{appName}</span>
            <span className="text-xs text-gray-400 ml-2">· {pageCount} 個頁面</span>
          </div>
        </div>

        <div className="w-px h-5 bg-gray-700" />

        {/* Viewport toggles */}
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          {([
            { id: 'desktop' as ViewportSize, icon: <Monitor size={13} />,    label: '桌面' },
            { id: 'tablet'  as ViewportSize, icon: <Tablet size={13} />,     label: '平板' },
            { id: 'mobile'  as ViewportSize, icon: <Smartphone size={13} />, label: '手機' },
          ]).map(v => (
            <button
              key={v.id}
              onClick={() => setViewport(v.id)}
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
                viewport === v.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              )}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-700" />

        {/* Actions */}
        <button
          onClick={loadPreview}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          title="重新整理預覽"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          重新整理
        </button>

        <button
          onClick={openInNewTab}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          title="在新視窗開啟"
        >
          <ExternalLink size={12} />
          新視窗
        </button>

        <div className="flex-1" />

        {/* Nodes summary */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{nodes.filter(n => ['data-table','form','chart','card','navigation'].includes((n.data.blockData as any).kind)).length} 個 UI 積木</span>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors ml-1"
        >
          <X size={16} />
        </button>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4 min-h-0">
        {nodes.filter(n => ['data-table','form','chart','card','navigation','page','search-bar'].includes((n.data.blockData as any).kind)).length === 0 ? (
          <div className="text-center text-gray-400">
            <div className="text-5xl mb-4 opacity-30">👁</div>
            <p className="text-base font-medium text-gray-300 mb-2">沒有可預覽的 UI 積木</p>
            <p className="text-sm text-gray-500">拖入 DataTable、Form、Chart、Navigation 等積木後再開啟預覽</p>
          </div>
        ) : (
          <div
            className="relative rounded-xl overflow-hidden shadow-2xl transition-all duration-300"
            style={{
              width: vp.width,
              height: vp.height,
              maxWidth: '100%',
              maxHeight: '100%',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-500">產生預覽中...</p>
                </div>
              </div>
            )}

            {/* Device frame */}
            {viewport !== 'desktop' && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-gray-700 rounded-full z-20" />
            )}

            <iframe
              ref={iframeRef}
              onLoad={handleIframeLoad}
              className="w-full h-full border-none"
              title="App Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-2 bg-gray-900 border-t border-gray-800 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          預覽使用假資料，不連接真實 API。互動功能（排序、搜尋、表單提交）均可操作。
        </p>
        <p className="text-xs text-gray-600">
          按 ESC 關閉
        </p>
      </div>
    </div>
  )
}
