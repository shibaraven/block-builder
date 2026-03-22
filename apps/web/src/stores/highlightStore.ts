import { create } from 'zustand'

interface HighlightStore {
  highlightedNodeId: string | null
  highlightedFilePath: string | null
  setHighlightedNode: (id: string | null) => void
  setHighlightedFile: (path: string | null) => void
  flash: (id: string) => void
}

export const useHighlightStore = create<HighlightStore>((set) => ({
  highlightedNodeId: null,
  highlightedFilePath: null,
  setHighlightedNode: (id) => set({ highlightedNodeId: id }),
  setHighlightedFile: (path) => set({ highlightedFilePath: path }),
  flash: (id) => {
    set({ highlightedNodeId: id })
    setTimeout(() => set({ highlightedNodeId: null }), 1500)
  },
}))

// ─── Mapping: blockDefId → file path patterns ─────────────────────────
export function getFilesForBlock(blockDefId: string, label: string, files: string[]): string[] {
  const lbl = label.toLowerCase().replace(/\s+/g, '-')
  const name = label.replace(/\s+/g, '').replace(/Interface|Endpoint|Hook|Table|Form/g, '')
  const kebab = name.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')

  const patterns: Record<string, (string | RegExp)[]> = {
    'interface':       [new RegExp(`types/${kebab}`), new RegExp(`types/${name.toLowerCase()}`)],
    'dto':             [new RegExp(`types/${kebab}`), /dto/],
    'enum':            [new RegExp(`types/${kebab}`), /enum/],
    'api-get':         [new RegExp(`routes/`), /api-/],
    'api-post':        [new RegExp(`routes/`), /api-/],
    'api-put':         [new RegExp(`routes/`), /api-/],
    'api-delete':      [new RegExp(`routes/`), /api-/],
    'use-query':       [new RegExp(`hooks/${kebab}`), /use-.*query/i],
    'use-mutation':    [new RegExp(`hooks/${kebab}`), /use-.*mutation/i],
    'data-table':      [new RegExp(`components/${kebab}`), /table/i],
    'form':            [new RegExp(`components/${kebab}`), /form/i],
    'nest-module':     [new RegExp(`modules/.*module`), /\.module\./],
    'nest-service':    [new RegExp(`modules/.*service`), /\.service\./],
    'nest-repository': [new RegExp(`modules/.*repository`), /\.repository\./],
    'store':           [new RegExp(`stores/${kebab}`), /store/i],
    'jwt':             [/auth\/jwt/, /jwt/i],
    'auth-guard':      [/auth\/.*guard/, /guard/i],
  }

  const matchers = patterns[blockDefId] ?? []
  const matched = files.filter(f =>
    matchers.some(m => typeof m === 'string' ? f.includes(m) : m.test(f))
  )
  return matched.length > 0 ? matched : []
}

// ─── Mapping: file path → block def IDs ──────────────────────────────
export function getBlockForFile(filePath: string): string[] {
  if (filePath.includes('/types/') || filePath.endsWith('.prisma')) return ['interface', 'dto', 'enum']
  if (filePath.includes('/routes/') || filePath.includes('/api-')) return ['api-get', 'api-post', 'api-put', 'api-delete']
  if (filePath.includes('/hooks/') && filePath.includes('query')) return ['use-query']
  if (filePath.includes('/hooks/') && filePath.includes('mutation')) return ['use-mutation']
  if (filePath.includes('/components/') && filePath.includes('table')) return ['data-table']
  if (filePath.includes('/components/') && filePath.includes('form')) return ['form']
  if (filePath.includes('.module.')) return ['nest-module']
  if (filePath.includes('.service.')) return ['nest-service']
  if (filePath.includes('.repository.')) return ['nest-repository']
  if (filePath.includes('/stores/')) return ['store']
  if (filePath.includes('/auth/')) return ['jwt', 'auth-guard']
  return []
}
