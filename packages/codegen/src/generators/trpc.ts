import type { InterfaceData, ApiEndpointData } from '@block-builder/types'

// ─── tRPC Router ──────────────────────────────────────────────────────
export function generateTrpcRouter(
  iface: InterfaceData,
  endpoints: ApiEndpointData[]
): string {
  const resource = lcFirst(iface.name)
  const procedures = endpoints.map(ep => {
    const name = epToTrpcName(ep)
    const hasId = ep.path.includes(':id')
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(ep.method)
    const isQuery = ep.method === 'GET'

    const input = hasId && hasBody
      ? `z.object({ id: z.string(), data: ${iface.name}Schema.partial() })`
      : hasId ? `z.object({ id: z.string() })`
      : hasBody ? `${iface.name}Schema${ep.method === 'POST' ? '' : '.partial()'}`
      : null

    const procedureType = isQuery ? 'query' : 'mutation'
    const authMiddleware = ep.auth ? '.use(isAuthed)' : ''

    return `  ${name}: publicProcedure${authMiddleware}
    ${input ? `.input(${input})` : ''}
    .${procedureType}(async ({ input, ctx }) => {
      ${isQuery && hasId
        ? `return ctx.db.${resource}.findUnique({ where: { id: input.id } })`
        : isQuery
        ? `return ctx.db.${resource}.findMany()`
        : ep.method === 'POST'
        ? `return ctx.db.${resource}.create({ data: input })`
        : ep.method === 'DELETE'
        ? `return ctx.db.${resource}.delete({ where: { id: input.id } })`
        : `return ctx.db.${resource}.update({ where: { id: input.id }, data: input.data })`
      }
    })`
  }).join(',\n\n')

  const zodFields = iface.fields
    .filter(f => !['createdAt', 'updatedAt'].includes(f.name))
    .map(f => `  ${f.name}: ${tsToZod(f.type, f.optional)}`)
    .join(',\n')

  return `import { z } from 'zod'
import { router, publicProcedure, isAuthed } from '../trpc'

const ${iface.name}Schema = z.object({
${zodFields}
})

export const ${resource}Router = router({
${procedures}
})
`
}

// ─── tRPC App Router ──────────────────────────────────────────────────
export function generateTrpcAppRouter(routers: string[]): string {
  const imports = routers.map(r => `import { ${r}Router } from './${r}'`).join('\n')
  const routes = routers.map(r => `  ${r}: ${r}Router`).join(',\n')

  return `import { router } from './trpc'
${imports}

export const appRouter = router({
${routes}
})

export type AppRouter = typeof appRouter
`
}

// ─── tRPC base setup ──────────────────────────────────────────────────
export function generateTrpcBase(): string {
  return `import { initTRPC, TRPCError } from '@trpc/server'
import { ZodError } from 'zod'

interface Context {
  user?: { id: string; email: string }
  db: any // inject your Prisma/Drizzle client
}

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const router = t.router
export const publicProcedure = t.procedure

export const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return next({ ctx: { ...ctx, user: ctx.user } })
})
`
}

// ─── tRPC React client ────────────────────────────────────────────────
export function generateTrpcClient(): string {
  return `import { createTRPCReact } from '@trpc/react-query'
import { httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../server/routers/_app'

export const trpc = createTRPCReact<AppRouter>()

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      headers() {
        const token = localStorage.getItem('bb_token')
        return token ? { Authorization: \`Bearer \${token}\` } : {}
      },
    }),
  ],
})
`
}

// ─── Helpers ──────────────────────────────────────────────────────────
function epToTrpcName(ep: ApiEndpointData): string {
  const hasId = ep.path.includes(':id')
  const map: Record<string, string> = {
    GET: hasId ? 'getById' : 'list',
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete',
  }
  return map[ep.method] ?? ep.method.toLowerCase()
}

function tsToZod(type: string, optional = false): string {
  const base = type.replace('[]', '').replace('| null', '').replace('| undefined', '').trim()
  const map: Record<string, string> = {
    string: 'z.string()',
    number: 'z.number()',
    boolean: 'z.boolean()',
    Date: 'z.date()',
    any: 'z.any()',
    unknown: 'z.unknown()',
  }
  let zod = map[base] ?? `z.string()` // fallback
  if (type.endsWith('[]')) zod = `z.array(${map[base] ?? 'z.string()'})`
  if (optional || type.includes('| null') || type.includes('| undefined')) zod += '.optional()'
  return zod
}

function lcFirst(s: string) { return s.charAt(0).toLowerCase() + s.slice(1) }
