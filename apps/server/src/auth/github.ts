import { SignJWT, jwtVerify } from 'jose'
import { getDb, getSchema } from '../db/connection'
import { eq, and, gt } from 'drizzle-orm'
import type { Context } from 'hono'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-in-production')
const SESSION_TTL_DAYS = 30

// ─── JWT ─────────────────────────────────────────────────────────────
export async function signToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .setIssuedAt()
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { sub: string }
  } catch {
    return null
  }
}

// ─── GitHub OAuth ─────────────────────────────────────────────────────
export function getGithubAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID ?? '',
    redirect_uri: process.env.GITHUB_CALLBACK_URL ?? 'http://localhost:3001/auth/callback/github',
    scope: 'user:email',
    state: Math.random().toString(36).slice(2),
  })
  return `https://github.com/login/oauth/authorize?${params}`
}

export async function exchangeGithubCode(code: string): Promise<{
  email: string; name: string; avatar: string; githubId: string
} | null> {
  try {
    // Exchange code for token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })
    const { access_token } = await tokenRes.json() as any
    if (!access_token) return null

    // Get user info
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${access_token}`, Accept: 'application/vnd.github.v3+json' },
    })
    const ghUser = await userRes.json() as any

    // Get primary email
    const emailRes = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const emails = await emailRes.json() as any[]
    const primary = emails.find(e => e.primary)?.email ?? ghUser.email ?? ''

    return {
      githubId: String(ghUser.id),
      email: primary,
      name: ghUser.name ?? ghUser.login,
      avatar: ghUser.avatar_url,
    }
  } catch (e) {
    console.error('[OAuth] GitHub exchange failed:', e)
    return null
  }
}

// ─── User upsert ──────────────────────────────────────────────────────
export async function upsertUser(data: {
  githubId: string; email: string; name: string; avatar: string
}): Promise<{ id: string }> {
  const db = await getDb()
  const schema = getSchema()
  const now = new Date().toISOString()
  const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2)}`

  // Try to find existing user
  const existing = await db.query.users?.findFirst({
    where: eq(schema.users.githubId, data.githubId),
  })

  if (existing) {
    await db.update(schema.users)
      .set({ name: data.name, avatar: data.avatar, updatedAt: now } as any)
      .where(eq(schema.users.id, existing.id))
    return { id: existing.id }
  }

  await db.insert(schema.users).values({
    id,
    githubId: data.githubId,
    email: data.email,
    name: data.name,
    avatar: data.avatar,
    createdAt: now,
    updatedAt: now,
  } as any)

  return { id }
}

// ─── Session management ───────────────────────────────────────────────
export async function createSession(userId: string): Promise<string> {
  const token = await signToken(userId)
  const db = await getDb()
  const schema = getSchema()
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400 * 1000).toISOString()

  await db.insert(schema.sessions).values({
    id: token.slice(-32),
    userId,
    expiresAt,
    createdAt: new Date().toISOString(),
  } as any)

  return token
}

export async function getUserFromToken(token: string): Promise<any | null> {
  const payload = await verifyToken(token)
  if (!payload?.sub) return null

  const db = await getDb()
  const schema = getSchema()

  return db.query.users?.findFirst({
    where: eq(schema.users.id, payload.sub),
  }) ?? null
}

// ─── Auth middleware ──────────────────────────────────────────────────
export async function authMiddleware(c: Context, next: () => Promise<void>) {
  const auth = c.req.header('Authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : c.req.raw.headers.get('cookie')?.match(/bb_token=([^;]+)/)?.[1]

  if (!token) {
    return c.json({ success: false, error: 'Unauthorized' }, 401)
  }

  const user = await getUserFromToken(token)
  if (!user) {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401)
  }

  c.set('user', user)
  await next()
}

// Optional auth — doesn't fail if no token, just sets user to null
export async function optionalAuth(c: Context, next: () => Promise<void>) {
  const auth = c.req.header('Authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null

  if (token) {
    const user = await getUserFromToken(token)
    c.set('user', user)
  } else {
    c.set('user', null)
  }
  await next()
}
