import { drizzle as pgDrizzle }     from 'drizzle-orm/postgres-js'
import { drizzle as mysqlDrizzle }  from 'drizzle-orm/mysql2'
import { drizzle as libsqlDrizzle } from 'drizzle-orm/libsql'
import { createClient }              from '@libsql/client'
import postgres                      from 'postgres'
import mysql                         from 'mysql2/promise'
import {
  pgUsers, pgProjects, pgSessions,
  myUsers, myProjects, mySessions,
  sqliteUsers, sqliteProjects, sqliteSessions,
} from './schema'

export type DbType = 'postgres' | 'mysql' | 'sqlite'

let _db: any = null
let _dbType: DbType = 'sqlite'

export function getDbType(): DbType {
  const t = process.env.DB_TYPE as DbType
  return ['postgres', 'mysql', 'sqlite'].includes(t) ? t : 'sqlite'
}

export async function getDb() {
  if (_db) return _db
  _dbType = getDbType()

  if (_dbType === 'postgres') {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is required for postgres')
    const client = postgres(url)
    _db = pgDrizzle(client, {
      schema: { users: pgUsers, projects: pgProjects, sessions: pgSessions },
    })
    console.log('🐘 Connected to PostgreSQL')

  } else if (_dbType === 'mysql') {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is required for mysql')
    const client = await mysql.createPool(url)
    _db = mysqlDrizzle(client, {
      schema: { users: myUsers, projects: myProjects, sessions: mySessions },
      mode: 'default',
    })
    console.log('🐬 Connected to MySQL')

  } else {
    // SQLite via libsql — no native compilation needed
    const dbPath = process.env.SQLITE_PATH ?? './data/block-builder.db'
    const { mkdirSync } = await import('fs')
    mkdirSync('./data', { recursive: true })
    const client = createClient({ url: `file:${dbPath}` })
    _db = libsqlDrizzle(client, {
      schema: { users: sqliteUsers, projects: sqliteProjects, sessions: sqliteSessions },
    })
    console.log('🗃️  Connected to SQLite (libsql):', dbPath)
  }

  return _db
}

export function getSchema() {
  const t = getDbType()
  if (t === 'postgres') return { users: pgUsers, projects: pgProjects, sessions: pgSessions }
  if (t === 'mysql')    return { users: myUsers,  projects: myProjects,  sessions: mySessions }
  return { users: sqliteUsers, projects: sqliteProjects, sessions: sqliteSessions }
}
