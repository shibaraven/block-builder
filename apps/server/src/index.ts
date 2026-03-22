import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { generateRoute } from './routes/generate'
import { projectsRoute } from './routes/projects'
import { authRoute } from './routes/auth'
import { getDb, getDbType } from './db/connection'

const app = new Hono()

// ── Middleware ─────────────────────────────────────────────────────────
app.use('*', logger())
app.use('*', cors({
  origin: [
    process.env.FRONTEND_URL ?? 'http://localhost:3000',
    'http://localhost:5173',
  ],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}))

// ── Routes ─────────────────────────────────────────────────────────────
app.route('/api/generate',  generateRoute)
app.route('/api/projects',  projectsRoute)
app.route('/auth',          authRoute)

// ── Health check ──────────────────────────────────────────────────────
app.get('/health', async (c) => {
  const dbType = getDbType()
  let dbStatus = 'unknown'
  try {
    await getDb()
    dbStatus = 'connected'
  } catch { dbStatus = 'error' }

  return c.json({
    status: 'ok',
    db: dbType,
    dbStatus,
    timestamp: new Date().toISOString(),
    version: '8.0.0',
  })
})

// ── DB init ────────────────────────────────────────────────────────────
async function start() {
  try {
    await getDb()
    // Run SQLite migrations automatically in dev
    if (getDbType() === 'sqlite') {
      // Auto-create tables via libsql (no native compilation needed)
      const { createClient } = await import('@libsql/client')
      const { mkdirSync } = await import('fs')
      mkdirSync('./data', { recursive: true })
      const client = createClient({
        url: `file:${process.env.SQLITE_PATH ?? './data/block-builder.db'}`,
      })
      await client.executeMultiple(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY, github_id TEXT UNIQUE, email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL, avatar TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL, description TEXT, canvas TEXT NOT NULL, settings TEXT NOT NULL,
          is_public INTEGER DEFAULT 0 NOT NULL, share_token TEXT UNIQUE,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
      `)
      await client.close()
    }
  } catch (e) {
    console.warn('[DB] Init error (non-fatal in dev):', (e as Error).message)
  }

  const PORT = Number(process.env.PORT ?? 3001)
  serve({ fetch: app.fetch, port: PORT }, () => {
    console.log(`\n🚀 Block Builder server v8.0`)
    console.log(`   http://localhost:${PORT}`)
    console.log(`   DB: ${getDbType()}`)
    console.log(`   Health: http://localhost:${PORT}/health\n`)
  })
}

start()
export default app
