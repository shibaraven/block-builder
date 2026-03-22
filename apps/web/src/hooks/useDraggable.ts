import { useRef, useCallback, useEffect, useState } from 'react'

interface Position { x: number; y: number }

export function useDraggable(initialPos?: Position) {
  const [pos, setPos] = useState<Position>(initialPos ?? { x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag from handle (header area), not from buttons/inputs inside
    if ((e.target as HTMLElement).closest('button,input,select,textarea,a')) return
    e.preventDefault()
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }
    setIsDragging(true)
  }, [pos])

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: MouseEvent) => {
      if (!dragStart.current) return
      const dx = e.clientX - dragStart.current.mx
      const dy = e.clientY - dragStart.current.my
      let nx = dragStart.current.px + dx
      let ny = dragStart.current.py + dy
      // Clamp to viewport
      const el = ref.current
      if (el) {
        const { width, height } = el.getBoundingClientRect()
        nx = Math.max(-window.innerWidth / 2 + 80, Math.min(window.innerWidth / 2 - 80, nx))
        ny = Math.max(-window.innerHeight / 2 + 40, Math.min(window.innerHeight / 2 - 40, ny))
      }
      setPos({ x: nx, y: ny })
    }
    const onUp = () => { setIsDragging(false); dragStart.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [isDragging])

  const style = {
    transform: `translate(${pos.x}px, ${pos.y}px)`,
    cursor: isDragging ? 'grabbing' : undefined,
  }

  return { ref, pos, style, onMouseDown, isDragging }
}
