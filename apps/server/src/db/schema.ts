// ─── Drizzle schema — works with PostgreSQL, MySQL, SQLite ───────────
// We use a runtime-agnostic approach: column types are compatible across all three.
// Switch DB by changing DB_TYPE in .env: 'postgres' | 'mysql' | 'sqlite'

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { pgTable, varchar, jsonb, timestamp, boolean } from 'drizzle-orm/pg-core'
import { mysqlTable, varchar as myVarchar, json as myJson, datetime, tinyint } from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

// ─── PostgreSQL schema ─────────────────────────────────────────────
export const pgUsers = pgTable('users', {
  id:          varchar('id', { length: 36 }).primaryKey(),
  githubId:    varchar('github_id', { length: 50 }).unique(),
  email:       varchar('email', { length: 255 }).unique().notNull(),
  name:        varchar('name', { length: 255 }).notNull(),
  avatar:      varchar('avatar', { length: 500 }),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
})

export const pgProjects = pgTable('projects', {
  id:          varchar('id', { length: 36 }).primaryKey(),
  userId:      varchar('user_id', { length: 36 }).references(() => pgUsers.id, { onDelete: 'cascade' }),
  name:        varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 1000 }),
  canvas:      jsonb('canvas').notNull(),
  settings:    jsonb('settings').notNull(),
  isPublic:    boolean('is_public').default(false).notNull(),
  shareToken:  varchar('share_token', { length: 64 }).unique(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
})

export const pgSessions = pgTable('sessions', {
  id:        varchar('id', { length: 64 }).primaryKey(),
  userId:    varchar('user_id', { length: 36 }).references(() => pgUsers.id, { onDelete: 'cascade' }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── MySQL schema ──────────────────────────────────────────────────
export const myUsers = mysqlTable('users', {
  id:        myVarchar('id', { length: 36 }).primaryKey(),
  githubId:  myVarchar('github_id', { length: 50 }),
  email:     myVarchar('email', { length: 255 }).notNull(),
  name:      myVarchar('name', { length: 255 }).notNull(),
  avatar:    myVarchar('avatar', { length: 500 }),
  createdAt: datetime('created_at').default(sql`NOW()`).notNull(),
  updatedAt: datetime('updated_at').default(sql`NOW()`).notNull(),
})

export const myProjects = mysqlTable('projects', {
  id:          myVarchar('id', { length: 36 }).primaryKey(),
  userId:      myVarchar('user_id', { length: 36 }),
  name:        myVarchar('name', { length: 255 }).notNull(),
  description: myVarchar('description', { length: 1000 }),
  canvas:      myJson('canvas').notNull(),
  settings:    myJson('settings').notNull(),
  isPublic:    tinyint('is_public').default(0).notNull(),
  shareToken:  myVarchar('share_token', { length: 64 }),
  createdAt:   datetime('created_at').default(sql`NOW()`).notNull(),
  updatedAt:   datetime('updated_at').default(sql`NOW()`).notNull(),
})

export const mySessions = mysqlTable('sessions', {
  id:        myVarchar('id', { length: 64 }).primaryKey(),
  userId:    myVarchar('user_id', { length: 36 }).notNull(),
  expiresAt: datetime('expires_at').notNull(),
  createdAt: datetime('created_at').default(sql`NOW()`).notNull(),
})

// ─── SQLite schema (dev/fallback) ──────────────────────────────────
export const sqliteUsers = sqliteTable('users', {
  id:        text('id').primaryKey(),
  githubId:  text('github_id').unique(),
  email:     text('email').unique().notNull(),
  name:      text('name').notNull(),
  avatar:    text('avatar'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
})

export const sqliteProjects = sqliteTable('projects', {
  id:          text('id').primaryKey(),
  userId:      text('user_id').references(() => sqliteUsers.id),
  name:        text('name').notNull(),
  description: text('description'),
  canvas:      text('canvas', { mode: 'json' }).notNull(),
  settings:    text('settings', { mode: 'json' }).notNull(),
  isPublic:    integer('is_public', { mode: 'boolean' }).default(false).notNull(),
  shareToken:  text('share_token').unique(),
  createdAt:   text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt:   text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
})

export const sqliteSessions = sqliteTable('sessions', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').references(() => sqliteUsers.id).notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
})
