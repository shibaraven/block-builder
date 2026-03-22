import type {
  MiddlewareData, CacheData, EmailData, JobData,
  WebSocketData, FileUploadData, AuthGuardData, JwtData,
  RolesData, StoreData, ChartData, CardData,
  NavigationData, SearchBarData, NotificationData, PaginationData,
} from '@block-builder/types'

export function generateMiddleware(data: MiddlewareData): string {
  const opts = Object.entries(data.options).map(([k, v]) => `  ${k}: ${v}`).join(',\n')
  if (data.type === 'cors') return `import cors from '@hono/cors'\n\nexport const corsMiddleware = cors({\n${opts}\n})\n`
  if (data.type === 'rate-limit') return `import { rateLimiter } from 'hono-rate-limiter'\n\nexport const rateLimitMiddleware = rateLimiter({\n  windowMs: 15 * 60 * 1000,\n  limit: 100,\n})\n`
  if (data.type === 'helmet') return `import { secureHeaders } from 'hono/secure-headers'\n\nexport const helmetMiddleware = secureHeaders()\n`
  return `// Custom middleware: ${data.name}\nexport const ${lcFirst(data.name)} = async (c: any, next: any) => {\n  // TODO: implement\n  await next()\n}\n`
}

export function generateCache(data: CacheData): string {
  if (data.store === 'redis') {
    return `import { createClient } from 'redis'\n\nconst redis = createClient({ url: process.env.REDIS_URL })\nawait redis.connect()\n\nexport const ${lcFirst(data.name)} = {\n  async get<T>(key: string): Promise<T | null> {\n    const val = await redis.get(\`${data.keyPrefix}\${key}\`)\n    return val ? JSON.parse(val) : null\n  },\n  async set(key: string, value: unknown, ttl = ${data.ttl}): Promise<void> {\n    await redis.setEx(\`${data.keyPrefix}\${key}\`, ttl, JSON.stringify(value))\n  },\n  async del(key: string): Promise<void> {\n    await redis.del(\`${data.keyPrefix}\${key}\`)\n  },\n}\n`
  }
  return `const store = new Map<string, { value: unknown; expires: number }>()\n\nexport const ${lcFirst(data.name)} = {\n  get<T>(key: string): T | null {\n    const item = store.get(key)\n    if (!item || Date.now() > item.expires) return null\n    return item.value as T\n  },\n  set(key: string, value: unknown, ttl = ${data.ttl}): void {\n    store.set(key, { value, expires: Date.now() + ttl * 1000 })\n  },\n  del(key: string): void { store.delete(key) },\n}\n`
}

export function generateEmail(data: EmailData): string {
  const templates = data.templates.map(t =>
    `  async send${cap(t.name.replace(/-./g, m => m[1].toUpperCase()))}(to: string, vars: Record<string, string>) {\n    return this.send(to, '${t.subject}', '${t.name}', vars)\n  }`
  ).join('\n\n')

  if (data.provider === 'resend') {
    return `import { Resend } from 'resend'\n\nconst resend = new Resend(process.env.RESEND_API_KEY)\n\nexport class ${data.name} {\n  private async send(to: string, subject: string, template: string, vars: Record<string, string>) {\n    return resend.emails.send({\n      from: process.env.EMAIL_FROM ?? 'noreply@example.com',\n      to,\n      subject,\n      html: \`<p>Template: \${template}</p>\`,\n    })\n  }\n\n${templates}\n}\n\nexport const emailService = new ${data.name}()\n`
  }
  return `import nodemailer from 'nodemailer'\n\nconst transporter = nodemailer.createTransport({\n  host: process.env.SMTP_HOST,\n  port: Number(process.env.SMTP_PORT ?? 587),\n  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },\n})\n\nexport class ${data.name} {\n  private async send(to: string, subject: string, template: string, vars: Record<string, string>) {\n    return transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html: JSON.stringify(vars) })\n  }\n\n${templates}\n}\n\nexport const emailService = new ${data.name}()\n`
}

