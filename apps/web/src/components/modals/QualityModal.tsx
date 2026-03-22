import React, { useMemo } from 'react'
import { Shield, Zap, TestTube, Wrench, ChevronRight } from 'lucide-react'
import { DraggableModal } from './DraggableModal'
import { useCanvasStore } from '../../stores/canvasStore'
import { scoreCodeQuality, type QualityIssue } from '../../lib/qualityScore'
import { BLOCK_DEF_MAP } from '../../lib/blockDefinitions'
import { toast } from '../Toast'
import clsx from 'clsx'

interface QualityModalProps { onClose: () => void }

const DIM_CONFIG = {
  maintainability: { label: '可維護性', icon: <Wrench size={14} />,  color: '#185FA5', bg: 'bg-blue-50'   },
  security:        { label: '安全性',   icon: <Shield size={14} />,   color: '#0F6E56', bg: 'bg-green-50'  },
  performance:     { label: '效能',     icon: <Zap size={14} />,      color: '#BA7517', bg: 'bg-amber-50'  },
  testCoverage:    { label: '測試覆蓋', icon: <TestTube size={14} />, color: '#7F77DD', bg: 'bg-purple-50' },
}

const SEV_COLORS = {
  error:   'text-red-600 bg-red-50 border-red-100',
  warning: 'text-amber-700 bg-amber-50 border-amber-100',
  info:    'text-blue-700 bg-blue-50 border-blue-100',
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 28, c = 2 * Math.PI * r
  const pct = score / 100
  return (
    <svg width={72} height={72} viewBox="0 0 72 72">
      <circle cx={36} cy={36} r={r} fill="none" stroke="#e5e7eb" strokeWidth={6} />
      <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${c * pct} ${c * (1 - pct)}`}
        strokeDashoffset={c * 0.25}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
      <text x={36} y={36} dominantBaseline="middle" textAnchor="middle"
        fontSize={15} fontWeight={700} fill={color}>{score}</text>
    </svg>
  )
}

export function QualityModal({ onClose }: QualityModalProps) {
  const { nodes, edges, addNode } = useCanvasStore()
  const score = useMemo(() => scoreCodeQuality(nodes, edges), [nodes, edges])

  const overallColor = score.overall >= 80 ? '#1D9E75' : score.overall >= 60 ? '#BA7517' : '#E24B4A'
  const overallLabel = score.overall >= 80 ? '優秀' : score.overall >= 60 ? '良好' : '需改善'

  const handleFix = (issue: QualityIssue) => {
    if (issue.fix?.includes('Middleware')) {
      const def = BLOCK_DEF_MAP['middleware']
      if (def) {
        addNode({
          id: `fix-${Date.now()}`,
          type: 'blockNode',
          position: { x: 60, y: 60 + nodes.length * 40 },
          data: { blockDefId: def.id, category: def.category, label: def.label, blockData: structuredClone(def.defaultData) as any },
        })
        toast.success('已加入 Middleware 積木')
        onClose()
      }
    } else if (issue.fix?.includes('Cache')) {
      const def = BLOCK_DEF_MAP['cache']
      if (def) {
        addNode({
          id: `fix-${Date.now()}`,
          type: 'blockNode',
          position: { x: 60, y: 60 + nodes.length * 40 },
          data: { blockDefId: def.id, category: def.category, label: def.label, blockData: structuredClone(def.defaultData) as any },
        })
        toast.success('已加入 Cache 積木')
        onClose()
      }
    } else if (issue.fix?.includes('Pagination')) {
      const def = BLOCK_DEF_MAP['pagination']
      if (def) {
        addNode({
          id: `fix-${Date.now()}`,
          type: 'blockNode',
          position: { x: 60, y: 60 + nodes.length * 40 },
          data: { blockDefId: def.id, category: def.category, label: def.label, blockData: structuredClone(def.defaultData) as any },
        })
        toast.success('已加入 Pagination 積木')
        onClose()
      }
    }
  }

  return (
    <DraggableModal
      title="代碼品質評分"
      subtitle="根據目前積木配置分析"
      onClose={onClose}
      width={560}
      maxHeight="85vh"
    >
      <div className="p-5 space-y-5">

        {/* Overall score */}
        <div className="flex items-center gap-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <ScoreRing score={score.overall} color={overallColor} />
          <div>
            <p className="text-2xl font-bold" style={{ color: overallColor }}>{score.overall} 分</p>
            <p className="text-sm font-medium text-gray-600">{overallLabel}</p>
            <p className="text-xs text-gray-400 mt-0.5">基於 4 個維度的綜合評分</p>
          </div>
        </div>

        {/* 4 dimensions */}
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(DIM_CONFIG) as any[]).map(([key, cfg]) => {
            const val = score[key as keyof typeof score] as number
            return (
              <div key={key} className={clsx('rounded-xl p-3 border', cfg.bg, 'border-gray-100')}>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: cfg.color }}>{cfg.icon}</span>
                  <span className="text-xs font-medium text-gray-600">{cfg.label}</span>
                  <span className="ml-auto text-sm font-bold" style={{ color: cfg.color }}>{val}</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${val}%`, background: cfg.color }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Issues */}
        {score.issues.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              問題清單（{score.issues.length}）
            </p>
            <div className="space-y-2">
              {score.issues.map((issue, i) => (
                <div key={i} className={clsx('flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-xs', SEV_COLORS[issue.severity])}>
                  <span className="font-bold flex-shrink-0 mt-0.5">
                    {issue.severity === 'error' ? '✕' : issue.severity === 'warning' ? '⚠' : 'ℹ'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{issue.message}</p>
                    {issue.fix && <p className="mt-0.5 opacity-75">修復：{issue.fix}</p>}
                  </div>
                  {issue.fix && (
                    <button
                      onClick={() => handleFix(issue)}
                      className="flex items-center gap-1 text-xs font-medium opacity-80 hover:opacity-100 flex-shrink-0"
                    >
                      修復 <ChevronRight size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {score.suggestions.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs font-medium text-blue-800 mb-1.5">改善建議</p>
            <ul className="space-y-1">
              {score.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-blue-700">
                  <span className="flex-shrink-0 mt-0.5">→</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {score.issues.length === 0 && (
          <div className="text-center py-4 text-green-600">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-sm font-medium">沒有發現問題！設計品質優秀</p>
          </div>
        )}

      </div>
    </DraggableModal>
  )
}
