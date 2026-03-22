import type { CanvasNode, BlockCategory } from '@block-builder/types'
import { isValidConnection } from '@block-builder/types'

export interface SnapTarget {
  nodeId: string
  handleType: 'source' | 'target'
  position: { x: number; y: number }
  category: BlockCategory
  isValid: boolean
}

const SNAP_DISTANCE = 80 // pixels

// ─── Find nearest connectable handle ─────────────────────────────────
export function findSnapTarget(
  draggingNodeId: string,
  draggingPos: { x: number; y: number },
  nodes: CanvasNode[],
  draggingCategory: BlockCategory
): SnapTarget | null {
  let nearest: SnapTarget | null = null
  let minDist = SNAP_DISTANCE

  for (const node of nodes) {
    if (node.id === draggingNodeId) continue

    // Right handle (source → can be target for dragging node's output)
    const rightHandle = {
      x: node.position.x + 220, // approx node width
      y: node.position.y + 40,
    }
    // Left handle (target → dragging node's output connects here)
    const leftHandle = {
      x: node.position.x,
      y: node.position.y + 40,
    }

    const distRight = Math.hypot(draggingPos.x - rightHandle.x, draggingPos.y - rightHandle.y)
    const distLeft = Math.hypot(draggingPos.x - leftHandle.x, draggingPos.y - leftHandle.y)

    if (distLeft < minDist) {
      minDist = distLeft
      nearest = {
        nodeId: node.id,
        handleType: 'target',
        position: leftHandle,
        category: node.data.category,
        isValid: isValidConnection(draggingCategory, node.data.category),
      }
    }
    if (distRight < minDist) {
      minDist = distRight
      nearest = {
        nodeId: node.id,
        handleType: 'source',
        position: rightHandle,
        category: node.data.category,
        isValid: isValidConnection(node.data.category, draggingCategory),
      }
    }
  }

  return nearest
}

// ─── Suggested connections for a node ────────────────────────────────
export interface ConnectionSuggestion {
  fromCategory: BlockCategory
  toCategory: BlockCategory
  label: string
  blockDefId: string
  blockLabel: string
  reason: string
}

const SUGGESTION_MAP: Partial<Record<string, ConnectionSuggestion[]>> = {
  'interface': [
    { fromCategory: 'type', toCategory: 'api', label: '搭配 GET 端點', blockDefId: 'api-get', blockLabel: 'GET Endpoint', reason: '讓 API 知道回傳的型別' },
    { fromCategory: 'type', toCategory: 'api', label: '搭配 POST 端點', blockDefId: 'api-post', blockLabel: 'POST Endpoint', reason: '讓 POST 知道回傳型別' },
    { fromCategory: 'type', toCategory: 'api', label: '搭配 Repository', blockDefId: 'nest-repository', blockLabel: 'Repository', reason: '生成 Prisma CRUD 操作' },
  ],
  'dto': [
    { fromCategory: 'type', toCategory: 'api', label: '搭配 POST 端點', blockDefId: 'api-post', blockLabel: 'POST Endpoint', reason: 'DTO 作為 POST 的 Body 型別' },
    { fromCategory: 'type', toCategory: 'api', label: '搭配 PUT 端點', blockDefId: 'api-put', blockLabel: 'PUT Endpoint', reason: 'DTO 作為 PUT 的 Body 型別' },
  ],
  'api-endpoint': [
    { fromCategory: 'api', toCategory: 'logic', label: '搭配 useQuery', blockDefId: 'use-query', blockLabel: 'useQuery Hook', reason: '在 React 中查詢此 API' },
    { fromCategory: 'api', toCategory: 'logic', label: '搭配 useMutation', blockDefId: 'use-mutation', blockLabel: 'useMutation Hook', reason: '在 React 中呼叫此 API' },
  ],
  'api-get': [
    { fromCategory: 'api', toCategory: 'logic', label: '搭配 useQuery', blockDefId: 'use-query', blockLabel: 'useQuery Hook', reason: '在 React 中查詢此 API' },
  ],
  'api-post': [
    { fromCategory: 'api', toCategory: 'logic', label: '搭配 useMutation', blockDefId: 'use-mutation', blockLabel: 'useMutation Hook', reason: '在 React 中呼叫此 POST' },
  ],
  'use-query': [
    { fromCategory: 'logic', toCategory: 'ui', label: '搭配 DataTable', blockDefId: 'data-table', blockLabel: 'DataTable', reason: '用表格顯示查詢結果' },
    { fromCategory: 'logic', toCategory: 'ui', label: '搭配 Card', blockDefId: 'card', blockLabel: 'Detail Card', reason: '用卡片顯示單筆資料' },
    { fromCategory: 'logic', toCategory: 'ui', label: '搭配 Chart', blockDefId: 'chart', blockLabel: 'Chart', reason: '用圖表視覺化資料' },
  ],
  'use-mutation': [
    { fromCategory: 'logic', toCategory: 'ui', label: '搭配 Form', blockDefId: 'form', blockLabel: 'Form', reason: '用表單觸發此操作' },
    { fromCategory: 'logic', toCategory: 'ui', label: '搭配 Modal', blockDefId: 'modal', blockLabel: 'Modal', reason: '在彈窗中執行此操作' },
  ],
  'nest-module': [
    { fromCategory: 'api', toCategory: 'api', label: '搭配 NestJS Service', blockDefId: 'nest-service', blockLabel: 'NestJS Service', reason: '加入業務邏輯層' },
    { fromCategory: 'api', toCategory: 'auth', label: '搭配 JWT Guard', blockDefId: 'auth-guard', blockLabel: 'Auth Guard', reason: '保護此模組的 API' },
  ],
  'jwt': [
    { fromCategory: 'auth', toCategory: 'api', label: '搭配 API 端點', blockDefId: 'api-get', blockLabel: 'GET Endpoint', reason: '保護此 API 需要登入' },
    { fromCategory: 'auth', toCategory: 'auth', label: '搭配 Roles Guard', blockDefId: 'roles', blockLabel: 'Roles Guard', reason: '加上角色權限控制' },
  ],
  'cache': [
    { fromCategory: 'infra', toCategory: 'api', label: '搭配 GET 端點', blockDefId: 'api-get', blockLabel: 'GET Endpoint', reason: '快取此 API 的回應' },
  ],
  'websocket': [
    { fromCategory: 'infra', toCategory: 'logic', label: '搭配 Store', blockDefId: 'store', blockLabel: 'State Store', reason: '管理 WebSocket 狀態' },
  ],
}

