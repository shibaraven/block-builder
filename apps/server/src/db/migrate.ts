import { getDbType } from './connection'

async function runMigrations() {
  const dbType = getDbType()
  console.log(`Running migrations for: ${dbType}`)

  if (dbType === 'postgres') {
    const { migrate } = await import('drizzle-orm/postgres-js/migrator')
    const { getDb } = await import('./connection')
    const db = await getDb()
    await migrate(db, { migrationsFolder: './src/db/migrations/postgres' })

  } else if (dbType === 'mysql') {
    const { migrate } = await import('drizzle-orm/mysql2/migrator')
    const { getDb } = await import('./connection')
    const db = await getDb()
    await migrate(db, { migrationsFolder: './src/db/migrations/mysql' })

  } else {
    // SQLite via libsql — create tables directly
    const { createClient } = await import('@libsql/client')
    const { mkdirSync } = await import('fs')
    mkdirSync('./data', { recursive: true })
    const client = createClient({
      url: `file:${process.env.SQLITE_PATH ?? './data/block-builder.db'}`,
    })

    await client.executeMultiple(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        github_id TEXT UNIQUE,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        avatar TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        canvas TEXT NOT NULL,
        settings TEXT NOT NULL,
        is_public INTEGER DEFAULT 0 NOT NULL,
        share_token TEXT UNIQUE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    `)

    await client.close()
    console.log('✅ SQLite tables created via libsql')
  }

  console.log('✅ Migrations complete')
  process.exit(0)
}

runMigrations().catch(e => { console.error(e); process.exit(1) })
