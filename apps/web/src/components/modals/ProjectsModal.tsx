import React, { useState } from 'react'
import { X, FolderOpen, Plus, Trash2, Copy, Clock } from 'lucide-react'
import { DraggableModal } from './DraggableModal'
import { usePersistStore } from '../../stores/persistStore'
import { useCanvasStore } from '../../stores/canvasStore'
import clsx from 'clsx'

interface ProjectsModalProps {
  onClose: () => void
}

export function ProjectsModal({ onClose }: ProjectsModalProps) {
  const { projects, deleteProject, duplicateProject, loadProject, setActiveProject } = usePersistStore()
  const { loadProjectData, project } = useCanvasStore()
  const [confirm, setConfirm] = useState<string | null>(null)

  const handleOpen = (id: string) => {
    const p = loadProject(id)
    if (!p) return
    loadProjectData(p)
    setActiveProject(id)
    onClose()
  }

  const handleDelete = (id: string) => {
    if (confirm === id) {
      deleteProject(id)
      setConfirm(null)
    } else {
      setConfirm(id)
      setTimeout(() => setConfirm(null), 2000)
    }
  }

  const handleDuplicate = (id: string) => {
    duplicateProject(id)
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20" onClick={onClose}>
      <div
        className="w-[600px] max-h-[70vh] bg-white rounded-2xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">專案管理</h2>
            <p className="text-xs text-gray-400 mt-0.5">{projects.length} 個專案</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={14} className="text-gray-400" />
          </button>
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto p-3">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300">
              <FolderOpen size={32} className="mb-3" />
              <p className="text-sm">還沒有儲存的專案</p>
              <p className="text-xs mt-1">點擊工具列的「儲存」來建立第一個專案</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className={clsx(
                    'group border rounded-xl p-3 cursor-pointer transition-all hover:border-blue-300 hover:shadow-sm',
                    p.id === usePersistStore.getState().activeProjectId
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  )}
                  onClick={() => handleOpen(p.id)}
                >
                  {/* Project icon */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDuplicate(p.id)}
                        title="複製"
                        className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        title={confirm === p.id ? '再按一次確認刪除' : '刪除'}
                        className={clsx(
                          'p-1 rounded transition-colors',
                          confirm === p.id
                            ? 'bg-red-100 text-red-600'
                            : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                        )}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{p.description || '無描述'}</p>

                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-300">
                    <Clock size={10} />
                    <span>{formatDate(p.updatedAt)}</span>
                  </div>

                  <div className="flex gap-1 mt-2 flex-wrap">
                    {p.canvas.nodes.slice(0, 4).map((n, i) => (
                      <span
                        key={i}
                        className={clsx(
                          'text-xs px-1.5 py-0.5 rounded font-mono',
                          n.data.category === 'api' && 'bg-api-50 text-api-800',
                          n.data.category === 'type' && 'bg-type-50 text-type-800',
                          n.data.category === 'logic' && 'bg-logic-50 text-logic-800',
                          n.data.category === 'ui' && 'bg-ui-50 text-ui-800',
                        )}
                      >
                        {(n.data.blockData as any)?.name || (n.data.blockData as any)?.hookName || n.data.label}
                      </span>
                    ))}
                    {p.canvas.nodes.length > 4 && (
                      <span className="text-xs text-gray-400 px-1.5 py-0.5">+{p.canvas.nodes.length - 4}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
