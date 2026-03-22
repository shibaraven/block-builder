import React from 'react'
import { BarChart2, X } from 'lucide-react'
import { DraggableModal } from './DraggableModal'
import { useCanvasStore } from '../../stores/canvasStore'
import clsx from 'clsx'

interface StatsModalProps { onClose: () => void }

function estimateCodeLines(nodes: any[]): number {
  let lines = 0
  for (const n of nodes) {
    const kind = n.data.blockData?.kind
    switch (kind) {
      case 'interface': lines += 8 + (n.data.blockData.fields?.length ?? 0) * 2; break
      case 'dto': lines += 15 + (n.data.blockData.fields?.length ?? 0) * 4; break
      case 'enum': lines += 5 + (n.data.blockData.values?.length ?? 0) * 2; break
      case 'api-endpoint': lines += 25; break
      case 'nest-module': lines += 20; break
      case 'nest-service': lines += 15 + (n.data.blockData.methods?.length ?? 0) * 8; break
      case 'nest-repository': lines += 10 + (n.data.blockData.methods?.length ?? 0) * 6; break
      case 'use-query': lines += 18; break
      case 'use-mutation': lines += 22; break
      case 'store': lines += 20 + (n.data.blockData.state?.length ?? 0) * 2; break
      case 'data-table': lines += 60 + (n.data.blockData.columns?.length ?? 0) * 5; break
      case 'form': lines += 50 + (n.data.blockData.fields?.length ?? 0) * 8; break
      case 'chart': lines += 30; break
      case 'card': lines += 25 + (n.data.blockData.fields?.length ?? 0) * 5; break
      case 'navigation': lines += 20 + (n.data.blockData.items?.length ?? 0) * 4; break
      case 'auth-guard': lines += 35; break
      case 'jwt': lines += 25; break
      case 'cache': lines += 20; break
      case 'email': lines += 30 + (n.data.blockData.templates?.length ?? 0) * 6; break
      case 'websocket': lines += 30 + (n.data.blockData.events?.length ?? 0) * 8; break
      case 'job': lines += 20; break
      default: lines += 15
    }
  }
  return lines
}

function complexityScore(nodes: any[], edges: any[]): { score: number; label: string; color: string } {
  const n = nodes.length
  const e = edges.length
  const cats = new Set(nodes.map(n => n.data.category)).size
  const score = Math.min(100, Math.round(n * 4 + e * 2 + cats * 5))
  if (score < 20) return { score, label: '入門', color: '#1D9E75' }
  if (score < 40) return { score, label: '簡單', color: '#378ADD' }
  if (score < 60) return { score, label: '中等', color: '#BA7517' }
  if (score < 80) return { score, label: '複雜', color: '#D4537E' }
  return { score, label: '大型系統', color: '#7F77DD' }
}

export function StatsModal({ onClose }: StatsModalProps) {
  const { nodes, edges } = useCanvasStore()

  const cats = nodes.reduce<Record<string, number>>((acc, n) => {
    acc[n.data.category] = (acc[n.data.category] || 0) + 1
    return acc
  }, {})

  const kinds = nodes.reduce<Record<string, number>>((acc, n) => {
    const k = n.data.blockData?.kind ?? 'unknown'
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})

  const codeLines = estimateCodeLines(nodes)
  const { score, label, color } = complexityScore(nodes, edges)
  const testCount = nodes.filter(n => ['api-endpoint', 'api-get', 'api-post', 'api-put', 'api-delete', 'use-query', 'use-mutation', 'nest-service'].includes(n.data.blockData?.kind)).length
  const apiCount = nodes.filter(n => n.data.category === 'api').length
  const uiCount = nodes.filter(n => n.data.category === 'ui').length
  const authCount = nodes.filter(n => n.data.category === 'auth').length

  const CAT_LABELS: Record<string, string> = {
    api: 'API & NestJS', type: 'TypeScript 型別', logic: 'Hooks & Store',
    auth: '認證', infra: '基礎設施', ui: 'UI 組件', layout: '版面',
  }
  const CAT_COLORS: Record<string, string> = {
    api: '#378ADD', type: '#1D9E75', logic: '#BA7517',
    auth: '#7F77DD', infra: '#D85A30', ui: '#D4537E', layout: '#888780',
  }

  const maxCatCount = Math.max(...Object.values(cats), 1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20" onClick={onClose}>
      <div
        className="w-[560px] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BarChart2 size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">專案統計</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={14} className="text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Key metrics */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: '積木總數', value: nodes.length, sub: `${edges.length} 條連線` },
              { label: '預計代碼行', value: codeLines.toLocaleString(), sub: '行 TypeScript' },
              { label: '自動測試', value: testCount, sub: '個測試檔案' },
              { label: 'API 端點', value: apiCount, sub: `${uiCount} 個 UI 組件` },
            ].map((m, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-gray-900">{m.value}</div>
                <div className="text-xs font-medium text-gray-600 mt-0.5">{m.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Complexity */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">複雜度</span>
              <span className="text-xs font-semibold" style={{ color }}>{label}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${score}%`, background: color }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-300 mt-1">
              <span>入門</span><span>簡單</span><span>中等</span><span>複雜</span><span>大型</span>
            </div>
          </div>

          {/* Category breakdown */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-3">積木分類</p>
            <div className="space-y-2">
              {Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-gray-500 truncate">{CAT_LABELS[cat] ?? cat}</div>
                  <div className="flex-1 h-5 bg-gray-100 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${(count / maxCatCount) * 100}%`, background: CAT_COLORS[cat] ?? '#888' }}
                    >
                      <span className="text-xs text-white font-medium opacity-90">{count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Auth / infra summary */}
          {(authCount > 0 || nodes.some(n => n.data.category === 'infra')) && (
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs font-medium text-blue-800 mb-1">系統特性</p>
              <div className="flex flex-wrap gap-2">
                {authCount > 0 && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">已加入認證</span>}
                {nodes.some(n => n.data.blockData?.kind === 'cache') && <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full">有快取層</span>}
                {nodes.some(n => n.data.blockData?.kind === 'websocket') && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">即時通訊</span>}
                {nodes.some(n => n.data.blockData?.kind === 'email') && <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Email 通知</span>}
                {nodes.some(n => n.data.blockData?.kind === 'job') && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">背景任務</span>}
                {nodes.some(n => n.data.blockData?.kind === 'stripe') && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Stripe 支付</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
