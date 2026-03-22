import React, { memo, useMemo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Trash2, AlertCircle, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import { useCanvasStore } from '../../stores/canvasStore'
import { useHighlightStore } from '../../stores/highlightStore'
import { LabelBadge } from '../blocks/LabelEditor'
import { validateNode } from '../../lib/validation'
import type { BlockCategory, CanvasNode } from '@block-builder/types'

const COLORS: Record<string, {
  header: string; headerText: string; border: string; handle: string; badge: string
}> = {
  api:    { header: 'bg-api-50',    headerText: 'text-api-800',   border: 'border-api-600 border-opacity-30',   handle: '!bg-api-400 !border-api-600',   badge: 'bg-api-100 text-api-800' },
  type:   { header: 'bg-type-50',   headerText: 'text-type-800',  border: 'border-type-600 border-opacity-30',  handle: '!bg-type-400 !border-type-600',  badge: 'bg-type-100 text-type-800' },
  logic:  { header: 'bg-logic-50',  headerText: 'text-logic-800', border: 'border-logic-600 border-opacity-30', handle: '!bg-logic-400 !border-logic-600', badge: 'bg-logic-100 text-logic-800' },
  ui:     { header: 'bg-ui-50',     headerText: 'text-ui-800',    border: 'border-ui-600 border-opacity-30',    handle: '!bg-ui-400 !border-ui-600',      badge: 'bg-ui-100 text-ui-800' },
  auth:   { header: 'bg-purple-50', headerText: 'text-purple-800',border: 'border-purple-400 border-opacity-40',handle: '!bg-purple-400 !border-purple-500',badge: 'bg-purple-100 text-purple-800' },
  infra:  { header: 'bg-orange-50', headerText: 'text-orange-800',border: 'border-orange-400 border-opacity-40',handle: '!bg-orange-400 !border-orange-500',badge: 'bg-orange-100 text-orange-800' },
  layout: { header: 'bg-gray-100',  headerText: 'text-gray-700',  border: 'border-gray-300',                    handle: '!bg-gray-400 !border-gray-500',   badge: 'bg-gray-200 text-gray-700' },
}

function getFieldRows(blockData: any): { key: string; value: string }[] {
  if (!blockData) return []
  const rows: { key: string; value: string }[] = []
  switch (blockData.kind) {
    case 'api-endpoint':
      rows.push({ key: '路徑', value: blockData.path || '—' })
      rows.push({ key: '回傳', value: blockData.responseType || '—' })
      if (blockData.bodyType) rows.push({ key: 'Body', value: blockData.bodyType })
      rows.push({ key: '驗證', value: blockData.auth ? 'Bearer' : '無' })
      break
    case 'interface':
      rows.push({ key: '名稱', value: blockData.name || '—' })
      rows.push({ key: '欄位', value: blockData.fields?.map((f: any) => f.name).filter(Boolean).join(', ') || '無' })
      break
    case 'dto':
      rows.push({ key: '名稱', value: blockData.name || '—' })
      rows.push({ key: '驗證器', value: blockData.validator || 'zod' })
      rows.push({ key: '欄位', value: `${blockData.fields?.length ?? 0} 個` })
      break
    case 'enum':
      rows.push({ key: '名稱', value: blockData.name || '—' })
      rows.push({ key: '值', value: blockData.values?.map((v: any) => v.key).join(' | ') || '無' })
      break
    case 'use-query':
      rows.push({ key: 'Hook', value: blockData.hookName || '—' })
      rows.push({ key: '端點', value: blockData.endpoint || '—' })
      rows.push({ key: '回傳', value: blockData.responseType || '—' })
      break
    case 'use-mutation':
      rows.push({ key: 'Hook', value: blockData.hookName || '—' })
      rows.push({ key: '端點', value: `${blockData.method} ${blockData.endpoint}` || '—' })
      break
    case 'data-table':
      rows.push({ key: '組件', value: blockData.componentName || '—' })
      rows.push({ key: '資料', value: blockData.dataType || '—' })
      rows.push({ key: '欄位', value: `${blockData.columns?.length ?? 0} 欄` })
      break
    case 'form':
      rows.push({ key: '組件', value: blockData.componentName || '—' })
      rows.push({ key: 'DTO', value: blockData.dtoType || '—' })
      rows.push({ key: '欄位', value: `${blockData.fields?.length ?? 0} 個` })
      break
    case 'nest-module':
      rows.push({ key: '名稱', value: blockData.name || '—' })
      rows.push({ key: 'Controllers', value: blockData.controllers?.join(', ') || '無' })
      break
    case 'nest-service':
      rows.push({ key: '名稱', value: blockData.name || '—' })
      rows.push({ key: '方法', value: `${blockData.methods?.length ?? 0} 個` })
      break
    case 'nest-repository':
      rows.push({ key: '名稱', value: blockData.name || '—' })
      rows.push({ key: 'Entity', value: blockData.entity || '—' })
      rows.push({ key: 'ORM', value: blockData.orm || 'prisma' })
      break
    case 'auth-guard':
      rows.push({ key: '名稱', value: blockData.name || '—' })
      rows.push({ key: '策略', value: blockData.strategy || '—' })
      break
    case 'jwt':
      rows.push({ key: '名稱', value: blockData.name || '—' })
      rows.push({ key: '過期', value: blockData.expiresIn || '—' })
      rows.push({ key: 'Refresh', value: blockData.refreshToken ? '是' : '否' })
      break
    case 'cache':
      rows.push({ key: '名稱', value: blockData.name || '—' })
      rows.push({ key: '儲存', value: blockData.store || 'redis' })
      rows.push({ key: 'TTL', value: `${blockData.ttl}s` })
      break
    case 'websocket':
      rows.push({ key: '名稱', value: blockData.name || '—' })
      rows.push({ key: 'Namespace', value: blockData.namespace || '—' })
      rows.push({ key: '事件', value: `${blockData.events?.length ?? 0} 個` })
      break
    case 'store':
      rows.push({ key: '名稱', value: blockData.name || '—' })
      rows.push({ key: '函式庫', value: blockData.lib || 'zustand' })
      rows.push({ key: 'State', value: `${blockData.state?.length ?? 0} 個` })
      break
    case 'chart':
      rows.push({ key: '組件', value: blockData.componentName || '—' })
      rows.push({ key: '類型', value: blockData.chartType || 'bar' })
      rows.push({ key: '資料', value: blockData.dataType || '—' })
      break
    case 'navigation':
      rows.push({ key: '組件', value: blockData.componentName || '—' })
      rows.push({ key: '類型', value: blockData.type || 'navbar' })
      rows.push({ key: '選項', value: `${blockData.items?.length ?? 0} 個` })
      break
    case 'email':
      rows.push({ key: '名稱', value: blockData.name || '—' })
      rows.push({ key: 'Provider', value: blockData.provider || '—' })
      rows.push({ key: '模板', value: `${blockData.templates?.length ?? 0} 個` })
      break
    case 'job':
      rows.push({ key: '名稱', value: blockData.name || '—' })
      rows.push({ key: '類型', value: blockData.type || 'cron' })
      rows.push({ key: '排程', value: blockData.schedule || blockData.interval || '—' })
      break
    case 'search-bar':
      rows.push({ key: '組件', value: blockData.componentName || '—' })
      rows.push({ key: '模式', value: blockData.searchType || 'remote' })
      break
    case 'notification':
      rows.push({ key: '組件', value: blockData.componentName || '—' })
      rows.push({ key: '函式庫', value: blockData.lib || 'sonner' })
      rows.push({ key: '位置', value: blockData.position || 'top-right' })
      break
    case 'pagination':
      rows.push({ key: '名稱', value: blockData.name || '—' })
      rows.push({ key: '類型', value: blockData.type || 'offset' })
      rows.push({ key: '預設', value: `${blockData.defaultLimit} / 頁` })
      break
    default:
      if (blockData.name) rows.push({ key: '名稱', value: blockData.name })
  }
  return rows.slice(0, 4)
}

function getBadgeLabel(blockData: any): string {
  if (!blockData) return ''
  const map: Record<string, string> = {
    'api-endpoint': blockData.method || 'API',
    'interface': 'interface',
    'dto': 'DTO',
    'enum': 'enum',
    'use-query': 'useQuery',
    'use-mutation': 'useMutation',
    'data-table': 'Table',
    'form': 'Form',
    'modal': 'Modal',
    'card': 'Card',
    'chart': 'Chart',
    'navigation': 'Nav',
    'search-bar': 'Search',
    'notification': 'Toast',
    'auth-guard': 'Guard',
    'jwt': 'JWT',
    'roles': 'Roles',
    'middleware': 'MW',
    'cache': 'Cache',
    'file-upload': 'Upload',
    'email': 'Email',
    'job': 'Job',
    'websocket': 'WS',
    'pagination': 'Page',
    'nest-module': 'Module',
    'nest-service': 'Service',
    'nest-repository': 'Repo',
    'store': 'Store',
  }
  return map[blockData.kind] ?? blockData.kind ?? ''
}

export const BlockNode = memo(({ id, data, selected }: NodeProps<CanvasNode['data']>) => {
  const { removeNode, selectNode } = useCanvasStore()
  const { highlightedNodeId } = useHighlightStore()
  const isHighlighted = highlightedNodeId === id
  const c = COLORS[data.category] ?? COLORS.api
  const fields = getFieldRows(data.blockData)
  const badge = getBadgeLabel(data.blockData)

  // Validate this node
  const validation = useMemo(() => {
    const node = { id, type: 'blockNode' as const, position: { x: 0, y: 0 }, data }
    return validateNode(node)
  }, [id, data])

  const hasErrors = validation.errors.length > 0
  const hasWarnings = validation.warnings.length > 0 && !hasErrors

  return (
    <div
      className={clsx(
        'block-node min-w-[160px] max-w-[220px] bg-white border rounded-xl overflow-hidden',
        hasErrors ? 'border-red-400 border-opacity-80' : hasWarnings ? 'border-amber-400 border-opacity-60' : c.border,
        selected && 'ring-2 ring-blue-400 ring-offset-1',
        isHighlighted && 'ring-2 ring-amber-400 ring-offset-1 animate-pulse'
      )}
      onClick={() => selectNode(id)}
    >
      <Handle type="target" position={Position.Left} id="input" className={clsx('w-3 h-3 border-2', c.handle)} />

      {/* Header */}
      <div className={clsx('flex items-center gap-2 px-3 py-2.5 group', c.header)}>
        <span className={clsx('text-xs font-bold font-mono px-1.5 py-0.5 rounded flex-shrink-0', c.badge)}>
          {badge}
        </span>
        <span className={clsx('text-xs font-semibold flex-1 truncate', c.headerText)}>
          {data.label}
        </span>
        {/* Validation indicator */}
        {hasErrors && (
          <span title={validation.errors[0]?.message}>
            <AlertCircle size={12} className="text-red-500 flex-shrink-0" />
          </span>
        )}
        {hasWarnings && (
          <span title={validation.warnings[0]?.message}>
            <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); removeNode(id) }}
          className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-0.5 rounded text-gray-400 flex-shrink-0"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* Body */}
      {fields.length > 0 && (
        <div className="px-3 py-2 space-y-1">
          {fields.map((row) => (
            <div key={row.key} className="flex items-start justify-between gap-2 text-xs">
              <span className="text-gray-400 flex-shrink-0">{row.key}</span>
              <span className={clsx('font-mono truncate text-right max-w-[110px]', row.value === '—' ? 'text-gray-300' : 'text-gray-700')} title={row.value}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Error bar */}
      {hasErrors && (
        <div className="px-3 py-1.5 bg-red-50 border-t border-red-100">
          <p className="text-xs text-red-600 truncate">{validation.errors[0]?.message}</p>
          {validation.errors.length > 1 && (
            <p className="text-xs text-red-400">還有 {validation.errors.length - 1} 個錯誤</p>
          )}
        </div>
      )}
      {hasWarnings && (
        <div className="px-3 py-1.5 bg-amber-50 border-t border-amber-100">
          <p className="text-xs text-amber-600 truncate">{validation.warnings[0]?.message}</p>
        </div>
      )}

      <Handle type="source" position={Position.Right} id="output" className={clsx('w-3 h-3 border-2', c.handle)} />
    </div>
  )
})

BlockNode.displayName = 'BlockNode'
