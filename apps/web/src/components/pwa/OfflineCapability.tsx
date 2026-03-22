import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, WifiOff, Wifi, RefreshCw } from 'lucide-react'
import { usePwaStore } from '../../stores/pwaStore'
import { DraggableModal } from '../modals/DraggableModal'

interface CapabilityItem {
  name: string
  description: string
  requiresNetwork: boolean
  test: () => Promise<boolean> | boolean
}

const CAPABILITIES: CapabilityItem[] = [
  {
    name: '積木拖放設計',
    description: '從側欄拖放積木到畫布',
    requiresNetwork: false,
    test: () => true,
  },
  {
    name: '代碼生成',
    description: 'TypeScript、Prisma、測試等代碼生成',
    requiresNetwork: false,
    test: () => true,
  },
  {
    name: 'localStorage 儲存',
    description: '專案自動儲存到瀏覽器',
    requiresNetwork: false,
    test: () => {
      try {
        localStorage.setItem('bb-pwa-test', '1')
        localStorage.removeItem('bb-pwa-test')
        return true
      } catch { return false }
    },
  },
  {
    name: '版本歷史',
    description: '積木版本回溯和 Diff 視圖',
    requiresNetwork: false,
    test: () => true,
  },
  {
    name: '模板市集',
    description: '內建 6+ 個積木模板',
    requiresNetwork: false,
    test: () => true,
  },
  {
    name: '代碼 ZIP 下載',
    description: '下載生成的代碼壓縮檔',
    requiresNetwork: false,
    test: () => typeof window.Blob !== 'undefined',
  },
  {
    name: 'Monaco 代碼編輯器',
    description: '右側代碼預覽面板',
    requiresNetwork: false,
    test: () => true,
  },
  {
    name: 'Live Preview',
    description: 'UI 積木即時預覽（faker.js 假資料）',
    requiresNetwork: false,
    test: () => true,
  },
  {
    name: 'AI 自然語言→積木',
    description: 'Claude / Gemini / Groq API',
    requiresNetwork: true,
    test: () => navigator.onLine,
  },
  {
    name: 'GitHub PR 推送',
    description: 'GitHub API 整合',
    requiresNetwork: true,
    test: () => navigator.onLine,
  },
  {
    name: '雲端專案同步',
    description: 'Block Builder 後端 API',
    requiresNetwork: true,
    test: () => navigator.onLine,
  },
]

export function OfflineCapabilityModal({ onClose }: { onClose: () => void }) {
  const { isOnline, isInstalled } = usePwaStore()
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [checking, setChecking] = useState(false)

  const runChecks = async () => {
    setChecking(true)
    const newResults: Record<string, boolean> = {}
    for (const cap of CAPABILITIES) {
      try {
        const result = await cap.test()
        newResults[cap.name] = result
      } catch {
        newResults[cap.name] = false
      }
    }
    setResults(newResults)
    setChecking(false)
  }

  useEffect(() => { runChecks() }, [])

  const offlineCount = CAPABILITIES.filter(c => !c.requiresNetwork).length
  const networkCount = CAPABILITIES.filter(c => c.requiresNetwork).length

  return (
    <DraggableModal
      title="離線功能清單"
      subtitle={isOnline ? '目前已連線' : '目前離線中'}
      icon={isOnline ? <Wifi size={14} className="text-green-500" /> : <WifiOff size={14} className="text-amber-500" />}
      onClose={onClose}
      width={480}
      maxHeight="85vh"
      footer={
        <button onClick={runChecks} disabled={checking}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-gray-600">
          <RefreshCw size={13} className={checking ? 'animate-spin' : ''} />
          重新檢查
        </button>
      }
    >
      <div className="p-5 space-y-4">

        {/* Status summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{offlineCount}</p>
            <p className="text-xs text-green-600 mt-0.5">離線可用功能</p>
          </div>
          <div className={`border rounded-xl p-3 text-center ${isOnline ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
            <p className={`text-2xl font-bold ${isOnline ? 'text-blue-700' : 'text-gray-400'}`}>{networkCount}</p>
            <p className={`text-xs mt-0.5 ${isOnline ? 'text-blue-600' : 'text-gray-400'}`}>需要網路功能</p>
          </div>
        </div>

        {/* PWA install status */}
        <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${
          isInstalled ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
        }`}>
          {isInstalled
            ? <><CheckCircle size={14} className="text-green-500 flex-shrink-0" /><p className="text-xs text-green-700 font-medium">已安裝為桌面 App — 完整離線支援</p></>
            : <><WifiOff size={14} className="text-amber-500 flex-shrink-0" /><p className="text-xs text-amber-700">安裝為桌面 App 可獲得完整離線體驗（工具列有安裝按鈕）</p></>
          }
        </div>

        {/* Offline features */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">離線可用 ✓</p>
          <div className="space-y-1.5">
            {CAPABILITIES.filter(c => !c.requiresNetwork).map(cap => (
              <div key={cap.name} className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 rounded-xl">
                {results[cap.name] === undefined
                  ? <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin flex-shrink-0" />
                  : results[cap.name]
                  ? <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  : <XCircle size={14} className="text-red-500 flex-shrink-0" />
                }
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700">{cap.name}</p>
                  <p className="text-xs text-gray-400 truncate">{cap.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Network features */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">需要網路</p>
          <div className="space-y-1.5">
            {CAPABILITIES.filter(c => c.requiresNetwork).map(cap => (
              <div key={cap.name} className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 rounded-xl opacity-60">
                {isOnline
                  ? <CheckCircle size={14} className="text-blue-400 flex-shrink-0" />
                  : <WifiOff size={14} className="text-gray-400 flex-shrink-0" />
                }
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500">{cap.name}</p>
                  <p className="text-xs text-gray-400 truncate">{cap.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DraggableModal>
  )
}
