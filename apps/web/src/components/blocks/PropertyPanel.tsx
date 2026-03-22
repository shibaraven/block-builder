import React, { useCallback, useState } from 'react'
import { X, Plus, Trash2, Eye, Tag } from 'lucide-react'
import { useCanvasStore } from '../../stores/canvasStore'
import { LivePreview } from './LivePreview'
import { LabelEditor } from './LabelEditor'
import { PREVIEWABLE_KINDS } from '../../lib/previewGenerator'
import type {
  BlockData,
  InterfaceData,
  DtoData,
  EnumData,
  ApiEndpointData,
  UseQueryData,
  UseMutationData,
  DataTableData,
  FormData,
  FieldDef,
} from '@block-builder/types'
import clsx from 'clsx'

export function PropertyPanel() {
  const { nodes, selectedNodeId, updateNodeData, selectNode } = useCanvasStore()
  const node = nodes.find((n) => n.id === selectedNodeId)
  const [showPreview, setShowPreview] = useState(false)
  const [showLabels, setShowLabels] = useState(false)

  if (!node) return null

  const handleClose = () => { selectNode(null); setShowPreview(false) }
  const data = node.data.blockData
  const canPreview = PREVIEWABLE_KINDS.has(data.kind)

  const updateBlock = (patch: Partial<BlockData>) => {
    updateNodeData(node.id, {
      blockData: { ...data, ...patch } as BlockData,
    })
  }

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }} className="bg-white animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <div>
          <p className="text-xs font-semibold text-gray-700">{node.data.label}</p>
          <p className="text-xs text-gray-400 font-mono">{data.kind}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowLabels(p => !p)}
            title="標籤與備註"
            className={clsx('p-1 rounded transition-colors', showLabels ? 'bg-amber-100 text-amber-600' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600')}
          >
            <Tag size={14} />
          </button>
          {canPreview && (
            <button
              onClick={() => setShowPreview(p => !p)}
              title="Live Preview"
              className={clsx('p-1 rounded transition-colors', showPreview ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600')}
            >
              <Eye size={14} />
            </button>
          )}
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {data.kind === 'interface' && (
          <InterfaceEditor data={data} onChange={updateBlock} />
        )}
        {data.kind === 'dto' && (
          <DtoEditor data={data} onChange={updateBlock} />
        )}
        {data.kind === 'enum' && (
          <EnumEditor data={data} onChange={updateBlock} />
        )}
        {data.kind === 'api-endpoint' && (
          <ApiEditor data={data} onChange={updateBlock} />
        )}
        {data.kind === 'use-query' && (
          <QueryHookEditor data={data} onChange={updateBlock} />
        )}
        {data.kind === 'use-mutation' && (
          <MutationHookEditor data={data} onChange={updateBlock} />
        )}
        {data.kind === 'data-table' && (
          <DataTableEditor data={data} onChange={updateBlock} />
        )}
        {data.kind === 'form' && (
          <FormEditor data={data} onChange={updateBlock} />
        )}
      </div>
      {showLabels && (
        <div className="border-t border-gray-100">
          <LabelEditor nodeId={node.id} onClose={() => setShowLabels(false)} />
        </div>
      )}

      {showPreview && canPreview && (
        <LivePreview blockData={data} blockLabel={node.data.label} />
      )}
    </div>
  )
}

// ─── Shared field components ─────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  mono,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={clsx(
        'w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md',
        'outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors',
        mono && 'font-mono'
      )}
    />
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md outline-none focus:border-blue-400 bg-white"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!value)}
        className={clsx(
          'w-8 h-4 rounded-full transition-colors relative',
          value ? 'bg-blue-500' : 'bg-gray-300'
        )}
      >
        <div
          className={clsx(
            'absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform',
            value ? 'translate-x-4' : 'translate-x-0.5'
          )}
        />
      </div>
      <span className="text-xs text-gray-600">{label}</span>
    </label>
  )
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors mt-1"
    >
      <Plus size={11} /> {label}
    </button>
  )
}

// ─── Field list editor ───────────────────────────────────────────────

