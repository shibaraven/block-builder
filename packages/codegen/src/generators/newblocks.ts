import type { PageData, OAuthData, StripeData, InfiniteScrollData } from '@block-builder/types'

export function generatePageRoute(data: PageData): string {
  return `import React from 'react'
${data.protected ? "import { Navigate } from 'react-router-dom'\nimport { useAuth } from '../hooks/useAuth'" : ''}

export function ${data.name}() {
  ${data.protected ? `const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  ` : ''}
  return (
    <div>
      <h1>${data.title}</h1>
      {/* TODO: add page content */}
    </div>
  )
}
`
}

export function generateRouterConfig(pages: PageData[]): string {
  return `import { createBrowserRouter } from 'react-router-dom'
${pages.map(p => `import { ${p.name} } from './pages/${p.name}'`).join('\n')}

export const router = createBrowserRouter([
${pages.map(p => `  {
    path: '${p.path}',
    element: <${p.name} />,
  },`).join('\n')}
])
`
}

export function generateOAuth(data: OAuthData): string {
  const providerConfigs = data.providers.map(p => {
    const configs: Record<string, string> = {
      google: `  GOOGLE: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authorizationUrl: 'https://accounts.google.com/o/oauth2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: 'openid email profile',
  }`,
      github: `  GITHUB: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scope: 'user:email',
  }`,
      discord: `  DISCORD: {
    clientId: process.env.DISCORD_CLIENT_ID!,
    clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    authorizationUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    userInfoUrl: 'https://discord.com/api/users/@me',
    scope: 'identify email',
  }`,
    }
    return configs[p] ?? `  ${p.toUpperCase()}: { /* TODO: add ${p} config */ }`
  }).join(',\n')

  return `export const OAUTH_PROVIDERS = {
${providerConfigs}
}

export const CALLBACK_URL = process.env.APP_URL + '${data.callbackPath}'
export const SUCCESS_REDIRECT = '${data.successRedirect}'

export async function getOAuthUrl(provider: keyof typeof OAUTH_PROVIDERS): Promise<string> {
  const config = OAUTH_PROVIDERS[provider]
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: CALLBACK_URL + '/' + provider.toLowerCase(),
    scope: config.scope,
    response_type: 'code',
  })
  return \`\${config.authorizationUrl}?\${params}\`
}

export async function handleOAuthCallback(
  provider: keyof typeof OAUTH_PROVIDERS,
  code: string
): Promise<{ email: string; name: string; avatar?: string }> {
  const config = OAUTH_PROVIDERS[provider]

  // Exchange code for token
  const tokenRes = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: CALLBACK_URL + '/' + provider.toLowerCase(),
      grant_type: 'authorization_code',
    }),
  })
  const { access_token } = await tokenRes.json()

  // Get user info
  const userRes = await fetch(config.userInfoUrl, {
    headers: { Authorization: \`Bearer \${access_token}\` },
  })
  const user = await userRes.json()
  return { email: user.email, name: user.name || user.login, avatar: user.avatar_url || user.picture }
}
`
}

export function generateStripe(data: StripeData): string {
  return `import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

export const PRODUCTS = ${JSON.stringify(data.products, null, 2)} as const

export async function createCheckoutSession(
  priceId: string,
  customerId?: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: \`\${process.env.APP_URL}${data.successUrl}?session_id={CHECKOUT_SESSION_ID}\`,
    cancel_url: \`\${process.env.APP_URL}${data.cancelUrl}\`,
    ...(customerId ? { customer: customerId } : {}),
  })
  return session.url!
}

export async function handleWebhook(body: Buffer, signature: string) {
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      // TODO: fulfill the order
      console.log('Payment succeeded:', session.id)
      break
    }
    case 'payment_intent.payment_failed': {
      // TODO: handle failed payment
      break
    }
  }
}

// React component for checkout button
export const STRIPE_COMPONENT = \`
import React from 'react'

export function CheckoutButton({ priceId, label = 'Buy Now' }: { priceId: string; label?: string }) {
  const [loading, setLoading] = React.useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const { url } = await res.json()
      window.location.href = url
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Redirecting...' : label}
    </button>
  )
}
\`
`
}

export function generateInfiniteScroll(data: InfiniteScrollData): string {
  return `import { useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import type { ${data.responseType.replace('[]', '')} } from '../types'

interface Page {
  data: ${data.responseType}
  nextCursor: string | null
  hasMore: boolean
}

async function fetch${capitalize(data.hookName.replace('use', ''))}(cursor?: string): Promise<Page> {
  const params = new URLSearchParams({ limit: String(${data.pageSize}) })
  if (cursor) params.set('${data.cursorField}', cursor)
  const res = await fetch(\`${data.endpoint}?\${params}\`)
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`)
  return res.json()
}

export function ${data.hookName}() {
  const query = useInfiniteQuery({
    queryKey: ['${data.hookName}'],
    queryFn: ({ pageParam }) => fetch${capitalize(data.hookName.replace('use', ''))}(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })

  // Intersection Observer for auto-loading
  const observerRef = useRef<IntersectionObserver>()
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (query.isFetchingNextPage) return
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && query.hasNextPage) {
        query.fetchNextPage()
      }
    })
    if (node) observerRef.current.observe(node)
  }, [query.isFetchingNextPage, query.hasNextPage, query.fetchNextPage])

  const items = query.data?.pages.flatMap(p => p.data) ?? []

  return {
    ...query,
    items,
    loadMoreRef,
    isEmpty: !query.isLoading && items.length === 0,
  }
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }
`
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }
