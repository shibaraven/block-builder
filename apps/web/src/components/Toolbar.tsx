import React, { useState, useEffect } from 'react'
import {
  Download, Play, Trash2, LayoutTemplate, Settings,
  FolderOpen, Save, Undo2, Redo2, Search, Sun, Moon,
  Upload, GitBranch, Package, Camera, BarChart2, Sparkles, PanelLeft, PanelRight, History, Star, GitPullRequest, WifiOff, MoreHorizontal, ChevronDown, Eye,
} from 'lucide-react'
import { useCanvasStore } from '../stores/canvasStore'
import { useHistoryStore } from '../stores/historyStore'
import { usePersistStore } from '../stores/persistStore'
import { useThemeStore } from '../stores/themeStore'
import { generateFromCanvas } from '@block-builder/codegen'
import { ProjectsModal } from './modals/ProjectsModal'
import { StatsModal } from './modals/StatsModal'
import { QualityModal } from './modals/QualityModal'
import { GitHubPRModal } from './modals/GitHubPRModal'
import { AppPreviewModal } from './modals/AppPreviewModal'
import { PwaStatusBadge } from './pwa/PwaUI'
import { OfflineCapabilityModal } from './pwa/OfflineCapability'
import { GuideToggleButton } from './canvas/GuideMode'
import { toast } from './Toast'
import { useTimelineStore } from '../stores/timelineStore'
import { LoginButton, UserMenu } from './auth/AuthUI'
import { AiModal } from './ai/AiModal'
import { useAuthStore } from '../lib/api'
import { SettingsModal } from './modals/SettingsModal'
import { TemplatesModal } from './modals/TemplatesModal'
import { ImportModal } from './modals/ImportModal'
import { VersionHistoryModal, saveVersion } from './modals/VersionHistoryModal'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import clsx from 'clsx'

interface ToolbarProps {
  onSpotlight: () => void
  showSidebar?: boolean
  showOutput?: boolean
  onToggleSidebar?: () => void
  onToggleOutput?: () => void
}

