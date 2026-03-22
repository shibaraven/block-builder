import { Hono } from 'hono'
import { getGithubAuthUrl, exchangeGithubCode, upsertUser, createSession, authMiddleware } from '../auth/github'
import { getDb, getSchema } from '../db/connection'
import { eq } from 'drizzle-orm'

const authRoute = new Hono<{ Variables: { user: any } }>()

// Redirect to GitHub OAuth
authRoute.get('/github', (c) => {
  return c.redirect(getGithubAuthUrl())
})

// GitHub OAuth callback
authRoute.get('/callback/github', async (c) => {
  const code = c.req.query('code')
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000'

  if (!code) {
    return c.redirect(`${frontendUrl}?auth_error=missing_code`)
  }

  const githubUser = await exchangeGithubCode(code)
  if (!githubUser) {
    return c.redirect(`${frontendUrl}?auth_error=oauth_failed`)
  }

  const { id: userId } = await upsertUser(githubUser)
  const token = await createSession(userId)

  // Set cookie + redirect to frontend with token
  c.header('Set-Cookie', `bb_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 86400}`)
  return c.redirect(`${frontendUrl}?auth_success=1&token=${token}`)
})

// Get current user
authRoute.get('/me', authMiddleware, (c) => {
  const user = c.get('user')
  return c.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    },
  })
})

// Logout
authRoute.post('/logout', (c) => {
  c.header('Set-Cookie', 'bb_token=; Path=/; HttpOnly; Max-Age=0')
  return c.json({ success: true })
})

export { authRoute }
