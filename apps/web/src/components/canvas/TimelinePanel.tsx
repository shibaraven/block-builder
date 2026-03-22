import React from 'react'
import { Clock, RotateCcw, Trash2, X } from 'lucide-react'
import { useTimelineStore, getActionIcon, formatTime } from '../../stores/timelineStore'
import { useCanvasStore } from '../../stores/canvasStore'
import clsx from 'clsx'
import { useThemeStore } from '../../stores/themeStore'

export function TimelinePanel() {
  const { entries, restoreTo, clear, setOpen } = useTimelineStore()
  const { setNodesEdges } = useCanvasStore()
  const { dark } = useThemeStore()

  return (
    <div
      className={clsx(
        'absolute right-0 top-0 bottom-0 w-64 border-l flex flex-col z-30 shadow-xl',
        dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      )}
    >
      {/* Header */}
      <div className={clsx(
        'flex items-center justify-between px-4 py-3 border-b flex-shrink-0',
        dark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'
      )}>
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">操作時間軸</span>
          <span className="text-xs text-gray-400">{entries.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clear} title="清除歷史"
            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={12} />
          </button>
          <button onClick={() => setOpen(false)}
            className="p-1 hover:bg-gray-200 rounded text-gray-400 transition-colors">
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto py-2">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-300 gap-2">
            <Clock size={20} className="opacity-40" />
            <p className="text-xs">還沒有操作紀錄</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-7 top-0 bottom-0 w-px bg-gray-100" />

            {entries.map((entry, i) => (
              <div key={entry.id}
                className={clsx(
                  'flex items-start gap-3 px-4 py-2 group hover:bg-gray-50 transition-colors relative',
                  dark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                )}
              >
                {/* Icon dot */}
                <div className={clsx(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 z-10',
                  'bg-white border-2 border-gray-200 shadow-sm'
                )}>
                  {getActionIcon(entry.action)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-xs font-medium text-gray-700 truncate">{entry.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{formatTime(entry.timestamp)}</span>
                    <span className="text-xs text-gray-300">{entry.nodeCount} 積木</span>
                  </div>
                </div>

                {/* Restore button */}
                <button
                  onClick={() => restoreTo(entry.id, setNodesEdges)}
                  title="恢復到此狀態"
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded text-gray-400 hover:text-blue-600 transition-all flex-shrink-0"
                >
                  <RotateCcw size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={clsx(
        'px-4 py-2.5 border-t flex-shrink-0',
        dark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'
      )}>
        <p className="text-xs text-gray-400">每次操作自動記錄，最多 {50} 條</p>
      </div>
    </div>
  )
}
