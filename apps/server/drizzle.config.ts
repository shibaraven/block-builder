import type { Config } from 'drizzle-kit'

const dbType = (process.env.DB_TYPE ?? 'sqlite') as 'postgres' | 'mysql' | 'sqlite'

const configs: Record<string, Config> = {
  postgres: {
    schema: './src/db/schema.ts',
    out: './src/db/migrations/postgres',
    dialect: 'postgresql',
    dbCredentials: { url: process.env.DATABASE_URL! },
  },
  mysql: {
    schema: './src/db/schema.ts',
    out: './src/db/migrations/mysql',
    dialect: 'mysql',
    dbCredentials: { url: process.env.DATABASE_URL! },
  },
  sqlite: {
    schema: './src/db/schema.ts',
    out: './src/db/migrations/sqlite',
    dialect: 'sqlite',
    dbCredentials: { url: process.env.SQLITE_PATH ?? './data/block-builder.db' },
  },
}

export default configs[dbType]
