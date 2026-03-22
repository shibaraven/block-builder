import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { getDb, getSchema } from '../db/connection'
import { eq, and, desc, or } from 'drizzle-orm'
import { authMiddleware, optionalAuth } from '../auth/github'

const projectsRoute = new Hono<{ Variables: { user: any } }>()

const projectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  canvas: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
    viewport: z.object({ x: z.number(), y: z.number(), zoom: z.number() }).optional(),
  }),
  settings: z.object({
    framework: z.string(),
    apiFramework: z.string(),
    packageManager: z.string(),
    outputPath: z.string().optional(),
  }),
  isPublic: z.boolean().optional(),
})

function newId() {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function shareToken() {
  return Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('')
}

// ─── List user's projects ─────────────────────────────────────────────
projectsRoute.get('/', authMiddleware, async (c) => {
  const user = c.get('user')
  const db = await getDb()
  const schema = getSchema()

  const projects = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.userId as any, user.id))
    .orderBy(desc(schema.projects.updatedAt as any))

  return c.json({ success: true, data: projects })
})

// ─── Get single project (auth or public) ─────────────────────────────
projectsRoute.get('/:id', optionalAuth, async (c) => {
  const user = c.get('user')
  const db = await getDb()
  const schema = getSchema()

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.id as any, c.req.param('id')))
    .limit(1)

  if (!project) return c.json({ success: false, error: 'Not found' }, 404)

  // Allow if owner or public
  if (!project.isPublic && project.userId !== user?.id) {
    return c.json({ success: false, error: 'Forbidden' }, 403)
  }

  return c.json({ success: true, data: project })
})

// ─── Get project by share token (public) ─────────────────────────────
projectsRoute.get('/share/:token', async (c) => {
  const db = await getDb()
  const schema = getSchema()

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.shareToken as any, c.req.param('token')))
    .limit(1)

  if (!project) return c.json({ success: false, error: 'Not found or expired' }, 404)

  return c.json({ success: true, data: project, readOnly: true })
})

// ─── Create project ───────────────────────────────────────────────────
projectsRoute.post('/', authMiddleware, zValidator('json', projectSchema), async (c) => {
  const user = c.get('user')
  const body = c.req.valid('json')
  const db = await getDb()
  const schema = getSchema()
  const now = new Date().toISOString()
  const id = newId()

  await db.insert(schema.projects).values({
    id,
    userId: user.id,
    name: body.name,
    description: body.description ?? '',
    canvas: body.canvas as any,
    settings: body.settings as any,
    isPublic: body.isPublic ?? false,
    shareToken: body.isPublic ? shareToken() : null,
    createdAt: now,
    updatedAt: now,
  } as any)

  const [created] = await db.select().from(schema.projects).where(eq(schema.projects.id as any, id)).limit(1)
  return c.json({ success: true, data: created }, 201)
})

// ─── Update project ───────────────────────────────────────────────────
projectsRoute.put('/:id', authMiddleware, zValidator('json', projectSchema.partial()), async (c) => {
  const user = c.get('user')
  const body = c.req.valid('json')
  const db = await getDb()
  const schema = getSchema()

  const [existing] = await db.select().from(schema.projects).where(
    and(eq(schema.projects.id as any, c.req.param('id')), eq(schema.projects.userId as any, user.id))
  ).limit(1)

  if (!existing) return c.json({ success: false, error: 'Not found' }, 404)

  const updates: any = { updatedAt: new Date().toISOString() }
  if (body.name !== undefined) updates.name = body.name
  if (body.description !== undefined) updates.description = body.description
  if (body.canvas !== undefined) updates.canvas = body.canvas
  if (body.settings !== undefined) updates.settings = body.settings
  if (body.isPublic !== undefined) {
    updates.isPublic = body.isPublic
    if (body.isPublic && !existing.shareToken) updates.shareToken = shareToken()
    if (!body.isPublic) updates.shareToken = null
  }

  await db.update(schema.projects).set(updates).where(eq(schema.projects.id as any, c.req.param('id')))
  const [updated] = await db.select().from(schema.projects).where(eq(schema.projects.id as any, c.req.param('id'))).limit(1)

  return c.json({ success: true, data: updated })
})

// ─── Delete project ───────────────────────────────────────────────────
projectsRoute.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const db = await getDb()
  const schema = getSchema()

  const [existing] = await db.select().from(schema.projects).where(
    and(eq(schema.projects.id as any, c.req.param('id')), eq(schema.projects.userId as any, user.id))
  ).limit(1)

  if (!existing) return c.json({ success: false, error: 'Not found' }, 404)

  await db.delete(schema.projects).where(eq(schema.projects.id as any, c.req.param('id')))
  return c.json({ success: true })
})

// ─── Generate share token ─────────────────────────────────────────────
projectsRoute.post('/:id/share', authMiddleware, async (c) => {
  const user = c.get('user')
  const db = await getDb()
  const schema = getSchema()

  const [project] = await db.select().from(schema.projects).where(
    and(eq(schema.projects.id as any, c.req.param('id')), eq(schema.projects.userId as any, user.id))
  ).limit(1)

  if (!project) return c.json({ success: false, error: 'Not found' }, 404)

  const token = shareToken()
  await db.update(schema.projects).set({ shareToken: token, isPublic: true, updatedAt: new Date().toISOString() } as any)
    .where(eq(schema.projects.id as any, c.req.param('id')))

  const shareUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/share/${token}`
  return c.json({ success: true, shareToken: token, shareUrl })
})

// ─── Revoke share ─────────────────────────────────────────────────────
projectsRoute.delete('/:id/share', authMiddleware, async (c) => {
  const user = c.get('user')
  const db = await getDb()
  const schema = getSchema()

  await db.update(schema.projects)
    .set({ shareToken: null, isPublic: false, updatedAt: new Date().toISOString() } as any)
    .where(and(eq(schema.projects.id as any, c.req.param('id')), eq(schema.projects.userId as any, user.id)))

  return c.json({ success: true })
})

// ─── Duplicate project ────────────────────────────────────────────────
projectsRoute.post('/:id/duplicate', authMiddleware, async (c) => {
  const user = c.get('user')
  const db = await getDb()
  const schema = getSchema()

  const [original] = await db.select().from(schema.projects).where(eq(schema.projects.id as any, c.req.param('id'))).limit(1)
  if (!original) return c.json({ success: false, error: 'Not found' }, 404)

  const now = new Date().toISOString()
  const id = newId()

  await db.insert(schema.projects).values({
    ...original,
    id,
    userId: user.id,
    name: `${original.name} (複製)`,
    isPublic: false,
    shareToken: null,
    createdAt: now,
    updatedAt: now,
  } as any)

  const [created] = await db.select().from(schema.projects).where(eq(schema.projects.id as any, id)).limit(1)
  return c.json({ success: true, data: created })
})

export { projectsRoute }
