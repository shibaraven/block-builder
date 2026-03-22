import type { CanvasNode, CanvasEdge } from '@block-builder/types'

export interface QualityScore {
  maintainability: number
  security: number
  performance: number
  testCoverage: number
  overall: number
  issues: QualityIssue[]
  suggestions: string[]
}

export interface QualityIssue {
  dimension: 'maintainability' | 'security' | 'performance' | 'testCoverage'
  severity: 'error' | 'warning' | 'info'
  message: string
  nodeId?: string
  fix?: string
}

export function scoreCodeQuality(
  nodes: CanvasNode[],
  edges: CanvasEdge[]
): QualityScore {
  const issues: QualityIssue[] = []
  const suggestions: string[] = []

  // ── Maintainability ────────────────────────────────────────────────
  let maintainability = 100

  // Check naming conventions
  for (const node of nodes) {
    const d = node.data.blockData as any
    if (d.kind === 'interface' && d.name && !/^[A-Z]/.test(d.name)) {
      issues.push({ dimension: 'maintainability', severity: 'error',
        message: `Interface "${d.name}" 應以大寫字母開頭`, nodeId: node.id, fix: '將名稱改為 PascalCase' })
      maintainability -= 10
    }
    if (d.kind === 'api-endpoint' && d.path && !d.summary) {
      issues.push({ dimension: 'maintainability', severity: 'warning',
        message: `API ${d.method} ${d.path} 缺少說明（summary）`, nodeId: node.id })
      maintainability -= 3
    }
  }

  // Check for isolated nodes (no connections)
  const connectedIds = new Set(edges.flatMap(e => [e.source, e.target]))
  const isolatedNodes = nodes.filter(n =>
    !connectedIds.has(n.id) && nodes.length > 1 &&
    !['middleware', 'cache', 'email', 'job'].includes((n.data.blockData as any).kind)
  )
  if (isolatedNodes.length > 0) {
    issues.push({ dimension: 'maintainability', severity: 'info',
      message: `有 ${isolatedNodes.length} 個積木未連接到任何其他積木` })
    maintainability -= isolatedNodes.length * 2
  }

  // ── Security ───────────────────────────────────────────────────────
  let security = 100

  const apiNodes = nodes.filter(n => n.data.category === 'api' && (n.data.blockData as any).kind === 'api-endpoint')
  const hasAuth = nodes.some(n => n.data.category === 'auth')
  const hasMiddleware = nodes.some(n => (n.data.blockData as any).kind === 'middleware')

  // Check unprotected endpoints
  const unprotected = apiNodes.filter(n => !(n.data.blockData as any).auth)
  if (unprotected.length > 0 && hasAuth) {
    issues.push({ dimension: 'security', severity: 'warning',
      message: `${unprotected.length} 個 API 端點未啟用認證保護`,
      fix: '在端點屬性中開啟 JWT 驗證' })
    security -= unprotected.length * 5
  }

  if (!hasMiddleware && apiNodes.length > 2) {
    issues.push({ dimension: 'security', severity: 'warning',
      message: '缺少 Middleware 積木（建議加入 CORS + Rate Limiting）',
      fix: '從側欄拖入 Middleware 積木' })
    security -= 15
    suggestions.push('加入 Middleware 積木設定 CORS 和 Rate Limiting')
  }

  const hasJwt = nodes.some(n => (n.data.blockData as any).kind === 'jwt')
  if (!hasJwt && apiNodes.length > 0) {
    issues.push({ dimension: 'security', severity: 'info',
      message: '未設定 JWT 認證（如果 API 需要保護請加入 JWT Config 積木）' })
    security -= 5
  }

  // ── Performance ────────────────────────────────────────────────────
  let performance = 100

  const hasCache = nodes.some(n => (n.data.blockData as any).kind === 'cache')
  const getEndpoints = apiNodes.filter(n => (n.data.blockData as any).method === 'GET')

  if (!hasCache && getEndpoints.length > 2) {
    issues.push({ dimension: 'performance', severity: 'warning',
      message: `有 ${getEndpoints.length} 個 GET 端點但沒有快取層`,
      fix: '加入 Cache 積木（Redis）提升查詢效能' })
    performance -= 15
    suggestions.push('為頻繁查詢的 GET 端點加入 Redis 快取')
  }

  const queryHooks = nodes.filter(n => (n.data.blockData as any).kind === 'use-query')
  queryHooks.forEach(n => {
    const d = n.data.blockData as any
    if (!d.staleTime || d.staleTime === 0) {
      issues.push({ dimension: 'performance', severity: 'info',
        message: `${d.hookName} 的 staleTime 為 0，每次都會重新請求`, nodeId: n.id,
        fix: '設定適當的 staleTime（例如 300000ms = 5分鐘）' })
      performance -= 5
    }
  })

  // Check for pagination on list endpoints
  const listEndpoints = getEndpoints.filter(n => {
    const d = n.data.blockData as any
    return d.responseType?.includes('[]') && !d.path?.includes(':id')
  })
  const hasPagination = nodes.some(n => (n.data.blockData as any).kind === 'pagination')
  if (listEndpoints.length > 0 && !hasPagination) {
    issues.push({ dimension: 'performance', severity: 'warning',
      message: '列表 API 端點缺少分頁設計，大量資料時效能會下降',
      fix: '加入 Pagination 積木' })
    performance -= 10
    suggestions.push('為列表端點加入 Pagination 積木')
  }

  // ── Test Coverage ──────────────────────────────────────────────────
  let testCoverage = 100

  const testableNodes = nodes.filter(n =>
    ['api-endpoint', 'use-query', 'use-mutation', 'nest-service'].includes((n.data.blockData as any).kind)
  )

  if (testableNodes.length === 0 && nodes.length > 0) {
    testCoverage = 0
  } else {
    // Every API/hook/service should have a corresponding test
    testCoverage = testableNodes.length > 0 ? 85 : 100
  }

  if (nodes.length > 0 && testableNodes.length === 0) {
    issues.push({ dimension: 'testCoverage', severity: 'info',
      message: '沒有可測試的 API 端點或 Hook，無法生成測試' })
  }

  // Check for E2E tests
  if (apiNodes.length > 0) {
    suggestions.push('下載 ZIP 後執行 pnpm test 跑生成的 Vitest 測試')
  }

  // ── Overall score ──────────────────────────────────────────────────
  maintainability = Math.max(0, Math.min(100, maintainability))
  security = Math.max(0, Math.min(100, security))
  performance = Math.max(0, Math.min(100, performance))
  testCoverage = Math.max(0, Math.min(100, testCoverage))

  const overall = Math.round((maintainability + security + performance + testCoverage) / 4)

  return { maintainability, security, performance, testCoverage, overall, issues, suggestions }
}
