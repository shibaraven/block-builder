import React from 'react'
import { X, GripHorizontal } from 'lucide-react'
import { useDraggable } from '../../hooks/useDraggable'
import clsx from 'clsx'

// ─── Per-modal error boundary ────────────────────────────────────────
class ModalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) { return { error: e } }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
          <div className="text-2xl">⚠️</div>
          <p className="text-sm font-medium text-gray-700">此視窗發生錯誤</p>
          <p className="text-xs text-gray-400">{(this.state.error as Error).message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            重試
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

interface DraggableModalProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  width?: number | string
  maxHeight?: number | string
  initialPos?: { x: number; y: number }
  className?: string
}

export function DraggableModal({
  title, subtitle, icon, onClose, children, footer,
  width = 520, maxHeight = '80vh', initialPos, className,
}: DraggableModalProps) {
  const { ref, style, onMouseDown, isDragging } = useDraggable(initialPos)

  // Close on Escape
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      {/* Backdrop — click to close */}
      <div
        className="absolute inset-0 pointer-events-auto"
        onClick={onClose}
        style={{ background: 'rgba(0,0,0,0.15)' }}
      />

      {/* Modal */}
      <div
        ref={ref}
        style={{ ...style, width, maxHeight, position: 'relative' }}
        className={clsx(
          'pointer-events-auto flex flex-col bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden',
          isDragging && 'select-none',
          className
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex-shrink-0 cursor-grab active:cursor-grabbing"
          onMouseDown={onMouseDown}
        >
          <div className="flex items-center gap-2.5">
            {icon && <div className="text-gray-400">{icon}</div>}
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
              {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GripHorizontal size={14} className="text-gray-300" />
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X size={14} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Scrollable body with error isolation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <ModalErrorBoundary>
            {children}
          </ModalErrorBoundary>
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 border-t border-gray-100 px-5 py-3.5 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
