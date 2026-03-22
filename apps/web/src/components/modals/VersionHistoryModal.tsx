import React, { useState, useEffect } from 'react'
import { X, Clock, RotateCcw, GitBranch } from 'lucide-react'
import { DraggableModal } from './DraggableModal'
import { useCanvasStore } from '../../stores/canvasStore'
import type { CanvasNode, CanvasEdge } from '@block-builder/types'
import clsx from 'clsx'

export interface VersionSnapshot {
  id: string
  timestamp: number
  label: string
  nodeCount: number
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

const VERSION_KEY = 'bb-versions'
const MAX_VERSIONS = 20

export function saveVersion(nodes: CanvasNode[], edges: CanvasEdge[], label?: string) {
  try {
    const versions: VersionSnapshot[] = JSON.parse(localStorage.getItem(VERSION_KEY) || '[]')
    const snap: VersionSnapshot = {
      id: `v-${Date.now()}`,
      timestamp: Date.now(),
      label: label || autoLabel(nodes),
      nodeCount: nodes.length,
      nodes: structuredClone(nodes),
      edges: structuredClone(edges),
    }
    const next = [snap, ...versions].slice(0, MAX_VERSIONS)
    localStorage.setItem(VERSION_KEY, JSON.stringify(next))
  } catch {}
}

function autoLabel(nodes: CanvasNode[]): string {
  const names = nodes.slice(0, 3).map(n => n.data.label).filter(Boolean)
  return names.join(', ') + (nodes.length > 3 ? `...（共 ${nodes.length}）` : '')
}

function getVersions(): VersionSnapshot[] {
  try { return JSON.parse(localStorage.getItem(VERSION_KEY) || '[]') } catch { return [] }
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

interface VersionHistoryProps { onClose: () => void }

export function VersionHistoryModal({ onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<VersionSnapshot[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const { nodes, edges, setNodesEdges } = useCanvasStore()

  useEffect(() => { setVersions(getVersions()) }, [])

  const selectedVersion = versions.find(v => v.id === selected)

  const restore = (v: VersionSnapshot) => {
    // Save current as a version first
    saveVersion(nodes, edges, `恢復前快照`)
    setNodesEdges(v.nodes, v.edges)
    setVersions(getVersions())
    onClose()
  }

  const saveNow = () => {
    saveVersion(nodes, edges)
    setVersions(getVersions())
  }

  const clearAll = () => {
    localStorage.removeItem(VERSION_KEY)
    setVersions([])
    setSelected(null)
  }

  // Diff: compare selected version with current canvas
  const diffNodes = selectedVersion ? {
    added: selectedVersion.nodes.filter(n => !nodes.find(c => c.data.label === n.data.label)),
    removed: nodes.filter(c => !selectedVersion.nodes.find(n => n.data.label === c.data.label)),
    same: selectedVersion.nodes.filter(n => nodes.find(c => c.data.label === n.data.label)),
  } : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20" onClick={onClose}>
      <div
        className="w-[680px] bg-white rounded-2xl border border-gray-200 shadow-2xl flex overflow-hidden"
        style={{ height: '70vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Left: version list */}
        <div className="w-64 border-r border-gray-100 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <GitBranch size={13} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-800">版本歷史</span>
            </div>
            <button onClick={onClose}><X size={13} className="text-gray-400 hover:text-gray-600" /></button>
          </div>
          <div className="flex gap-2 p-3 border-b border-gray-100">
            <button onClick={saveNow} className="flex-1 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              儲存快照
            </button>
            <button onClick={clearAll} className="px-2 py-1.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              清除
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-xs text-gray-300">
                <Clock size={20} className="mb-2 opacity-40" />
                還沒有版本快照
              </div>
            ) : versions.map(v => (
              <button
                key={v.id}
                onClick={() => setSelected(selected === v.id ? null : v.id)}
                className={clsx(
                  'w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors',
                  selected === v.id && 'bg-blue-50 border-l-2 border-l-blue-500'
                )}
              >
                <div className="text-xs font-medium text-gray-700 truncate">{v.label || `${v.nodeCount} 個積木`}</div>
                <div className="flex items-center gap-1 mt-1">
                  <Clock size={9} className="text-gray-300" />
                  <span className="text-xs text-gray-400">{formatTime(v.timestamp)}</span>
                  <span className="text-xs text-gray-300 ml-1">{v.nodeCount} 積木</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: diff view */}
        <div className="flex-1 flex flex-col">
          {!selectedVersion ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
              <GitBranch size={32} className="mb-3 opacity-30" />
              <p className="text-sm">點擊左側版本查看 Diff</p>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{selectedVersion.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatTime(selectedVersion.timestamp)} · {selectedVersion.nodeCount} 個積木</p>
                </div>
                <button
                  onClick={() => restore(selectedVersion)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  <RotateCcw size={11} />
                  恢復此版本
                </button>
              </div>

              {diffNodes && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">與目前畫布比較</p>

                  {diffNodes.added.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-green-600 mb-2">+ 此版本有，目前沒有（{diffNodes.added.length}）</div>
                      <div className="space-y-1">
                        {diffNodes.added.map(n => (
                          <div key={n.id} className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700">
                            <span className="font-mono font-medium">{n.data.label}</span>
                            <span className="text-green-400">({n.data.category})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {diffNodes.removed.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-red-500 mb-2">- 目前有，此版本沒有（{diffNodes.removed.length}）</div>
                      <div className="space-y-1">
                        {diffNodes.removed.map(n => (
                          <div key={n.id} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                            <span className="font-mono font-medium">{n.data.label}</span>
                            <span className="text-red-400">({n.data.category})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {diffNodes.same.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-400 mb-2">= 相同積木（{diffNodes.same.length}）</div>
                      <div className="space-y-1">
                        {diffNodes.same.map(n => (
                          <div key={n.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-500">
                            <span className="font-mono">{n.data.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {diffNodes.added.length === 0 && diffNodes.removed.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      與目前畫布完全相同
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