function FieldListEditor({
  fields,
  onChange,
}: {
  fields: FieldDef[]
  onChange: (fields: FieldDef[]) => void
}) {
  const update = (i: number, patch: Partial<FieldDef>) => {
    const next = fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f))
    onChange(next)
  }

  const remove = (i: number) => onChange(fields.filter((_, idx) => idx !== i))

  const add = () =>
    onChange([...fields, { name: 'newField', type: 'string', optional: false }])

  return (
    <div className="space-y-2">
      {fields.map((f, i) => (
        <div key={i} className="flex gap-1.5 items-center group">
          <input
            value={f.name}
            onChange={(e) => update(i, { name: e.target.value })}
            placeholder="name"
            className="flex-1 min-w-0 px-2 py-1 text-xs border border-gray-200 rounded font-mono outline-none focus:border-blue-400"
          />
          <input
            value={f.type}
            onChange={(e) => update(i, { type: e.target.value })}
            placeholder="type"
            className="w-20 px-2 py-1 text-xs border border-gray-200 rounded font-mono outline-none focus:border-blue-400"
          />
          <button
            onClick={() => update(i, { optional: !f.optional })}
            title="Toggle optional"
            className={clsx(
              'px-1.5 py-1 text-xs rounded border transition-colors',
              f.optional
                ? 'border-amber-300 text-amber-600 bg-amber-50'
                : 'border-gray-200 text-gray-400'
            )}
          >
            ?
          </button>
          <button
            onClick={() => remove(i)}
            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
          >
            <Trash2 size={11} />
          </button>
        </div>
      ))}
      <AddButton onClick={add} label="新增欄位" />
    </div>
  )
}

// ─── Individual editors ───────────────────────────────────────────────

function InterfaceEditor({
  data,
  onChange,
}: {
  data: InterfaceData
  onChange: (p: Partial<InterfaceData>) => void
}) {
  return (
    <>
      <Field label="Interface 名稱">
        <Input value={data.name} onChange={(v) => onChange({ name: v })} mono />
      </Field>
      <Field label="欄位">
        <FieldListEditor fields={data.fields} onChange={(fields) => onChange({ fields })} />
      </Field>
    </>
  )
}

function DtoEditor({
  data,
  onChange,
}: {
  data: DtoData
  onChange: (p: Partial<DtoData>) => void
}) {
  return (
    <>
      <Field label="DTO 名稱">
        <Input value={data.name} onChange={(v) => onChange({ name: v })} mono />
      </Field>
      <Field label="驗證器">
        <Select
          value={data.validator}
          onChange={(v) => onChange({ validator: v as DtoData['validator'] })}
          options={[
            { label: 'Zod', value: 'zod' },
            { label: 'class-validator', value: 'class-validator' },
            { label: '無', value: 'none' },
          ]}
        />
      </Field>
      <Field label="欄位">
        <FieldListEditor fields={data.fields} onChange={(fields) => onChange({ fields })} />
      </Field>
    </>
  )
}

