import React, { useState, useEffect } from 'react'
import { BlockSidebar } from './components/sidebar/BlockSidebar'
import { Canvas } from './components/canvas/Canvas'
import { OutputPanel } from './components/output/OutputPanel'
import { Toolbar } from './components/Toolbar'
import { PropertyPanel } from './components/blocks/PropertyPanel'
import { Spotlight } from './components/modals/Spotlight'
import { GlobalSearch } from './components/modals/GlobalSearch'
import { useCanvasStore } from './stores/canvasStore'
import { useHistoryStore } from './stores/historyStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useLiveCodegen } from './hooks/useLiveCodegen'
import { useThemeStore } from './stores/themeStore'
import { useHighlightedBlocks } from './components/canvas/GuideMode'
import { ToastContainer } from './components/Toast'
import { OfflineBanner, InstallBanner, UpdateBanner, PwaStatusBadge } from './components/pwa/PwaUI'
import clsx from 'clsx'

type MobilePanel = 'canvas' | 'blocks' | 'output'

export default function App() {
  const { selectedNodeId, nodes, edges } = useCanvasStore()
  const history = useHistoryStore()
  const { dark } = useThemeStore()
  const highlightedBlocks = useHighlightedBlocks()

  const [showSpotlight, setShowSpotlight] = useState(false)
  const [showGlobalSearch, setShowGlobalSearch] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showOutput, setShowOutput] = useState(true)
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('canvas')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useKeyboardShortcuts()
  useLiveCodegen()

  // Track window size
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // History
  useEffect(() => {
    const t = setTimeout(() => history.push(nodes, edges), 400)
    return () => clearTimeout(t)
  }, [nodes, edges])

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const inInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if (!inInput && e.key === ' ') { e.preventDefault(); setShowSpotlight(true) }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); setShowGlobalSearch(true) }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); setShowSidebar(s => !s) }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('bb:open-preview'))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // VSCode bridge
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'bb:export-canvas')
        window.parent.postMessage({ type: 'bb:canvas-export', canvas: { nodes, edges } }, '*')
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [nodes, edges])

  const TOOLBAR_H = 48 // px — keep in sync with Toolbar height

  return (
    <div
      className={clsx('flex flex-col w-screen font-sans', dark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900')}
      style={{ height: '100dvh' }}         /* dvh handles mobile browser chrome */
    >
      {/* ── Toolbar ────────────────────────── */}
      <div style={{ height: TOOLBAR_H, flexShrink: 0 }}>
        <Toolbar
          onSpotlight={() => setShowSpotlight(true)}
          showSidebar={showSidebar}
          showOutput={showOutput}
          onToggleSidebar={() => setShowSidebar(s => !s)}
          onToggleOutput={() => setShowOutput(s => !s)}
        />
      </div>

      {/* ── Body ───────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>

        {/* ===== DESKTOP ===== */}
        {!isMobile && (
          <>
            {/* Left sidebar */}
            {showSidebar && (
              <div style={{ width: 224, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                className={clsx('border-r', dark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white')}>
                {/* sidebar itself is scrollable inside */}
                <BlockSidebar highlightedBlocks={highlightedBlocks} />
              </div>
            )}

            {/* Canvas area */}
            <div style={{ flex: 1, minWidth: 0, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
              {/* Canvas fills entire area — explicit height required for ReactFlow */}
              <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <Canvas onOpenSpotlight={() => setShowSpotlight(true)} />
              </div>

              {/* Property panel — slides over canvas */}
              {selectedNodeId && (
                <div
                  style={{ position: 'absolute', top: 8, right: 8, width: 288, maxHeight: 'calc(100% - 16px)', zIndex: 20, display: 'flex', flexDirection: 'column' }}
                  className={clsx('rounded-xl shadow-xl border overflow-hidden', dark ? 'border-gray-700' : 'border-gray-200')}
                >
                  <PropertyPanel />
                </div>
              )}
            </div>

            {/* Right output panel */}
            {showOutput && (
              <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                className={clsx('border-l', dark ? 'border-gray-700' : 'border-gray-200')}>
                <OutputPanel />
              </div>
            )}
          </>
        )}

        {/* ===== MOBILE ===== */}
        {isMobile && (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Active panel */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
              {mobilePanel === 'canvas' && (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <Canvas onOpenSpotlight={() => setShowSpotlight(true)} />
                  {selectedNodeId && (
                    <div style={{ position: 'absolute', inset: '8px 8px auto', zIndex: 20, maxHeight: '70%', overflow: 'auto' }}
                      className={clsx('rounded-xl shadow-xl border', dark ? 'border-gray-700' : 'border-gray-200')}>
                      <PropertyPanel />
                    </div>
                  )}
                </div>
              )}
              {mobilePanel === 'blocks' && (
                <div style={{ height: '100%', overflow: 'hidden' }}>
                  <BlockSidebar highlightedBlocks={highlightedBlocks} compact />
                </div>
              )}
              {mobilePanel === 'output' && (
                <div style={{ height: '100%', overflow: 'hidden' }}>
                  <OutputPanel />
                </div>
              )}
            </div>

            {/* Bottom tab bar */}
            <div style={{ flexShrink: 0 }}
              className={clsx('flex border-t', dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200')}>
              {([
                { id: 'blocks' as MobilePanel,  icon: '⊞', label: '積木' },
                { id: 'canvas' as MobilePanel,  icon: '✏',  label: '畫布' },
                { id: 'output' as MobilePanel,  icon: '{}', label: '代碼' },
              ]).map(tab => (
                <button key={tab.id} onClick={() => setMobilePanel(tab.id)}
                  style={{ flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
                  className={clsx('transition-colors', mobilePanel === tab.id
                    ? dark ? 'text-blue-400' : 'text-blue-600'
                    : dark ? 'text-gray-500' : 'text-gray-400')}>
                  <span style={{ fontSize: 16 }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {showSpotlight    && <Spotlight onClose={() => setShowSpotlight(false)} />}
      {showGlobalSearch && <GlobalSearch onClose={() => setShowGlobalSearch(false)} />}
      <ToastContainer />
      <OfflineBanner />
      <InstallBanner />
      <UpdateBanner />
    </div>
  )
}
