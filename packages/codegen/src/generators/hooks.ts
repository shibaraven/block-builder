import type { UseQueryData, UseMutationData } from '@block-builder/types'

// ─── useQuery Hook ───────────────────────────────────────────────────
export function generateQueryHook(data: UseQueryData): string {
  return `import { useQuery } from '@tanstack/react-query'
import type { ${data.responseType} } from '../types'

const QUERY_KEY = ['${data.hookName}'] as const

async function fetch${capitalize(data.hookName)}(): Promise<${data.responseType}> {
  const res = await fetch('${data.endpoint}')
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`)
  const json = await res.json()
  return json.data
}

export function ${data.hookName}() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetch${capitalize(data.hookName)},
    staleTime: ${data.staleTime},
    retry: ${data.retry},
  })
}

export { QUERY_KEY as ${camelToSnake(data.hookName).toUpperCase()}_KEY }
`
}

// ─── useMutation Hook ────────────────────────────────────────────────
export function generateMutationHook(data: UseMutationData): string {
  const invalidateLines = data.onSuccessInvalidate
    .map((k) => `      queryClient.invalidateQueries({ queryKey: ['${k}'] })`)
    .join('\n')

  return `import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ${data.bodyType}, ${data.responseType} } from '../types'

async function ${data.hookName}Fn(body: ${data.bodyType}): Promise<${data.responseType}> {
  const res = await fetch('${data.endpoint}', {
    method: '${data.method}',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`)
  const json = await res.json()
  return json.data
}

export function ${data.hookName}() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ${data.hookName}Fn,
    onSuccess: () => {
${invalidateLines}
    },
    onError: (error) => {
      console.error('[${data.hookName}] mutation failed:', error)
    },
  })
}
`
}

// ─── Helpers ─────────────────────────────────────────────────────────
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}