function EnumEditor({
  data,
  onChange,
}: {
  data: EnumData
  onChange: (p: Partial<EnumData>) => void
}) {
  const updateValue = (i: number, patch: Partial<{ key: string; value: string }>) => {
    const next = data.values.map((v, idx) => (idx === i ? { ...v, ...patch } : v))
    onChange({ values: next })
  }
  const removeValue = (i: number) => onChange({ values: data.values.filter((_, idx) => idx !== i) })
  const addValue = () => onChange({ values: [...data.values, { key: 'NEW_VALUE', value: 'new_value' }] })

  return (
    <>
      <Field label="Enum 名稱">
        <Input value={data.name} onChange={(v) => onChange({ name: v })} mono />
      </Field>
      <Field label="樣式">
        <Select
          value={data.style}
          onChange={(v) => onChange({ style: v as 'string' | 'numeric' })}
          options={[
            { label: 'String', value: 'string' },
            { label: 'Numeric', value: 'numeric' },
          ]}
        />
      </Field>
      <Field label="值">
        <div className="space-y-1.5">
          {data.values.map((v, i) => (
            <div key={i} className="flex gap-1.5 items-center group">
              <input
                value={v.key}
                onChange={(e) => updateValue(i, { key: e.target.value })}
                placeholder="KEY"
                className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded font-mono outline-none focus:border-blue-400 uppercase"
              />
              <input
                value={v.value}
                onChange={(e) => updateValue(i, { value: e.target.value })}
                placeholder="value"
                className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded font-mono outline-none focus:border-blue-400"
              />
              <button
                onClick={() => removeValue(i)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          <AddButton onClick={addValue} label="新增值" />
        </div>
      </Field>
    </>
  )
}

function ApiEditor({
  data,
  onChange,
}: {
  data: ApiEndpointData
  onChange: (p: Partial<ApiEndpointData>) => void
}) {
  return (
    <>
      <Field label="HTTP 方法">
        <Select
          value={data.method}
          onChange={(v) => onChange({ method: v as ApiEndpointData['method'] })}
          options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => ({ label: m, value: m }))}
        />
      </Field>
      <Field label="路徑">
        <Input
          value={data.path}
          onChange={(v) => onChange({ path: v })}
          placeholder="/api/resource"
          mono
        />
      </Field>
      <Field label="說明">
        <Input value={data.summary} onChange={(v) => onChange({ summary: v })} placeholder="Endpoint description" />
      </Field>
      <Field label="回傳型別">
        <Input value={data.responseType} onChange={(v) => onChange({ responseType: v })} mono placeholder="Resource[]" />
      </Field>
      {(data.method === 'POST' || data.method === 'PUT' || data.method === 'PATCH') && (
        <Field label="Body 型別">
          <Input
            value={data.bodyType ?? ''}
            onChange={(v) => onChange({ bodyType: v })}
            mono
            placeholder="CreateResourceDto"
          />
        </Field>
      )}
      <Field label="Tags (逗號分隔)">
        <Input
          value={data.tags.join(', ')}
          onChange={(v) => onChange({ tags: v.split(',').map((t) => t.trim()).filter(Boolean) })}
          placeholder="users, admin"
        />
      </Field>
      <Toggle label="需要 Auth" value={data.auth} onChange={(v) => onChange({ auth: v })} />
    </>
  )
}

function QueryHookEditor({
  data,
  onChange,
}: {
  data: UseQueryData
  onChange: (p: Partial<UseQueryData>) => void
}) {
  return (
    <>
      <Field label="Hook 名稱">
        <Input value={data.hookName} onChange={(v) => onChange({ hookName: v })} mono />
      </Field>
      <Field label="API 端點">
        <Input value={data.endpoint} onChange={(v) => onChange({ endpoint: v })} mono placeholder="/api/resource" />
      </Field>
      <Field label="回傳型別">
        <Input value={data.responseType} onChange={(v) => onChange({ responseType: v })} mono />
      </Field>
      <Field label="Stale Time (ms)">
        <Input
          value={String(data.staleTime)}
          onChange={(v) => onChange({ staleTime: Number(v) || 300000 })}
          mono
        />
      </Field>
      <Field label="重試次數">
        <Input
          value={String(data.retry)}
          onChange={(v) => onChange({ retry: Number(v) || 3 })}
          mono
        />
      </Field>
    </>
  )
}

function MutationHookEditor({
  data,
  onChange,
}: {
  data: UseMutationData
  onChange: (p: Partial<UseMutationData>) => void
}) {
  return (
    <>
      <Field label="Hook 名稱">
        <Input value={data.hookName} onChange={(v) => onChange({ hookName: v })} mono />
      </Field>
      <Field label="HTTP 方法">
        <Select
          value={data.method}
          onChange={(v) => onChange({ method: v as UseMutationData['method'] })}
          options={['POST', 'PUT', 'PATCH', 'DELETE'].map((m) => ({ label: m, value: m }))}
        />
      </Field>
      <Field label="API 端點">
        <Input value={data.endpoint} onChange={(v) => onChange({ endpoint: v })} mono />
      </Field>
      <Field label="Body 型別">
        <Input value={data.bodyType} onChange={(v) => onChange({ bodyType: v })} mono />
      </Field>
      <Field label="回傳型別">
        <Input value={data.responseType} onChange={(v) => onChange({ responseType: v })} mono />
      </Field>
      <Field label="成功後 invalidate (逗號分隔)">
        <Input
          value={data.onSuccessInvalidate.join(', ')}
          onChange={(v) =>
            onChange({ onSuccessInvalidate: v.split(',').map((t) => t.trim()).filter(Boolean) })
          }
          placeholder="useUsersQuery"
          mono
        />
      </Field>
    </>
  )
}

function DataTableEditor({
  data,
  onChange,
}: {
  data: DataTableData
  onChange: (p: Partial<DataTableData>) => void
}) {
  const updateCol = (i: number, patch: Partial<DataTableData['columns'][0]>) => {
    const next = data.columns.map((c, idx) => (idx === i ? { ...c, ...patch } : c))
    onChange({ columns: next })
  }
  const removeCol = (i: number) => onChange({ columns: data.columns.filter((_, idx) => idx !== i) })
  const addCol = () =>
    onChange({ columns: [...data.columns, { key: 'newCol', label: 'New Column', sortable: true }] })

  return (
    <>
      <Field label="組件名稱">
        <Input value={data.componentName} onChange={(v) => onChange({ componentName: v })} mono />
      </Field>
      <Field label="資料型別">
        <Input value={data.dataType} onChange={(v) => onChange({ dataType: v })} mono />
      </Field>
      <Toggle label="分頁" value={data.pagination} onChange={(v) => onChange({ pagination: v })} />
      <Toggle label="搜尋" value={data.searchable} onChange={(v) => onChange({ searchable: v })} />
      <Field label="欄位">
        <div className="space-y-1.5">
          {data.columns.map((col, i) => (
            <div key={i} className="flex gap-1.5 items-center group">
              <input
                value={col.key}
                onChange={(e) => updateCol(i, { key: e.target.value })}
                placeholder="key"
                className="flex-1 min-w-0 px-2 py-1 text-xs border border-gray-200 rounded font-mono outline-none focus:border-blue-400"
              />
              <input
                value={col.label}
                onChange={(e) => updateCol(i, { label: e.target.value })}
                placeholder="Label"
                className="flex-1 min-w-0 px-2 py-1 text-xs border border-gray-200 rounded outline-none focus:border-blue-400"
              />
              <button
                onClick={() => updateCol(i, { sortable: !col.sortable })}
                title="Toggle sortable"
                className={clsx(
                  'px-1.5 py-1 text-xs rounded border transition-colors',
                  col.sortable
                    ? 'border-blue-300 text-blue-600 bg-blue-50'
                    : 'border-gray-200 text-gray-400'
                )}
              >
                ↕
              </button>
              <button
                onClick={() => removeCol(i)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
          <AddButton onClick={addCol} label="新增欄位" />
        </div>
      </Field>
    </>
  )
}

function FormEditor({
  data,
  onChange,
}: {
  data: FormData
  onChange: (p: Partial<FormData>) => void
}) {
  const updateField = (i: number, patch: Partial<FormData['fields'][0]>) => {
    const next = data.fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f))
    onChange({ fields: next })
  }
  const removeField = (i: number) =>
    onChange({ fields: data.fields.filter((_, idx) => idx !== i) })
  const addField = () =>
    onChange({
      fields: [...data.fields, { name: 'newField', label: 'New Field', type: 'text', required: false }],
    })

  return (
    <>
      <Field label="組件名稱">
        <Input value={data.componentName} onChange={(v) => onChange({ componentName: v })} mono />
      </Field>
      <Field label="DTO 型別">
        <Input value={data.dtoType} onChange={(v) => onChange({ dtoType: v })} mono />
      </Field>
      <Field label="驗證器">
        <Select
          value={data.validator}
          onChange={(v) => onChange({ validator: v as FormData['validator'] })}
          options={[
            { label: 'Zod', value: 'zod' },
            { label: 'react-hook-form', value: 'react-hook-form' },
          ]}
        />
      </Field>
      <Field label="表單欄位">
        <div className="space-y-1.5">
          {data.fields.map((f, i) => (
            <div key={i} className="space-y-1 border border-gray-100 rounded p-2 group relative">
              <button
                onClick={() => removeField(i)}
                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
              >
                <Trash2 size={10} />
              </button>
              <div className="flex gap-1.5">
                <input
                  value={f.name}
                  onChange={(e) => updateField(i, { name: e.target.value })}
                  placeholder="name"
                  className="flex-1 min-w-0 px-2 py-1 text-xs border border-gray-200 rounded font-mono outline-none focus:border-blue-400"
                />
                <select
                  value={f.type}
                  onChange={(e) => updateField(i, { type: e.target.value as any })}
                  className="w-20 px-1 py-1 text-xs border border-gray-200 rounded outline-none focus:border-blue-400 bg-white"
                >
                  {['text', 'email', 'password', 'number', 'select', 'textarea', 'checkbox'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <input
                value={f.label}
                onChange={(e) => updateField(i, { label: e.target.value })}
                placeholder="Label"
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded outline-none focus:border-blue-400"
              />
            </div>
          ))}
          <AddButton onClick={addField} label="新增欄位" />
        </div>
      </Field>
    </>
  )
}
