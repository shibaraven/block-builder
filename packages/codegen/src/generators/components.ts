import type { DataTableData, FormData } from '@block-builder/types'

// ─── DataTable Component ─────────────────────────────────────────────
export function generateDataTable(data: DataTableData): string {
  const columns = data.columns
    .map((col) => {
      return `  {
    key: '${col.key}',
    label: '${col.label}',
    sortable: ${col.sortable ?? false},
    type: '${col.type ?? 'string'}',
  }`
    })
    .join(',\n')

  return `import React, { useState } from 'react'
import type { ${data.dataType} } from '../types'

interface Column {
  key: string
  label: string
  sortable?: boolean
  type?: string
}

interface ${data.componentName}Props {
  data: ${data.dataType}[]
  isLoading?: boolean
  onRowClick?: (row: ${data.dataType}) => void
}

const COLUMNS: Column[] = [
${columns}
]

${data.pagination ? `const PAGE_SIZE = 10` : ''}

export function ${data.componentName}({ data, isLoading, onRowClick }: ${data.componentName}Props) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  ${data.pagination ? "const [page, setPage] = useState(1)" : ''}
  ${data.searchable ? "const [search, setSearch] = useState('')" : ''}

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400">
        Loading...
      </div>
    )
  }

  ${data.searchable ? `const filtered = data.filter((row) =>
    COLUMNS.some((col) =>
      String((row as Record<string, unknown>)[col.key] ?? '')
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  )` : 'const filtered = data'}

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const av = (a as Record<string, unknown>)[sortKey]
        const bv = (b as Record<string, unknown>)[sortKey]
        return sortDir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av))
      })
    : filtered

  ${data.pagination ? `const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)` : 'const paginated = sorted'}

  return (
    <div className="w-full">
      ${data.searchable ? `<div className="mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-sm"
        />
      </div>` : ''}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer select-none"
                  onClick={() => {
                    if (!col.sortable) return
                    if (sortKey === col.key) {
                      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
                    } else {
                      setSortKey(col.key)
                      setSortDir('asc')
                    }
                  }}
                >
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => (
              <tr
                key={i}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onRowClick?.(row)}
              >
                {COLUMNS.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-gray-700">
                    {String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      ${data.pagination ? `{totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}` : ''}
    </div>
  )
}
`
}

// ─── Form Component ──────────────────────────────────────────────────
export function generateForm(data: FormData): string {
  const fields = data.fields
    .map((f) => {
      if (f.type === 'select') {
        return `
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">${f.label}${f.required ? ' *' : ''}</label>
        <select
          {...register('${f.name}')}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="">Select...</option>
          ${(f.options ?? []).map((o) => `<option value="${o.value}">${o.label}</option>`).join('\n          ')}
        </select>
        {errors.${f.name} && <p className="text-red-500 text-xs">{errors.${f.name}?.message}</p>}
      </div>`
      } else if (f.type === 'textarea') {
        return `
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">${f.label}${f.required ? ' *' : ''}</label>
        <textarea
          {...register('${f.name}')}
          placeholder="${f.placeholder ?? ''}"
          className="px-3 py-2 border rounded-md text-sm resize-none h-24"
        />
        {errors.${f.name} && <p className="text-red-500 text-xs">{errors.${f.name}?.message}</p>}
      </div>`
      } else if (f.type === 'checkbox') {
        return `
      <div className="flex items-center gap-2">
        <input type="checkbox" id="${f.name}" {...register('${f.name}')} />
        <label htmlFor="${f.name}" className="text-sm text-gray-700">${f.label}</label>
      </div>`
      } else {
        return `
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">${f.label}${f.required ? ' *' : ''}</label>
        <input
          type="${f.type}"
          {...register('${f.name}')}
          placeholder="${f.placeholder ?? ''}"
          className="px-3 py-2 border rounded-md text-sm"
        />
        {errors.${f.name} && <p className="text-red-500 text-xs">{errors.${f.name}?.message}</p>}
      </div>`
      }
    })
    .join('')

  return `import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ${data.dtoType}Schema } from '../types'
import type { ${data.dtoType} } from '../types'

interface ${data.componentName}Props {
  onSubmit: (data: ${data.dtoType}) => void | Promise<void>
  defaultValues?: Partial<${data.dtoType}>
  isLoading?: boolean
}

export function ${data.componentName}({ onSubmit, defaultValues, isLoading }: ${data.componentName}Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<${data.dtoType}>({
    resolver: zodResolver(${data.dtoType}Schema),
    defaultValues,
  })

  const handleFormSubmit = async (data: ${data.dtoType}) => {
    await onSubmit(data)
    reset()
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
      ${fields}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 rounded-md border text-sm hover:bg-gray-50 transition"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Submit'}
        </button>
      </div>
    </form>
  )
}
`
}