export function generateJob(data: JobData): string {
  if (data.type === 'cron') {
    return `import cron from 'node-cron'\n\n/**\n * Cron job: ${data.name}\n * Schedule: ${data.schedule}\n */\nexport function register${data.name}() {\n  cron.schedule('${data.schedule}', async () => {\n    console.log('[${data.name}] Running...')\n    try {\n      // TODO: implement job logic\n    } catch (err) {\n      console.error('[${data.name}] Failed:', err)\n    }\n  })\n}\n`
  }
  return `import { Queue, Worker } from 'bullmq'\nimport { redis } from '../cache'\n\nexport const ${lcFirst(data.name)}Queue = new Queue('${lcFirst(data.name)}', { connection: redis })\n\nexport const ${lcFirst(data.name)}Worker = new Worker(\n  '${lcFirst(data.name)}',\n  async (job) => {\n    console.log('[${data.name}] Processing job:', job.id)\n    // TODO: implement\n  },\n  { connection: redis }\n)\n`
}

export function generateWebSocket(data: WebSocketData): string {
  if (data.framework === 'nestjs-gateway') {
    const handlers = data.events.filter(e => e.direction !== 'out').map(e =>
      `  @SubscribeMessage('${e.name}')\n  handle${cap(e.name.replace(/-./g, m => m[1].toUpperCase()))}(@ConnectedSocket() client: Socket, @MessageBody() payload: ${e.payload}) {\n    // TODO: implement\n    this.server.emit('${e.name}', payload)\n  }`
    ).join('\n\n')
    return `import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets'\nimport { Server, Socket } from 'socket.io'\n\n@WebSocketGateway({ namespace: '${data.namespace}', cors: { origin: '*' } })\nexport class ${data.name} {\n  @WebSocketServer() server: Server\n\n  handleConnection(client: Socket) {\n    console.log('[${data.name}] Client connected:', client.id)\n  }\n\n  handleDisconnect(client: Socket) {\n    console.log('[${data.name}] Client disconnected:', client.id)\n  }\n\n${handlers}\n}\n`
  }
  return `import { Server } from 'socket.io'\n\nexport function setup${data.name}(io: Server) {\n  const ns = io.of('${data.namespace}')\n  ns.on('connection', (socket) => {\n    console.log('Client connected:', socket.id)\n${data.events.filter(e => e.direction !== 'out').map(e => `    socket.on('${e.name}', (payload: ${e.payload}) => {\n      // TODO: handle ${e.name}\n      ns.emit('${e.name}', payload)\n    })`).join('\n')}\n  })\n}\n`
}

export function generateAuthGuard(data: AuthGuardData): string {
  if (data.framework === 'nestjs') {
    return `import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'\nimport { JwtService } from '@nestjs/jwt'\nimport { Request } from 'express'\n\n@Injectable()\nexport class ${data.name} implements CanActivate {\n  constructor(private jwtService: JwtService) {}\n\n  async canActivate(context: ExecutionContext): Promise<boolean> {\n    const request = context.switchToHttp().getRequest<Request>()\n    const token = this.extractToken(request)\n    if (!token) throw new UnauthorizedException()\n    try {\n      const payload = await this.jwtService.verifyAsync(token)\n      request['user'] = payload\n      return true\n    } catch {\n      throw new UnauthorizedException()\n    }\n  }\n\n  private extractToken(request: Request): string | null {\n    const [type, token] = request.headers.authorization?.split(' ') ?? []\n    return type === 'Bearer' ? token : null\n  }\n}\n`
  }
  return `import type { Context, Next } from 'hono'\nimport { verify } from 'hono/jwt'\n\nexport async function ${lcFirst(data.name)}(c: Context, next: Next) {\n  const auth = c.req.header('Authorization')\n  if (!auth?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)\n  try {\n    const payload = await verify(auth.slice(7), process.env.JWT_SECRET!)\n    c.set('user', payload)\n    await next()\n  } catch {\n    return c.json({ error: 'Invalid token' }, 401)\n  }\n}\n`
}

export function generateJwt(data: JwtData): string {
  const payload = data.payload.map(f => `  ${f.name}: ${f.type}`).join('\n')
  return `import { SignJWT, jwtVerify } from 'jose'\n\nexport interface JwtPayload {\n${payload}\n}\n\nconst secret = new TextEncoder().encode(process.env.JWT_SECRET)\n\nexport async function signToken(payload: JwtPayload): Promise<string> {\n  return new SignJWT(payload as any)\n    .setProtectedHeader({ alg: 'HS256' })\n    .setExpirationTime('${data.expiresIn}')\n    .sign(secret)\n}\n\nexport async function verifyToken(token: string): Promise<JwtPayload> {\n  const { payload } = await jwtVerify(token, secret)\n  return payload as unknown as JwtPayload\n}\n${data.refreshToken ? `\nexport async function signRefreshToken(payload: JwtPayload): Promise<string> {\n  return new SignJWT(payload as any)\n    .setProtectedHeader({ alg: 'HS256' })\n    .setExpirationTime('30d')\n    .sign(secret)\n}\n` : ''}`
}

export function generateStore(data: StoreData): string {
  if (data.lib === 'zustand') {
    const stateTypes = data.state.map(f => `  ${f.name}${f.optional ? '?' : ''}: ${f.type}`).join('\n')
    const actionTypes = data.actions.map(a => `  ${a.name}: (value: any) => void`).join('\n')
    const actionImpls = data.actions.map(a => `    ${a.name}: (value) => set({ ${a.name.replace(/^set/, '').toLowerCase()}: value } as any),`).join('\n')
    return `import { create } from 'zustand'\nimport { devtools } from 'zustand/middleware'\n\ninterface ${data.name.replace('use', '')}State {\n${stateTypes}\n${actionTypes}\n}\n\nexport const ${data.name} = create<${data.name.replace('use', '')}State>()(devtools((set) => ({\n  ${data.state.map(f => `${f.name}: ${defaultVal(f.type)}`).join(',\n  ')},\n\n${actionImpls}\n}), { name: '${data.name}' }))\n`
  }
  return `// Pinia store: ${data.name}\nimport { defineStore } from 'pinia'\n\nexport const ${data.name} = defineStore('${data.name}', {\n  state: () => ({\n    ${data.state.map(f => `${f.name}: ${defaultVal(f.type)}`).join(',\n    ')}\n  }),\n  actions: {\n${data.actions.map(a => `    ${a.name}(value: any) {\n      // ${a.description}\n    }`).join(',\n')}\n  },\n})\n`
}

export function generateChart(data: ChartData): string {
  return `import React from 'react'\nimport { ${cap(data.chartType)}Chart, ${cap(data.chartType === 'line' ? 'Line' : data.chartType === 'bar' ? 'Bar' : 'Area')}, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'\nimport type { ${data.dataType} } from '../types'\n\ninterface ${data.componentName}Props {\n  data: ${data.dataType}[]\n  loading?: boolean\n}\n\nexport function ${data.componentName}({ data, loading }: ${data.componentName}Props) {\n  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>\n\n  return (\n    <ResponsiveContainer width="100%" height={320}>\n      <${cap(data.chartType)}Chart data={data}>\n        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />\n        <XAxis dataKey="${data.xKey}" tick={{ fontSize: 12 }} />\n        <YAxis tick={{ fontSize: 12 }} />\n        <Tooltip />\n        <Legend />\n        <${data.chartType === 'line' ? 'Line' : data.chartType === 'bar' ? 'Bar' : 'Area'} type="monotone" dataKey="${data.yKey}" stroke="#378ADD" fill="#B5D4F4" />\n      </${cap(data.chartType)}Chart>\n    </ResponsiveContainer>\n  )\n}\n`
}

export function generateCard(data: CardData): string {
  const fields = data.fields.map(f =>
    `        <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">\n          <span className="text-sm text-gray-500">${f.label}</span>\n          <span className="text-sm font-medium">{String(item.${f.key} ?? '—')}</span>\n        </div>`
  ).join('\n')
  const actions = data.actions.map(a =>
    `          <button className="px-4 py-2 text-sm rounded-lg border ${a.variant === 'danger' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-gray-200 hover:bg-gray-50'} transition-colors">${a.label}</button>`
  ).join('\n')

  return `import React from 'react'\nimport type { ${data.dataType} } from '../types'\n\ninterface ${data.componentName}Props {\n  item: ${data.dataType}\n  onEdit?: (item: ${data.dataType}) => void\n  onDelete?: (item: ${data.dataType}) => void\n}\n\nexport function ${data.componentName}({ item, onEdit, onDelete }: ${data.componentName}Props) {\n  return (\n    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-1">\n${fields}\n      <div className="flex justify-end gap-2 pt-3">\n${actions}\n      </div>\n    </div>\n  )\n}\n`
}

export function generateNavigation(data: NavigationData): string {
  if (data.type === 'navbar') {
    return `import React from 'react'\nimport { Link, useLocation } from 'react-router-dom'\n\nexport function ${data.componentName}() {\n  const location = useLocation()\n\n  return (\n    <nav className="flex items-center gap-1 px-4 h-14 bg-white border-b border-gray-200">\n      <div className="font-semibold text-gray-900 mr-6">App</div>\n      <div className="flex items-center gap-1 flex-1">\n        ${data.items.map(item => `<Link\n          to="${item.path}"\n          className={\`px-3 py-2 text-sm rounded-lg transition-colors \${location.pathname === '${item.path}' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}\`}\n        >\n          ${item.label}\n        </Link>`).join('\n        ')}\n      </div>\n      ${data.auth ? `{/* Auth status */}\n      <div className="text-sm text-gray-500">Account</div>` : ''}\n    </nav>\n  )\n}\n`
  }
  return `import React from 'react'\nimport { Link, useLocation } from 'react-router-dom'\n\nexport function ${data.componentName}() {\n  const location = useLocation()\n\n  return (\n    <aside className="w-56 h-full bg-white border-r border-gray-200 p-3 space-y-1">\n      ${data.items.map(item => `<Link\n        to="${item.path}"\n        className={\`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors \${location.pathname === '${item.path}' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}\`}\n      >\n        ${item.label}\n      </Link>`).join('\n      ')}\n    </aside>\n  )\n}\n`
}

export function generateSearchBar(data: SearchBarData): string {
  if (data.searchType === 'remote') {
    return `import React, { useState, useEffect } from 'react'\nimport { Search } from 'lucide-react'\nimport type { ${data.resultType} } from '../types'\n\nexport function ${data.componentName}({ onSelect }: { onSelect?: (item: ${data.resultType}) => void }) {\n  const [query, setQuery] = useState('')\n  const [results, setResults] = useState<${data.resultType}[]>([])\n  const [loading, setLoading] = useState(false)\n\n  useEffect(() => {\n    if (!query.trim()) { setResults([]); return }\n    const timer = setTimeout(async () => {\n      setLoading(true)\n      try {\n        const res = await fetch(\`${data.endpoint}?q=\${encodeURIComponent(query)}\`)\n        const json = await res.json()\n        setResults(json.data ?? [])\n      } finally {\n        setLoading(false)\n      }\n    }, ${data.debounce})\n    return () => clearTimeout(timer)\n  }, [query])\n\n  return (\n    <div className="relative">\n      <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg">\n        <Search size={14} className="text-gray-400" />\n        <input\n          type="text"\n          value={query}\n          onChange={(e) => setQuery(e.target.value)}\n          placeholder="${data.placeholder}"\n          className="flex-1 text-sm outline-none"\n        />\n        {loading && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}\n      </div>\n      {results.length > 0 && (\n        <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">\n          {results.map((item: any, i) => (\n            <button\n              key={i}\n              onClick={() => onSelect?.(item)}\n              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"\n            >\n              {item.name ?? item.title ?? JSON.stringify(item)}\n            </button>\n          ))}\n        </div>\n      )}\n    </div>\n  )\n}\n`
  }
  return `import React, { useState } from 'react'\nimport { Search } from 'lucide-react'\n\nexport function ${data.componentName}({ items, onFilter }: { items: any[]; onFilter: (filtered: any[]) => void }) {\n  const [query, setQuery] = useState('')\n\n  const handleChange = (q: string) => {\n    setQuery(q)\n    onFilter(items.filter(item => JSON.stringify(item).toLowerCase().includes(q.toLowerCase())))\n  }\n\n  return (\n    <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg">\n      <Search size={14} className="text-gray-400" />\n      <input\n        type="text"\n        value={query}\n        onChange={(e) => handleChange(e.target.value)}\n        placeholder="${data.placeholder}"\n        className="flex-1 text-sm outline-none"\n      />\n    </div>\n  )\n}\n`
}

export function generateNotification(data: NotificationData): string {
  if (data.lib === 'sonner') {
    return `import { Toaster, toast } from 'sonner'\n\nexport function ${data.componentName}() {\n  return <Toaster position="${data.position}" richColors closeButton />\n}\n\nexport const notify = {\n  success: (msg: string) => toast.success(msg),\n  error: (msg: string) => toast.error(msg),\n  warning: (msg: string) => toast.warning(msg),\n  info: (msg: string) => toast.info(msg),\n  loading: (msg: string) => toast.loading(msg),\n  dismiss: (id?: string | number) => toast.dismiss(id),\n}\n`
  }
  return `import { Toaster, toast } from 'react-hot-toast'\n\nexport function ${data.componentName}() {\n  return <Toaster position="${data.position}" />\n}\n\nexport const notify = {\n  success: (msg: string) => toast.success(msg),\n  error: (msg: string) => toast.error(msg),\n  info: (msg: string) => toast(msg),\n}\n`
}

export function generatePagination(data: PaginationData): string {
  if (data.type === 'offset') {
    return `export interface PaginationParams {\n  page: number\n  limit: number\n  ${data.sortable ? 'sortBy?: string\n  sortOrder?: \'asc\' | \'desc\'' : ''}\n}\n\nexport interface PaginatedResult<T> {\n  data: T[]\n  meta: {\n    total: number\n    page: number\n    limit: number\n    totalPages: number\n    hasNext: boolean\n    hasPrev: boolean\n  }\n}\n\nexport function parsePagination(query: Record<string, string>): PaginationParams {\n  const page = Math.max(1, Number(query.page ?? 1))\n  const limit = Math.min(${data.maxLimit}, Math.max(1, Number(query.limit ?? ${data.defaultLimit})))\n  return { page, limit${data.sortable ? ", sortBy: query.sortBy, sortOrder: (query.sortOrder as 'asc' | 'desc') ?? 'asc'" : ''} }\n}\n\nexport function buildPaginatedResult<T>(data: T[], total: number, params: PaginationParams): PaginatedResult<T> {\n  const totalPages = Math.ceil(total / params.limit)\n  return {\n    data,\n    meta: {\n      total,\n      page: params.page,\n      limit: params.limit,\n      totalPages,\n      hasNext: params.page < totalPages,\n      hasPrev: params.page > 1,\n    },\n  }\n}\n`
  }
  return `export interface CursorPaginationParams {\n  cursor?: string\n  limit: number\n}\n\nexport interface CursorPaginatedResult<T> {\n  data: T[]\n  nextCursor: string | null\n  hasMore: boolean\n}\n`
}

// ─── Helpers ──────────────────────────────────────────────────────
function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }
function lcFirst(s: string) { return s.charAt(0).toLowerCase() + s.slice(1) }
function defaultVal(type: string): string {
  if (type.endsWith('[]')) return '[]'
  if (type === 'boolean') return 'false'
  if (type === 'number') return '0'
  if (type.includes('null')) return 'null'
  return 'null'
}
