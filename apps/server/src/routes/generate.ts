import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const generateRoute = new Hono()

const generateSchema = z.object({
  canvasState: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
    viewport: z
      .object({ x: z.number(), y: z.number(), zoom: z.number() })
      .optional(),
  }),
  settings: z.object({
    framework: z.enum(['react', 'vue', 'svelte']).default('react'),
    apiFramework: z.enum(['nestjs', 'hono', 'express', 'fastify']).default('hono'),
    packageManager: z.enum(['npm', 'yarn', 'pnpm']).default('pnpm'),
    outputPath: z.string().default('./generated'),
  }),
})

generateRoute.post('/', zValidator('json', generateSchema), async (c) => {
  const { canvasState, settings } = c.req.valid('json')

  try {
    const { generateFromCanvas } = await import('@block-builder/codegen')
    const viewport = canvasState.viewport ?? { x: 0, y: 0, zoom: 1 }
    const code = await generateFromCanvas(
      { ...canvasState, viewport } as any,
      settings as any
    )
    return c.json({ success: true, data: code })
  } catch (err) {
    console.error('[generate] error:', err)
    return c.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      500
    )
  }
})

export { generateRoute }