// ─── Enhanced DataTable with full states ─────────────────────────────
export function generateEnhancedDataTable(data: DataTableData): string {
  const colDefs = data.columns
    .map(c => [
      `  { key: '${c.key}', label: '${c.label}'`,
      c.sortable ? ', sortable: true' : '',
      c.type ? `, type: '${c.type}'` : '',
      ' }',
    ].join(''))
    .join(',\n')

  const skeletonCells = data.columns
    .map(() => '      <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-3/4" /></td>')
    .join('\n')

  const tdCells = 'COLUMNS.map(col => (\n' +
    '                  <td key={col.key} className="px-4 py-3 text-sm text-gray-700">\n' +
    '                    {String((row as any)[col.key] ?? "—")}\n' +
    '                  </td>\n' +
    '                ))'

  const paginationBlock = data.pagination
    ? [
        '      {totalPages > 1 && (',
        '        <div className="flex items-center justify-between text-sm text-gray-500">',
        '          <span>第 {page} 頁，共 {totalPages} 頁（{filtered.length} 筆）</span>',
        '          <div className="flex gap-1">',
        '            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}',
        '              className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-100">←</button>',
        '            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}',
        '              className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-100">→</button>',
        '          </div>',
        '        </div>',
        '      )}',
      ].join('\n')
    : ''

  const searchBlock = data.searchable
    ? [
        '      <input',
        '        type="text"',
        '        value={search}',
        '        onChange={e => { setSearch(e.target.value); setPage(1) }}',
        '        placeholder="搜尋..."',
        '        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"',
        '      />',
      ].join('\n')
    : ''

  return [
    `import React, { useState } from 'react'`,
    `import type { ${data.dataType} } from '../types'`,
    ``,
    `const COLUMNS = [`,
    colDefs,
    `] as const`,
    ``,
    `interface ${data.componentName}Props {`,
    `  data?: ${data.dataType}[]`,
    `  isLoading?: boolean`,
    `  error?: Error | null`,
    `  onRowClick?: (row: ${data.dataType}) => void`,
    `}`,
    ``,
    `function SkeletonRow() {`,
    `  return (`,
    `    <tr className="animate-pulse">`,
    skeletonCells,
    `    </tr>`,
    `  )`,
    `}`,
    ``,
    `function EmptyState() {`,
    `  return (`,
    `    <tr><td colSpan={${data.columns.length}} className="text-center py-12 text-gray-400">`,
    `      <p className="text-sm font-medium">沒有資料</p>`,
    `    </td></tr>`,
    `  )`,
    `}`,
    ``,
    `export function ${data.componentName}({ data, isLoading, error, onRowClick }: ${data.componentName}Props) {`,
    `  const [sortKey, setSortKey] = useState<string | null>(null)`,
    `  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')`,
    data.searchable ? `  const [search, setSearch] = useState('')` : '',
    `  const [page, setPage] = useState(1)`,
    `  const pageSize = ${(data as any).pageSize ?? 10}`,
    ``,
    `  const handleSort = (key: string) => {`,
    `    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')`,
    `    else { setSortKey(key); setSortDir('asc') }`,
    `  }`,
    ``,
    `  const filtered = (data ?? [])`,
    data.searchable
      ? `    .filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase())))`
      : '',
    `    .sort((a, b) => {`,
    `      if (!sortKey) return 0`,
    `      const av = (a as any)[sortKey], bv = (b as any)[sortKey]`,
    `      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)`,
    `    })`,
    ``,
    `  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)`,
    `  const totalPages = Math.ceil(filtered.length / pageSize)`,
    ``,
    `  if (error) return (`,
    `    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">`,
    `      <p className="text-sm font-medium text-red-700">載入失敗：{error.message}</p>`,
    `    </div>`,
    `  )`,
    ``,
    `  return (`,
    `    <div className="space-y-3">`,
    searchBlock,
    `      <div className="rounded-xl border border-gray-200 overflow-hidden">`,
    `        <table className="w-full">`,
    `          <thead className="bg-gray-50 border-b border-gray-200">`,
    `            <tr>`,
    `              {COLUMNS.map(col => (`,
    `                <th key={col.key}`,
    `                  onClick={() => (col as any).sortable && handleSort(col.key)}`,
    `                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"`,
    `                >`,
    `                  {col.label}`,
    `                  {(col as any).sortable && sortKey === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}`,
    `                </th>`,
    `              ))}`,
    `            </tr>`,
    `          </thead>`,
    `          <tbody className="divide-y divide-gray-100">`,
    `            {isLoading`,
    `              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)`,
    `              : paginated.length === 0`,
    `              ? <EmptyState />`,
    `              : paginated.map((row, i) => (`,
    `                <tr key={i}`,
    `                  onClick={() => onRowClick?.(row)}`,
    `                  className="hover:bg-gray-50 transition-colors cursor-pointer"`,
    `                >`,
    `                  {${tdCells}}`,
    `                </tr>`,
    `              ))`,
    `            }`,
    `          </tbody>`,
    `        </table>`,
    `      </div>`,
    paginationBlock,
    `    </div>`,
    `  )`,
    `}`,
  ].filter(l => l !== '').join('\n')
}
