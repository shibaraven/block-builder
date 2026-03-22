import React, { useState } from 'react'
import { X, Upload, FileCode } from 'lucide-react'
import { DraggableModal } from './DraggableModal'
import { useCanvasStore } from '../../stores/canvasStore'
import type { CanvasNode } from '@block-builder/types'
import clsx from 'clsx'

interface ImportModalProps { onClose: () => void }

type ImportMode = 'typescript' | 'openapi'

// ─── Parse TypeScript interfaces ────────────────────────────────────
function parseInterfaces(code: string): CanvasNode[] {
  const nodes: CanvasNode[] = []
  let y = 60

  // Match interface declarations
  const interfaceRegex = /(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+[\w,\s]+)?\s*\{([^}]+)\}/g
  let match
  while ((match = interfaceRegex.exec(code)) !== null) {
    const name = match[1]
    const body = match[2]
    const fields = parseFields(body)

    nodes.push({
      id: `import-${Date.now()}-${nodes.length}`,
      type: 'blockNode',
      position: { x: 60, y },
      data: {
        blockDefId: 'interface',
        category: 'type',
        label: name,
        blockData: { kind: 'interface', name, fields },
      },
    })
    y += 180
  }

  // Match type aliases that look like interfaces
  const typeRegex = /(?:export\s+)?type\s+(\w+)\s*=\s*\{([^}]+)\}/g
  while ((match = typeRegex.exec(code)) !== null) {
    const name = match[1]
    const body = match[2]
    const fields = parseFields(body)

    nodes.push({
      id: `import-type-${Date.now()}-${nodes.length}`,
      type: 'blockNode',
      position: { x: 60, y },
      data: {
        blockDefId: 'interface',
        category: 'type',
        label: name,
        blockData: { kind: 'interface', name, fields },
      },
    })
    y += 180
  }

  // Match enums
  const enumRegex = /(?:export\s+)?enum\s+(\w+)\s*\{([^}]+)\}/g
  while ((match = enumRegex.exec(code)) !== null) {
    const name = match[1]
    const body = match[2]
    const values = body.split(',').map(v => {
      const parts = v.trim().split('=').map(p => p.trim().replace(/['"]/g, ''))
      return { key: parts[0] || '', value: parts[1] || parts[0]?.toLowerCase() || '' }
    }).filter(v => v.key)

    nodes.push({
      id: `import-enum-${Date.now()}-${nodes.length}`,
      type: 'blockNode',
      position: { x: 60, y },
      data: {
        blockDefId: 'enum',
        category: 'type',
        label: name,
        blockData: { kind: 'enum', name, values, style: 'string' },
      },
    })
    y += 140
  }

  return nodes
}

function parseFields(body: string) {
  return body.split('\n')
    .map(line => line.trim().replace(/\/\/.*/g, '').trim())
    .filter(line => line && !line.startsWith('/*') && !line.startsWith('*'))
    .map(line => {
      const clean = line.replace(/;$/, '').trim()
      const optional = clean.includes('?:') || (clean.includes('?') && !clean.includes(':?'))
      const colonIdx = clean.indexOf(':')
      if (colonIdx < 0) return null
      const namePart = clean.slice(0, colonIdx).trim().replace('?', '')
      const typePart = clean.slice(colonIdx + 1).trim()
      if (!namePart || !typePart) return null
      return { name: namePart, type: typePart.replace(/;$/, '').trim(), optional }
    })
    .filter(Boolean) as { name: string; type: string; optional: boolean }[]
}

// ─── Parse OpenAPI YAML (simplified) ─────────────────────────────────
function parseOpenApi(yaml: string): CanvasNode[] {
  const nodes: CanvasNode[] = []
  let x = 60, y = 60

  // Extract paths
  const pathRegex = /^  (\/[^\s:]+):\s*$/gm
  const methodRegex = /^    (get|post|put|patch|delete):\s*$/gm
  const summaryRegex = /summary:\s*(.+)/
  const responseRegex = /\$ref:\s*['"]?#\/components\/schemas\/(\w+)['"]?/

  const lines = yaml.split('\n')
  let currentPath = ''
  let currentMethod = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const pathMatch = line.match(/^  (\/[^\s:]+):/)
    if (pathMatch) { currentPath = pathMatch[1]; continue }

    const methodMatch = line.match(/^    (get|post|put|patch|delete):/)
    if (methodMatch && currentPath) {
      currentMethod = methodMatch[1].toUpperCase()
      let summary = ''
      let responseType = 'any'
      let bodyType = ''
      let auth = false

      // Scan ahead for details
      for (let j = i + 1; j < Math.min(i + 30, lines.length); j++) {
        const jline = lines[j]
        if (/^    [a-z]/.test(jline) && j > i + 1) break
        const sumMatch = jline.match(/summary:\s*(.+)/)
        if (sumMatch) summary = sumMatch[1].trim()
        const refMatch = jline.match(/\$ref:\s*['"]?#\/components\/schemas\/(\w+)/)
        if (refMatch) responseType = refMatch[1]
        if (jline.includes('bearerAuth') || jline.includes('security:')) auth = true
        if (jline.includes('requestBody')) bodyType = 'Dto'
      }

      nodes.push({
        id: `oa-${nodes.length}-${Date.now()}`,
        type: 'blockNode',
        position: { x, y },
        data: {
          blockDefId: `api-${currentMethod.toLowerCase()}`,
          category: 'api',
          label: `${currentMethod} ${currentPath}`,
          blockData: {
            kind: 'api-endpoint',
            method: currentMethod as any,
            path: currentPath,
            summary: summary || `${currentMethod} ${currentPath}`,
            auth,
            responseType,
            bodyType: bodyType || undefined,
            tags: [currentPath.split('/').filter(Boolean)[1] ?? 'api'],
          },
        },
      })
      y += 160
      if (y > 800) { y = 60; x += 300 }
    }
  }

  return nodes
}

export function ImportModal({ onClose }: ImportModalProps) {
  const [mode, setMode] = useState<ImportMode>('typescript')
  const [code, setCode] = useState('')
  const [result, setResult] = useState<CanvasNode[] | null>(null)
  const [error, setError] = useState('')
  const { addNode } = useCanvasStore()

  const handleParse = () => {
    setError('')
    setResult(null)
    try {
      const nodes = mode === 'typescript' ? parseInterfaces(code) : parseOpenApi(code)
      if (nodes.length === 0) {
        setError('未偵測到任何可解析的型別或端點，請確認格式是否正確。')
        return
      }
      setResult(nodes)
    } catch (e) {
      setError('解析失敗：' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const handleImport = () => {
    if (!result) return
    result.forEach(node => addNode(node))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20" onClick={onClose}>
      <div
        className="w-[620px] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Upload size={15} className="text-gray-400" />
            <div>
              <h2 className="text-sm font-semibold text-gray-900">反向匯入</h2>
              <p className="text-xs text-gray-400 mt-0.5">貼上現有代碼，自動解析成積木</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={14} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Mode selector */}
          <div className="flex gap-2">
            {(['typescript', 'openapi'] as ImportMode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setResult(null); setError('') }}
                className={clsx(
                  'px-4 py-2 text-xs font-medium rounded-lg border transition-all',
                  mode === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                )}
              >
                {m === 'typescript' ? 'TypeScript (interface / enum)' : 'OpenAPI YAML'}
              </button>
            ))}
          </div>

          {/* Example hint */}
          <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 font-mono leading-relaxed">
            {mode === 'typescript' ? (
              <>
                <div className="text-gray-500 mb-1">支援格式：</div>
                {'export interface User { id: string; name: string; email: string }'}<br/>
                {'export enum Role { ADMIN = "admin", USER = "user" }'}
              </>
            ) : (
              <>
                <div className="text-gray-500 mb-1">支援 OpenAPI 3.0 YAML paths 格式</div>
                {'paths:'}<br/>
                {'  /api/users:'}<br/>
                {'    get:'}<br/>
                {'      summary: List users'}
              </>
            )}
          </div>

          {/* Code input */}
          <textarea
            value={code}
            onChange={e => { setCode(e.target.value); setResult(null); setError('') }}
            placeholder={mode === 'typescript' ? '貼上 TypeScript interface / enum / type...' : '貼上 OpenAPI YAML...'}
            rows={10}
            className="w-full px-3 py-2.5 text-xs font-mono border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none bg-gray-50"
          />

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Parse result preview */}
          {result && (
            <div className="border border-green-200 bg-green-50 rounded-xl p-3">
              <p className="text-xs font-medium text-green-700 mb-2">
                解析成功！偵測到 {result.length} 個積木：
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {result.map(n => (
                  <div key={n.id} className="flex items-center gap-2 text-xs text-green-600">
                    <FileCode size={11} />
                    <span className="font-mono">{n.data.label}</span>
                    <span className="text-green-400">({n.data.category})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            取消
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleParse}
              disabled={!code.trim()}
              className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              解析預覽
            </button>
            <button
              onClick={handleImport}
              disabled={!result}
              className="px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40"
            >
              匯入到畫布 ({result?.length ?? 0} 個)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
