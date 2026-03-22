import type { ApiEndpointData } from '@block-builder/types'

type ApiFramework = 'nestjs' | 'hono' | 'express' | 'fastify' | 'graphql' | 'trpc'

// ─── Dispatcher ──────────────────────────────────────────────────────
export function generateApiRoute(data: ApiEndpointData, framework: ApiFramework): string {
  switch (framework) {
    case 'hono':
      return generateHonoRoute(data)
    case 'nestjs':
      return generateNestJsController(data)
    case 'express':
      return generateExpressRoute(data)
    default:
      return generateHonoRoute(data)
  }
}

// ─── Hono ────────────────────────────────────────────────────────────
function generateHonoRoute(data: ApiEndpointData): string {
  const method = data.method.toLowerCase()
  const bodyImport = data.bodyType ? `import { ${data.bodyType}Schema } from '../types'` : ''
  const bodyParse = data.bodyType
    ? `  const body = ${data.bodyType}Schema.parse(await c.req.json())\n`
    : ''
  const authMiddleware = data.auth
    ? `  const user = c.get('user') // set by auth middleware\n`
    : ''

  return `import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
${bodyImport}

const app = new Hono()

/**
 * ${data.summary || `${data.method} ${data.path}`}
 * @tags ${data.tags.join(', ') || 'general'}
 */
app.${method}('${data.path}', async (c) => {
${authMiddleware}${bodyParse}
  // TODO: implement logic
  const result: ${data.responseType} = [] as unknown as ${data.responseType}

  return c.json({ data: result, success: true })
})

export default app
`
}

// ─── NestJS ──────────────────────────────────────────────────────────
function generateNestJsController(data: ApiEndpointData): string {
  const methodDecorator = data.method.charAt(0) + data.method.slice(1).toLowerCase()
  const decorators: string[] = [methodDecorator]
  const params: string[] = []
  const classDecorators: string[] = ['Controller']
  const imports = new Set([
    'Controller',
    methodDecorator,
    'HttpCode',
    'HttpStatus',
  ])

  if (data.auth) {
    decorators.push("UseGuards(JwtAuthGuard)")
    imports.add('UseGuards')
  }
  if (data.bodyType) {
    params.push(`@Body() body: ${data.bodyType}`)
    imports.add('Body')
  }

  const controllerName = pathToControllerName(data.path)

  return `import { ${[...imports].join(', ')} } from '@nestjs/common'
${data.bodyType ? `import { ${data.bodyType} } from '../types'` : ''}
${data.auth ? `import { JwtAuthGuard } from '../auth/jwt-auth.guard'` : ''}

@Controller('${basePath(data.path)}')
export class ${controllerName}Controller {
  /**
   * ${data.summary || `${data.method} ${data.path}`}
   */
  @${methodDecorator}('${subPath(data.path)}')
  @HttpCode(HttpStatus.OK)
  ${data.auth ? '@UseGuards(JwtAuthGuard)\n  ' : ''}async handle(${params.join(', ')}): Promise<${data.responseType}> {
    // TODO: inject service and implement logic
    throw new Error('Not implemented')
  }
}
`
}

// ─── Express ─────────────────────────────────────────────────────────
function generateExpressRoute(data: ApiEndpointData): string {
  const method = data.method.toLowerCase()
  return `import { Router, Request, Response } from 'express'
${data.bodyType ? `import { ${data.bodyType}Schema } from '../types'` : ''}

const router = Router()

/**
 * ${data.summary || `${data.method} ${data.path}`}
 */
router.${method}('${data.path}', async (req: Request, res: Response) => {
  try {
    ${data.bodyType ? `const body = ${data.bodyType}Schema.parse(req.body)` : ''}
    // TODO: implement logic
    res.json({ data: null, success: true })
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', success: false })
  }
})

export default router
`
}

// ─── Helpers ─────────────────────────────────────────────────────────
function pathToControllerName(path: string): string {
  return path
    .split('/')
    .filter((s) => s && !s.startsWith(':'))
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

function basePath(path: string): string {
  return path.split('/').filter(Boolean)[0] ?? ''
}

function subPath(path: string): string {
  const parts = path.split('/').filter(Boolean)
  return parts.slice(1).join('/') || '/'
}

// ─── API Version wrapper ──────────────────────────────────────────────
export function generateVersionedRoute(data: ApiEndpointData, version: 'v1' | 'v2', framework: string): string {
  const base = generateApiRoute({ ...data, path: `/api/${version}${data.path}` }, framework as any)
  const deprecated = version === 'v1'
    ? `\n// @deprecated Use /api/v2${data.path} instead\n` : ''
  return deprecated + base
}

// ─── Global error handler ─────────────────────────────────────────────
export function generateGlobalErrorHandler(framework: string): string {
  if (framework === 'nestjs') {
    return `import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Internal server error'

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'object' ? (message as any).message : message,
    })
  }
}

// ─── ApiResponse wrapper ──────────────────────────────────────────────
export class ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  statusCode: number

  static ok<T>(data: T, message?: string): ApiResponse<T> {
    return { success: true, data, message, statusCode: 200 }
  }

  static error(message: string, statusCode = 400): ApiResponse<never> {
    return { success: false, message, statusCode }
  }
}
`
  }

  // Hono
  return `import type { Context, Next } from 'hono'

export async function errorHandler(err: Error, c: Context) {
  console.error('[Error]', err.message)
  return c.json({
    success: false,
    message: err.message ?? 'Internal server error',
    timestamp: new Date().toISOString(),
  }, 500)
}

export function apiResponse<T>(data: T, message?: string) {
  return { success: true, data, message, timestamp: new Date().toISOString() }
}

export function apiError(message: string, status = 400) {
  return { success: false, message, timestamp: new Date().toISOString() }
}

// HTTP status codes reference
export const HTTP_STATUS = {
  OK: 200, CREATED: 201, NO_CONTENT: 204,
  BAD_REQUEST: 400, UNAUTHORIZED: 401, FORBIDDEN: 403,
  NOT_FOUND: 404, CONFLICT: 409, UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429, SERVER_ERROR: 500,
} as const
`
}
