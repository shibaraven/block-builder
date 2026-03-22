import React, { useEffect, useState } from 'react'
import { BookOpen, X, ChevronRight, Lightbulb } from 'lucide-react'
import { getNextBlockSuggestions } from '../../lib/snapAndSuggest'
import { BLOCK_DEF_MAP } from '../../lib/blockDefinitions'
import { useCanvasStore } from '../../stores/canvasStore'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import clsx from 'clsx'

// ─── Guide store ──────────────────────────────────────────────────────
interface GuideStore {
  enabled: boolean
  dismissed: boolean
  toggle: () => void
  dismiss: () => void
}

export const useGuideStore = create<GuideStore>()(
  persist(
    (set) => ({
      enabled: true,
      dismissed: false,
      toggle: () => set(s => ({ enabled: !s.enabled, dismissed: false })),
      dismiss: () => set({ dismissed: true }),
    }),
    { name: 'bb-guide' }
  )
)

// ─── What IDs are highlighted ─────────────────────────────────────────
export function useHighlightedBlocks(): Set<string> {
  const { nodes } = useCanvasStore()
  const { enabled } = useGuideStore()
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!enabled) { setHighlighted(new Set()); return }
    if (nodes.length === 0) {
      // No blocks yet → highlight starter blocks
      setHighlighted(new Set(['interface', 'dto', 'api-get']))
      return
    }
    // Highlight suggested next steps based on last added node
    const lastNode = nodes[nodes.length - 1]
    const nextIds = getNextBlockSuggestions(lastNode.data.blockDefId)
    // Also remove already-placed block def IDs
    const placedDefIds = new Set(nodes.map(n => n.data.blockDefId))
    const filtered = nextIds.filter(id => !placedDefIds.has(id))
    setHighlighted(new Set(filtered.slice(0, 4)))
  }, [nodes, enabled])

  return highlighted
}

// ─── Guide steps ─────────────────────────────────────────────────────
const GUIDE_STEPS = [
  {
    id: 'start',
    title: '從型別積木開始',
    desc: '拖入 Interface 定義你的資料型別，例如 User、Product。',
    highlight: ['interface', 'dto', 'enum'],
    condition: (nodes: any[]) => nodes.length === 0,
  },
  {
    id: 'api',
    title: '加入 API 端點',
    desc: '拖入 GET 或 POST 端點，連到你的 Interface。',
    highlight: ['api-get', 'api-post'],
    condition: (nodes: any[]) => nodes.some(n => n.data.category === 'type') && !nodes.some(n => n.data.category === 'api'),
  },
  {
    id: 'hook',
    title: '新增 React Hook',
    desc: '拖入 useQuery 讓前端可以呼叫 API。',
    highlight: ['use-query', 'use-mutation'],
    condition: (nodes: any[]) => nodes.some(n => n.data.category === 'api') && !nodes.some(n => n.data.category === 'logic'),
  },
  {
    id: 'ui',
    title: '加入 UI 組件',
    desc: '拖入 DataTable 或 Form 顯示資料。',
    highlight: ['data-table', 'form', 'card'],
    condition: (nodes: any[]) => nodes.some(n => n.data.category === 'logic') && !nodes.some(n => n.data.category === 'ui'),
  },
  {
    id: 'generate',
    title: '生成代碼！',
    desc: '點工具列「生成代碼」，右側會出現所有 TypeScript 檔案。',
    highlight: [],
    condition: (nodes: any[]) => nodes.some(n => n.data.category === 'ui'),
  },
]

// ─── Guide banner component ───────────────────────────────────────────
export function GuideBanner() {
  const { nodes } = useCanvasStore()
  const { enabled, dismissed, dismiss, toggle } = useGuideStore()

  if (!enabled || dismissed) return null

  const currentStep = GUIDE_STEPS.find(s => s.condition(nodes)) ?? GUIDE_STEPS[GUIDE_STEPS.length - 1]
  const stepIndex = GUIDE_STEPS.indexOf(currentStep)
  const isLast = stepIndex === GUIDE_STEPS.length - 1

  return (
    <div className={clsx(
      'absolute bottom-16 left-1/2 -translate-x-1/2 z-20',
      'bg-white border border-blue-200 rounded-2xl shadow-lg',
      'flex items-center gap-3 px-4 py-3 animate-fade-in',
      'max-w-md w-full mx-4'
    )}>
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
        <Lightbulb size={14} className="text-blue-500" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-blue-800">{currentStep.title}</span>
          <span className="text-xs text-blue-400">{stepIndex + 1}/{GUIDE_STEPS.length}</span>
        </div>
        <p className="text-xs text-gray-500 truncate">{currentStep.desc}</p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1 flex-shrink-0">
        {GUIDE_STEPS.map((_, i) => (
          <div key={i} className={clsx(
            'w-1.5 h-1.5 rounded-full transition-colors',
            i <= stepIndex ? 'bg-blue-400' : 'bg-gray-200'
          )} />
        ))}
      </div>

      <button
        onClick={dismiss}
        className={clsx(
          'flex-shrink-0 p-1 rounded-lg transition-colors',
          isLast ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
        )}
        title={isLast ? '完成引導' : '關閉引導'}
      >
        <X size={12} />
      </button>
    </div>
  )
}

// ─── Guide toggle button ──────────────────────────────────────────────
export function GuideToggleButton() {
  const { enabled, dismissed, toggle } = useGuideStore()
  return (
    <button
      onClick={toggle}
      title={enabled ? '關閉引導模式' : '開啟引導模式'}
      className={clsx(
        'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-all',
        enabled && !dismissed
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'text-gray-500 border-gray-200 hover:bg-gray-100'
      )}
    >
      <BookOpen size={12} />
      <span className="hidden lg:block">引導</span>
    </button>
  )
}
