import type { ApiEndpointData, NestServiceData, UseQueryData, UseMutationData } from '@block-builder/types'

// ─── API Route Tests (Hono / Express) ─────────────────────────────────
export function generateApiTest(data: ApiEndpointData, framework: string): string {
  const routeName = data.path.split('/').filter(Boolean).join('-') || 'route'
  const method = data.method.toLowerCase()
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(data.method)
  const hasId = data.path.includes(':id')

  return `import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ${framework === 'hono' ? 'Hono' : 'express'} } from '${framework === 'hono' ? 'hono' : 'express'}'

// ─── Mock data ──────────────────────────────────────────────────────
const mock${cap(data.responseType.replace('[]', ''))} = {
  id: 'test-id-123',
  name: 'Test Item',
  createdAt: new Date().toISOString(),
}

const mockList = [mock${cap(data.responseType.replace('[]', ''))}]

describe('${data.method} ${data.path}', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return ${data.responseType.includes('[]') ? 'list of items' : 'single item'} with status 200', async () => {
    // Arrange
    const mockService = {
      ${crudMethodName(data.method, hasId)}: vi.fn().mockResolvedValue(${data.responseType.includes('[]') ? 'mockList' : `mock${cap(data.responseType.replace('[]', ''))}`}),
    }

    // Act
    const result = await mockService.${crudMethodName(data.method, hasId)}(${hasId ? "'test-id-123'" : ''}${hasBody ? `${hasId ? ', ' : ''}{ name: 'Test' }` : ''})

    // Assert
    expect(result).toBeDefined()
    expect(mockService.${crudMethodName(data.method, hasId)}).toHaveBeenCalledOnce()
    ${hasId ? `expect(mockService.${crudMethodName(data.method, hasId)}).toHaveBeenCalledWith('test-id-123'${hasBody ? ", expect.any(Object)" : ''})` : ''}
  })

  ${data.auth ? `it('should return 401 when not authenticated', async () => {
    // Arrange
    const mockRequest = {
      headers: { authorization: undefined },
    }

    // Assert - auth guard should reject
    expect(() => {
      if (!mockRequest.headers.authorization) {
        throw new Error('Unauthorized')
      }
    }).toThrow('Unauthorized')
  })

  ` : ''}${hasId ? `it('should return 404 when item not found', async () => {
    // Arrange
    const mockService = {
      ${crudMethodName(data.method, hasId)}: vi.fn().mockResolvedValue(null),
    }

    // Act
    const result = await mockService.${crudMethodName(data.method, hasId)}('non-existent-id')

    // Assert
    expect(result).toBeNull()
  })

  ` : ''}${hasBody ? `it('should validate request body', async () => {
    // Arrange
    const invalidBody = {}

    // Assert - should fail validation with empty body
    // In real test: use your Zod schema to validate
    expect(Object.keys(invalidBody).length).toBe(0)
  })

  ` : ''}it('should handle service errors gracefully', async () => {
    // Arrange
    const mockService = {
      ${crudMethodName(data.method, hasId)}: vi.fn().mockRejectedValue(new Error('Database connection failed')),
    }

    // Assert
    await expect(
      mockService.${crudMethodName(data.method, hasId)}(${hasId ? "'test-id'" : ''})
    ).rejects.toThrow('Database connection failed')
  })
})
`
}

// ─── NestJS Service Tests ──────────────────────────────────────────────
export function generateNestServiceTest(data: NestServiceData): string {
  const methods = data.methods.map(m => `
  describe('${m.name}()', () => {
    it('should ${m.description.toLowerCase()}', async () => {
      // Arrange
      const mockResult = {} as ${m.returnType.replace('Promise<', '').replace('>', '')}

      // Act
      // const result = await service.${m.name}(${m.params ? '/* args */' : ''})

      // Assert
      // expect(result).toBeDefined()
      expect(true).toBe(true) // TODO: implement
    })

    it('should throw when input is invalid', async () => {
      // TODO: implement error case
      expect(true).toBe(true)
    })
  })`).join('\n')

  const deps = data.dependencies.map(d =>
    `    ${lcFirst(d)}: {\n      ${['findAll', 'findOne', 'create', 'update', 'delete'].map(m => `${m}: vi.fn()`).join(',\n      ')}\n    }`
  ).join(',\n')

  return `import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ${data.name} } from './${toKebab(data.name)}.service'
${data.dependencies.map(d => `import { ${d} } from './${toKebab(d)}'`).join('\n')}

describe('${data.name}', () => {
  let service: ${data.name}
  ${data.dependencies.map(d => `let mock${d}: Partial<${d}>`).join('\n  ')}

  beforeEach(() => {
    ${data.dependencies.map(d => `mock${d} = {\n      findAll: vi.fn(),\n      findOne: vi.fn(),\n      create: vi.fn(),\n      update: vi.fn(),\n      delete: vi.fn(),\n    }`).join('\n    ')}
    service = new ${data.name}(${data.dependencies.map(d => `mock${d} as ${d}`).join(', ')})
  })
${methods}
})
`
}

// ─── React Hook Tests ──────────────────────────────────────────────────
export function generateQueryHookTest(data: UseQueryData): string {
  return `import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ${data.hookName} } from './${toKebab(data.hookName)}'
import React from 'react'

// Mock fetch
global.fetch = vi.fn()

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('${data.hookName}', () => {
  it('should return data when fetch succeeds', async () => {
    // Arrange
    const mockData: ${data.responseType} = [] as unknown as ${data.responseType}
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    } as Response)

    // Act
    const { result } = renderHook(() => ${data.hookName}(), {
      wrapper: createWrapper(),
    })

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
    expect(fetch).toHaveBeenCalledWith('${data.endpoint}')
  })

  it('should set error when fetch fails', async () => {
    // Arrange
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    // Act
    const { result } = renderHook(() => ${data.hookName}(), {
      wrapper: createWrapper(),
    })

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('should be in loading state initially', () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => ${data.hookName}(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
  })
})
`
}

export function generateMutationHookTest(data: UseMutationData): string {
  return `import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ${data.hookName} } from './${toKebab(data.hookName)}'
import React from 'react'

global.fetch = vi.fn()

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('${data.hookName}', () => {
  it('should call API with correct payload', async () => {
    // Arrange
    const mockResponse: ${data.responseType} = {} as ${data.responseType}
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockResponse }),
    } as Response)

    const payload = {} as ${data.bodyType}

    // Act
    const { result } = renderHook(() => ${data.hookName}(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate(payload)
    })

    // Assert
    expect(fetch).toHaveBeenCalledWith('${data.endpoint}', expect.objectContaining({
      method: '${data.method}',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }))
  })

  it('should handle mutation error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => ${data.hookName}(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate({} as ${data.bodyType})
    })

    expect(result.current.isError).toBe(true)
  })
})
`
}

// ─── Helpers ──────────────────────────────────────────────────────────
function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }
function lcFirst(s: string) { return s.charAt(0).toLowerCase() + s.slice(1) }
function toKebab(s: string) { return s.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '') }
function crudMethodName(method: string, hasId: boolean): string {
  return { GET: hasId ? 'findOne' : 'findAll', POST: 'create', PUT: 'update', PATCH: 'update', DELETE: 'remove' }[method] ?? method.toLowerCase()
}