export function getSuggestions(blockDefId: string): ConnectionSuggestion[] {
  // Try exact match first, then prefix match (api-get/api-post both → api-endpoint)
  return SUGGESTION_MAP[blockDefId] ??
    SUGGESTION_MAP[blockDefId.split('-')[0] + '-endpoint'] ??
    []
}

// ─── Recommended next block after placing ────────────────────────────
const NEXT_BLOCK_MAP: Record<string, string[]> = {
  'interface':       ['dto', 'api-get', 'nest-repository'],
  'dto':             ['api-post', 'api-put', 'form'],
  'enum':            ['interface', 'dto'],
  'api-get':         ['use-query', 'auth-guard'],
  'api-post':        ['use-mutation', 'auth-guard'],
  'api-put':         ['use-mutation'],
  'api-delete':      ['use-mutation'],
  'nest-module':     ['nest-service', 'auth-guard'],
  'nest-service':    ['nest-repository'],
  'nest-repository': ['nest-service'],
  'use-query':       ['data-table', 'card', 'chart'],
  'use-mutation':    ['form', 'modal'],
  'store':           ['data-table', 'navigation'],
  'jwt':             ['auth-guard', 'roles'],
  'auth-guard':      ['api-get', 'api-post'],
  'cache':           ['api-get'],
  'websocket':       ['store', 'notification'],
  'email':           ['job'],
  'data-table':      ['modal', 'search-bar'],
  'form':            ['modal'],
  'chart':           ['navigation'],
}

export function getNextBlockSuggestions(blockDefId: string): string[] {
  return NEXT_BLOCK_MAP[blockDefId] ?? []
}

// ─── AI smart naming (local rules, no API needed) ────────────────────
export function suggestName(
  blockDefId: string,
  connectedNodes: { defId: string; blockData: any }[]
): string {
  // Find the primary interface/entity connected
  const typeNode = connectedNodes.find(n =>
    ['interface', 'dto'].includes(n.defId) && n.blockData?.name
  )
  const entityName = typeNode?.blockData?.name ?? ''

  const suggestions: Record<string, (entity: string) => string> = {
    'api-get':          e => e ? `GET /api/${toKebabPlural(e)}` : 'GET /api/resources',
    'api-post':         e => e ? `POST /api/${toKebabPlural(e)}` : 'POST /api/resources',
    'api-put':          e => e ? `PUT /api/${toKebabPlural(e)}/:id` : 'PUT /api/resources/:id',
    'api-delete':       e => e ? `DELETE /api/${toKebabPlural(e)}/:id` : 'DELETE /api/resources/:id',
    'use-query':        e => e ? `use${e}Query` : 'useDataQuery',
    'use-mutation':     e => e ? `useCreate${e}` : 'useCreateMutation',
    'data-table':       e => e ? `${e}Table` : 'DataTable',
    'form':             e => e ? `${e}Form` : 'Form',
    'nest-service':     e => e ? `${e}Service` : 'Service',
    'nest-module':      e => e ? `${e}Module` : 'Module',
    'nest-repository':  e => e ? `${e}Repository` : 'Repository',
  }

  const fn = suggestions[blockDefId]
  return fn ? fn(entityName) : ''
}

function toKebabPlural(s: string): string {
  const kebab = s.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
  return kebab.endsWith('s') ? kebab : kebab + 's'
}