export function Toolbar({ onSpotlight, showSidebar, showOutput, onToggleSidebar, onToggleOutput }: ToolbarProps) {
  const store = useCanvasStore()
  const history = useHistoryStore()
  const persist = usePersistStore()
  const { dark, toggle: toggleDark } = useThemeStore()

  const [showProjects, setShowProjects] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showQuality, setShowQuality] = useState(false)
  const [showGitHubPR, setShowGitHubPR] = useState(false)
  const [showAppPreview, setShowAppPreview] = useState(false)
  const [showOffline, setShowOffline] = useState(false)
  const [showAi, setShowAi] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [saveFlash, setSaveFlash] = useState(false)

  useEffect(() => { if (store.saveRequested === 0) return; handleSave() }, [store.saveRequested])

  useEffect(() => {
    if (store.nodes.length === 0) return
    const timer = setInterval(() => handleSave(true), 60000)
    return () => clearInterval(timer)
  }, [store.nodes, store.edges])

  const handleUndo = () => {
    const entry = history.undo({ nodes: store.nodes, edges: store.edges })
    if (entry) store.setNodesEdges(entry.nodes, entry.edges)
  }

  const handleRedo = () => {
    const entry = history.redo({ nodes: store.nodes, edges: store.edges })
    if (entry) store.setNodesEdges(entry.nodes, entry.edges)
  }

  const handleScreenshot = async () => {
    try {
      // Try html-to-image if installed, fallback to SVG export
      let dataUrl: string | null = null
      try {
        const { toPng } = await import('html-to-image')
        const el = document.querySelector('.react-flow__viewport') as HTMLElement
        if (el) dataUrl = await toPng(el.parentElement!, { backgroundColor: '#fafaf8' })
      } catch {
        // Fallback: export canvas as SVG snapshot via ReactFlow's toSvg pattern
        const svgEl = document.querySelector('.react-flow__renderer svg')
        if (svgEl) {
          const serializer = new XMLSerializer()
          const svgStr = serializer.serializeToString(svgEl)
          dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr)
        }
      }
      if (!dataUrl) { alert('截圖失敗，請先執行 pnpm add html-to-image'); return }
      const link = document.createElement('a')
      const name = store.project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      link.download = name + '-canvas.png'
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('Screenshot failed:', e)
    }
  }

  const handleSave = (silent = false) => {
    persist.saveProject({
      id: persist.activeProjectId ?? undefined,
      name: store.project.name,
      description: store.project.description ?? '',
      canvas: { nodes: store.nodes, edges: store.edges, viewport: { x: 0, y: 0, zoom: 1 } },
      settings: store.project.settings,
    })
    // Also save version snapshot
    if (!silent && store.nodes.length > 0) saveVersion(store.nodes, store.edges)
    if (!silent) { setSaveFlash(true); setTimeout(() => setSaveFlash(false), 1500); if (!silent) toast.success('專案已儲存') }
  }

  const handleGenerate = async () => {
    if (store.nodes.length === 0) return
    store.setIsGenerating(true)
    try {
      const code = await generateFromCanvas(
        { nodes: store.nodes, edges: store.edges, viewport: { x: 0, y: 0, zoom: 1 } },
        store.project.settings
      )
      store.setGeneratedCode(code)
      if (code.files.length > 0) store.setActiveOutputFile(code.files[0].path)
      toast.success(`生成完成！共 ${code.files.length} 個檔案`)
    } catch (err) { console.error('Generation failed:', err); toast.error('代碼生成失敗，請檢查積木設定') }
    finally { store.setIsGenerating(false) }
  }

  const handleDownload = async () => {
    if (!store.generatedCode) return
    const zip = new JSZip()
    for (const file of store.generatedCode.files) zip.file(file.path, file.content)
    zip.file('README.md', `# ${store.project.name}\n\nGenerated by Block Builder\n`)
    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, `${store.project.name.toLowerCase().replace(/\s+/g, '-')}-generated.zip`)
  }

  return (
    <>
      <header className={clsx(
        'flex items-center gap-2 px-3 h-12 border-b flex-shrink-0 z-10',
        dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2 mr-1">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">B</span>
          </div>
          <span className={clsx('font-semibold text-sm hidden sm:block', dark ? 'text-white' : 'text-gray-900')}>
            Block Builder
          </span>
        </div>

        <div className={clsx('w-px h-5', dark ? 'bg-gray-700' : 'bg-gray-200')} />

        {/* Panel toggles */}
        {onToggleSidebar && (
          <button onClick={onToggleSidebar} title="切換積木側欄 (Ctrl+B)"
            className={clsx('p-1.5 rounded transition-colors hidden sm:flex',
              showSidebar ? dark ? 'text-blue-400' : 'text-blue-600' : dark ? 'text-gray-500' : 'text-gray-400',
              dark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            )}>
            <PanelLeft size={14} />
          </button>
        )}

        {/* Project name */}
        <input
          type="text"
          value={store.project.name}
          onChange={e => store.setProjectName(e.target.value)}
          className={clsx(
            'text-sm border-none outline-none rounded px-2 py-1 w-36',
            dark ? 'bg-transparent text-gray-200 focus:bg-gray-800' : 'bg-transparent text-gray-700 focus:bg-gray-50'
          )}
        />

        <div className={clsx('w-px h-5', dark ? 'bg-gray-700' : 'bg-gray-200')} />

        {/* Undo/Redo */}
        <button onClick={handleUndo} disabled={!history.canUndo} title="Undo (Ctrl+Z)"
          className={clsx('p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors', dark ? 'text-gray-300' : 'text-gray-500')}>
          <Undo2 size={14} />
        </button>
        <button onClick={handleRedo} disabled={!history.canRedo} title="Redo (Ctrl+Y)"
          className={clsx('p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors', dark ? 'text-gray-300' : 'text-gray-500')}>
          <Redo2 size={14} />
        </button>

        <div className={clsx('w-px h-5', dark ? 'bg-gray-700' : 'bg-gray-200')} />

        {/* Spotlight */}
        <button onClick={onSpotlight} title="搜尋積木 (Space)"
          className={clsx('flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border transition-colors', dark ? 'text-gray-400 border-gray-700 hover:bg-gray-800' : 'text-gray-400 border-gray-200 hover:text-gray-600 hover:bg-gray-100')}>
          <Search size={12} />
          <span className="hidden md:block">搜尋</span>
          <kbd className={clsx('text-xs rounded px-1 hidden md:block', dark ? 'bg-gray-800 border-gray-600 border' : 'bg-gray-100 border border-gray-200')}>Space</kbd>
        </button>

        <span className={clsx('text-xs ml-1', dark ? 'text-gray-500' : 'text-gray-300')}>{store.nodes.length} 積木</span>

        <div className="flex-1" />

        {/* ── Primary action buttons (always visible) ── */}
        {[
          { icon: <Package size={13} />,   label: '模板', fn: () => setShowTemplates(true) },
          { icon: <Upload size={13} />,    label: '匯入', fn: () => setShowImport(true) },
          { icon: <GitBranch size={13} />, label: '歷史', fn: () => setShowHistory(true) },
          { icon: <FolderOpen size={13} />,label: '專案', fn: () => setShowProjects(true) },
          { icon: <Trash2 size={13} />,    label: '清除', danger: true, fn: store.clearCanvas },
        ].map(btn => (
          <button key={btn.label} onClick={btn.fn}
            className={clsx(
              'flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-colors',
              btn.danger
                ? dark ? 'text-red-400 hover:bg-red-950' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                : dark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}>
            {btn.icon}
            <span className="hidden lg:block">{btn.label}</span>
          </button>
        ))}

        {/* ── AI button — always visible, highlighted ── */}
        <button
          onClick={() => setShowAi(s => !s)}
          className={clsx(
            'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-all flex-shrink-0',
            showAi
              ? 'bg-violet-600 text-white border-violet-600'
              : dark ? 'text-violet-400 border-violet-700 hover:bg-violet-900' : 'text-violet-600 border-violet-200 hover:bg-violet-50'
          )}
          title="AI 架構助手"
        >
          <Sparkles size={13} />
          <span className="hidden sm:block">AI</span>
        </button>

        {/* ── More dropdown ── */}
        <div className="relative">
          <button
            onClick={() => setShowMore(s => !s)}
            className={clsx(
              'flex items-center gap-1 px-2 py-1.5 text-xs rounded-md transition-colors',
              dark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'
            )}
            title="更多功能"
          >
            <MoreHorizontal size={14} />
          </button>
          {showMore && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
              <div className={clsx(
                'absolute right-0 top-full mt-1 w-44 rounded-xl border shadow-xl z-50 py-1 overflow-hidden',
                dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
              )}>
                {[
                  { icon: <Eye size={13} />,            label: '👁 預覽成品', fn: () => setShowAppPreview(true) },
                  { icon: <LayoutTemplate size={13} />, label: '範例模板', fn: store.loadExample },
                  { icon: <Camera size={13} />,         label: '截圖',     fn: handleScreenshot },
                  { icon: <BarChart2 size={13} />,      label: '統計',     fn: () => setShowStats(true) },
                  { icon: <Star size={13} />,           label: '品質評分', fn: () => setShowQuality(true) },
                  { icon: <History size={13} />,        label: '時間軸',   fn: () => useTimelineStore.getState().setOpen(true) },
                  { icon: <GitPullRequest size={13} />, label: 'GitHub PR',fn: () => setShowGitHubPR(true) },
                  { icon: <WifiOff size={13} />,        label: '離線功能', fn: () => setShowOffline(true) },
                ].map(item => (
                  <button key={item.label}
                    onClick={() => { item.fn(); setShowMore(false) }}
                    className={clsx(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors',
                      dark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <span className={dark ? 'text-gray-400' : 'text-gray-400'}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <GuideToggleButton />
        <button onClick={() => setShowSettings(true)} className={clsx('p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors', dark ? 'text-gray-400' : 'text-gray-500')}>
          <Settings size={14} />
        </button>
        {onToggleOutput && (
          <button onClick={onToggleOutput} title="切換代碼面板"
            className={clsx('p-1.5 rounded transition-colors hidden sm:flex',
              showOutput ? dark ? 'text-blue-400' : 'text-blue-600' : dark ? 'text-gray-500' : 'text-gray-400',
              dark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            )}>
            <PanelRight size={14} />
          </button>
        )}

        <PwaStatusBadge />
        {/* Auth */}
        {(() => {
          const { user, isLoggedIn } = useAuthStore()
          return isLoggedIn() ? <UserMenu /> : <LoginButton />
        })()}

        <button onClick={toggleDark} title={dark ? '切換淺色' : '切換深色'}
          className={clsx('p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors', dark ? 'text-amber-400' : 'text-gray-500')}>
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <div className={clsx('w-px h-5', dark ? 'bg-gray-700' : 'bg-gray-200')} />

        {/* Save */}
        <button onClick={() => handleSave()} title="儲存 (Ctrl+S)"
          className={clsx(
            'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-all',
            saveFlash ? 'bg-green-100 text-green-700 border-green-300' : dark ? 'text-gray-400 border-gray-700 hover:bg-gray-800' : 'text-gray-600 border-gray-200 hover:bg-gray-100'
          )}>
          <Save size={13} />
          {saveFlash ? '已儲存！' : '儲存'}
        </button>

        {/* Generate */}
        <button onClick={handleGenerate} disabled={store.isGenerating || store.nodes.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 rounded-md transition-colors">
          <Play size={13} />
          {store.isGenerating ? '生成中...' : '生成代碼'}
        </button>

        {store.generatedCode && (
          <button onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors">
            <Download size={13} />ZIP
          </button>
        )}
      </header>

      {showProjects  && <ProjectsModal      onClose={() => setShowProjects(false)} />}
      {showSettings  && <SettingsModal      onClose={() => setShowSettings(false)} />}
      {showTemplates && <TemplatesModal     onClose={() => setShowTemplates(false)} />}
      {showImport    && <ImportModal        onClose={() => setShowImport(false)} />}
      {showHistory   && <VersionHistoryModal onClose={() => setShowHistory(false)} />}
      {showStats     && <StatsModal           onClose={() => setShowStats(false)} />}
      {showQuality   && <QualityModal         onClose={() => setShowQuality(false)} />}
      {showGitHubPR  && <GitHubPRModal        onClose={() => setShowGitHubPR(false)} />}
      {showAppPreview && <AppPreviewModal      onClose={() => setShowAppPreview(false)} />}
      {showOffline   && <OfflineCapabilityModal onClose={() => setShowOffline(false)} />}
      {showAi        && <AiModal              onClose={() => setShowAi(false)} />}
    </>
  )
}
