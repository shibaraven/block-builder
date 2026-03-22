import React, { useState } from 'react'
import { Tag, X, Check } from 'lucide-react'
import { useLabelsStore, LABEL_COLORS, type LabelColor } from '../../stores/labelsStore'
import clsx from 'clsx'

interface LabelEditorProps {
  nodeId: string
  onClose?: () => void
}

const COLOR_OPTIONS: LabelColor[] = ['blue', 'green', 'amber', 'red', 'purple', 'gray']

export function LabelEditor({ nodeId, onClose }: LabelEditorProps) {
  const { getLabel, setLabel, removeLabel } = useLabelsStore()
  const existing = getLabel(nodeId)

  const [color, setColor] = useState<LabelColor>(existing?.color ?? 'blue')
  const [note, setNote] = useState(existing?.note ?? '')

  const save = () => {
    if (!note.trim() && !existing) return
    setLabel(nodeId, color, note.trim())
    onClose?.()
  }

  const clear = () => {
    removeLabel(nodeId)
    setNote('')
    onClose?.()
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Tag size={12} className="text-gray-400" />
        <span className="text-xs font-semibold text-gray-600">標籤與備註</span>
      </div>

      {/* Color picker */}
      <div>
        <p className="text-xs text-gray-400 mb-1.5">顏色標籤</p>
        <div className="flex gap-1.5">
          {COLOR_OPTIONS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={clsx(
                'w-6 h-6 rounded-full transition-all flex items-center justify-center',
                LABEL_COLORS[c].dot,
                color === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'hover:scale-110'
              )}
            >
              {color === c && <Check size={10} className="text-white" />}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div>
        <p className="text-xs text-gray-400 mb-1.5">備註</p>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="加上備註說明..."
          rows={2}
          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-blue-400 resize-none"
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) save() }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={save}
          className="flex-1 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          儲存
        </button>
        {existing && (
          <button
            onClick={clear}
            className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

// Mini label badge shown on block node
export function LabelBadge({ nodeId }: { nodeId: string }) {
  const label = useLabelsStore(s => s.getLabel(nodeId))
  if (!label) return null
  const c = LABEL_COLORS[label.color]
  return (
    <div className={clsx('flex items-center gap-1 px-1.5 py-0.5 rounded text-xs', c.bg, c.text)}>
      <div className={clsx('w-1.5 h-1.5 rounded-full', c.dot)} />
      {label.note && <span className="truncate max-w-[80px]">{label.note}</span>}
    </div>
  )
}
