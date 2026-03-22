import { useEffect, useRef } from 'react'
import { useCanvasStore } from '../stores/canvasStore'
import { useDiffStore } from '../stores/diffStore'
import { generateFromCanvas } from '@block-builder/codegen'

const DEBOUNCE_MS = 800

export function useLiveCodegen() {
  const { nodes, edges, project, setGeneratedCode, setIsGenerating, generatedCode } = useCanvasStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevNodesLen = useRef(0)

  useEffect(() => {
    if (nodes.length === 0) return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      setIsGenerating(true)
      try {
        const code = await generateFromCanvas(
          { nodes, edges, viewport: { x: 0, y: 0, zoom: 1 } },
          project.settings
        )
        setGeneratedCode(code)
        if (code.files.length > 0 && !useCanvasStore.getState().activeOutputFile) {
          useCanvasStore.getState().setActiveOutputFile(code.files[0].path)
        }
      } catch (err) {
        console.error('[LiveCodegen]', err)
      } finally {
        setIsGenerating(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [nodes, edges])
}
