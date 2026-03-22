import React, { useMemo, useState, useCallback } from 'react'
import Editor, { DiffEditor, loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import {
  FileCode, FileText, AlertCircle, AlertTriangle, CheckCircle,
  Copy, Check, GitCompare, Code2, ChevronRight, Plus, Minus, Minus as MinusIcon,
} from 'lucide-react'
import clsx from 'clsx'
import { useCanvasStore } from '../../stores/canvasStore'
import { useThemeStore } from '../../stores/themeStore'
import { validateCanvas } from '../../lib/validation'
import { useDiffStore, computeDiff, computeInlineDiff, type FileDiff } from '../../stores/diffStore'
import { useHighlightStore, getBlockForFile } from '../../stores/highlightStore'
import { useCanvasStore as useCanvasForFlash } from '../../stores/canvasStore'
import type { GeneratedFile } from '@block-builder/types'

const FILE_ICONS: Record<string, React.ReactNode> = {
  typescript: <FileCode size={11} className="text-blue-500" />,
  yaml:       <FileText size={11} className="text-amber-500" />,
  json:       <FileText size={11} className="text-green-500" />,
  markdown:   <FileText size={11} className="text-gray-400" />,
  prisma:     <FileText size={11} className="text-indigo-500" />,
  dockerfile: <FileText size={11} className="text-blue-400" />,
}

const CATEGORY_LABELS: Record<string, string> = {
  type: '型別', api: 'API', hook: 'Hooks', component: '組件',
  spec: '規格', infra: '基礎設施', test: '測試', module: 'Module', service: 'Service',
}

const CATEGORY_ORDER = ['type', 'api', 'module', 'service', 'hook', 'component', 'test', 'spec', 'infra']

const STATUS_COLORS: Record<FileDiff['status'], string> = {
  added:     'text-green-600 bg-green-50',
  modified:  'text-amber-600 bg-amber-50',
  removed:   'text-red-500 bg-red-50',
  unchanged: 'text-gray-400',
}

const STATUS_ICONS: Record<FileDiff['status'], React.ReactNode> = {
  added:     <Plus size={9} />,
  modified:  <GitCompare size={9} />,
  removed:   <Minus size={9} />,
  unchanged: null,
}

type OutputTab = 'code' | 'diff' | 'openapi'

export function OutputPanel() {
  const { generatedCode, activeOutputFile, setActiveOutputFile, isGenerating, nodes } = useCanvasStore()
  const { dark } = useThemeStore()
  const { previousCode } = useDiffStore()
  const [tab, setTab] = useState<OutputTab>('code')
  const [copied, setCopied] = useState(false)
  const { flash } = useHighlightStore()

  const handleFileClick = (filePath: string) => {
    setActiveOutputFile(filePath)
    // Find which node corresponds to this file and flash it
    const blockDefIds = getBlockForFile(filePath)
    if (blockDefIds.length > 0) {
      const matchNode = nodes.find(n => blockDefIds.includes(n.data.blockDefId))
      if (matchNode) {
        flash(matchNode.id)
        window.dispatchEvent(new CustomEvent('bb:focus-node', { detail: { nodeId: matchNode.id } }))
      }
    }
  }

  const activeFile = useMemo(
    () => generatedCode?.files.find(f => f.path === activeOutputFile),
    [generatedCode, activeOutputFile]
  )

  const grouped = useMemo(() => {
    if (!generatedCode) return {}
    return generatedCode.files.reduce<Record<string, GeneratedFile[]>>((acc, f) => {
      if (!acc[f.category]) acc[f.category] = []
      acc[f.category].push(f)
      return acc
    }, {})
  }, [generatedCode])

  const diffs = useMemo(
    () => generatedCode ? computeDiff(previousCode, generatedCode) : [],
    [previousCode, generatedCode]
  )

  const changedCount = diffs.filter(d => d.status !== 'unchanged').length

  const validation = useMemo(() => {
    if (nodes.length === 0) return null
    return validateCanvas(nodes)
  }, [nodes])

  const handleCopy = useCallback(() => {
    if (!activeFile) return
    navigator.clipboard.writeText(activeFile.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [activeFile])

  const monacoLang = (file?: GeneratedFile) => {
    if (!file) return 'typescript'
    if (file.language === 'yaml') return 'yaml'
    if (file.language === 'prisma') return 'prisma'
    if (file.path.endsWith('.json')) return 'json'
    return 'typescript'
  }

  const monacoTheme = dark ? 'vs-dark' : 'vs'

  // Force Monaco to update theme globally when dark mode changes
  React.useEffect(() => {
    loader.init().then(monaco => {
      monaco.editor.setTheme(dark ? 'vs-dark' : 'vs')
    }).catch(() => {})
  }, [dark])

  // Diff view for selected file
  const activeDiff = useMemo(
    () => diffs.find(d => d.path === activeOutputFile),
    [diffs, activeOutputFile]
  )

  return (
    <aside className={clsx(
      'flex flex-col overflow-hidden border-l transition-all h-full',
      dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
    )}>
      {/* Tabs */}
      <div className={clsx('flex border-b flex-shrink-0', dark ? 'border-gray-700' : 'border-gray-200')}>
        {[
          { id: 'code' as OutputTab,    label: 'TypeScript',  icon: <Code2 size={11} /> },
          { id: 'diff' as OutputTab,    label: `Diff${changedCount > 0 ? ` (${changedCount})` : ''}`, icon: <GitCompare size={11} /> },
          { id: 'openapi' as OutputTab, label: 'OpenAPI',     icon: <FileText size={11} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition-colors',
              tab === t.id
                ? dark ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800' : 'text-blue-600 border-b-2 border-blue-500 bg-blue-50'
                : dark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Validation bar */}
      {validation && (
        <div className={clsx(
          'flex items-center gap-2 px-3 py-1.5 text-xs border-b flex-shrink-0',
          validation.errors.length > 0 ? 'bg-red-50 border-red-100' :
          validation.warnings.length > 0 ? 'bg-amber-50 border-amber-100' :
          nodes.length > 0 ? 'bg-green-50 border-green-100' : ''
        )}>
          {validation.errors.length > 0 ? (
            <><AlertCircle size={11} className="text-red-500 flex-shrink-0" />
            <span className="text-red-700 font-medium truncate">{validation.errors.length} 個錯誤 — {validation.errors[0]?.message}</span></>
          ) : validation.warnings.length > 0 ? (
            <><AlertTriangle size={11} className="text-amber-500 flex-shrink-0" />
            <span className="text-amber-700 truncate">{validation.warnings.length} 個警告</span></>
          ) : nodes.length > 0 ? (
            <><CheckCircle size={11} className="text-green-500 flex-shrink-0" />
            <span className="text-green-700">驗證通過</span></>
          ) : null}
        </div>
      )}

      {/* Loading */}
      {isGenerating && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-400">生成中...</p>
          </div>
        </div>
      )}

      {/* Empty */}
      {!isGenerating && !generatedCode && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-3xl mb-3 opacity-10">{'{ }'}</div>
            <p className="text-xs text-gray-400 font-medium">拖入積木後自動生成</p>
          </div>
        </div>
      )}

      {/* Content */}
      {!isGenerating && generatedCode && (
        <>
          {/* Summary bar */}
          <div className={clsx(
            'px-3 py-1.5 border-b flex-shrink-0',
            dark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'
          )}>
            <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
              <span>{generatedCode.summary.totalFiles} 檔案</span>
              {generatedCode.summary.endpoints.length > 0 && <span>{generatedCode.summary.endpoints.length} API</span>}
              {generatedCode.summary.types.length > 0 && <span>{generatedCode.summary.types.length} 型別</span>}
              {changedCount > 0 && tab !== 'diff' && (
                <button onClick={() => setTab('diff')} className="text-amber-500 hover:text-amber-700 font-medium">
                  {changedCount} 項變更
                </button>
              )}
            </div>
          </div>

          {/* ── CODE TAB ─────────────────────────────────── */}
          {tab === 'code' && (
            <div className="flex flex-col overflow-hidden flex-1">
              {/* File tree */}
              <div className={clsx('border-b overflow-y-auto max-h-48 flex-shrink-0', dark ? 'border-gray-700' : 'border-gray-100')}>
                {CATEGORY_ORDER.filter(cat => grouped[cat]?.length > 0).map(cat => (
                  <div key={cat}>
                    <div className={clsx(
                      'px-3 py-1 text-xs font-medium uppercase tracking-wider',
                      cat === 'test' ? dark ? 'bg-green-900 text-green-400' : 'bg-green-50 text-green-600' :
                      dark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-400'
                    )}>
                      {CATEGORY_LABELS[cat] ?? cat}
                    </div>
                    {grouped[cat].map(file => (
                      <button key={file.path} onClick={() => handleFileClick(file.path)}
                        className={clsx(
                          'w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors text-xs',
                          activeOutputFile === file.path
                            ? dark ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700'
                            : dark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-50 text-gray-600'
                        )}
                      >
                        {FILE_ICONS[file.language] ?? <FileCode size={11} />}
                        <span className="font-mono truncate flex-1 text-xs">{file.path.split('/').pop()}</span>
                        {/* Diff indicator */}
                        {diffs.find(d => d.path === file.path && d.status !== 'unchanged') && (
                          <span className={clsx('text-xs flex-shrink-0', STATUS_COLORS[diffs.find(d => d.path === file.path)!.status])}>
                            {STATUS_ICONS[diffs.find(d => d.path === file.path)!.status]}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {/* Editor */}
              <div className="flex-1 overflow-hidden">
                {activeFile ? (
                  <>
                    <div className={clsx(
                      'px-3 py-1.5 text-xs font-mono flex items-center justify-between border-b flex-shrink-0',
                      dark ? 'text-gray-400 bg-gray-800 border-gray-700' : 'text-gray-400 bg-gray-50 border-gray-100'
                    )}>
                      <span className="truncate flex-1">{activeFile.path}</span>
                      <button onClick={handleCopy} title="複製" className="ml-2 p-1 rounded hover:bg-gray-200 transition-colors flex-shrink-0">
                        {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} className="text-gray-400" />}
                      </button>
                    </div>
                    <Editor
                      height="100%"
                      language={monacoLang(activeFile)}
                      value={activeFile.content}
                      theme={monacoTheme}
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 11,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        padding: { top: 8, bottom: 8 },
                        renderLineHighlight: 'none',
                        scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
                        fontFamily: 'JetBrains Mono, Fira Code, monospace',
                      }}
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-gray-300">選擇一個檔案預覽</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── DIFF TAB ─────────────────────────────────── */}
          {tab === 'diff' && (
            <div className="flex flex-col overflow-hidden flex-1">
              {diffs.filter(d => d.status !== 'unchanged').length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-2">
                  <CheckCircle size={24} className="opacity-40" />
                  <p className="text-sm">沒有任何變更</p>
                  <p className="text-xs text-gray-400">修改積木後重新生成才會出現差異</p>
                </div>
              ) : (
                <>
                  {/* Diff file list */}
                  <div className={clsx('border-b overflow-y-auto max-h-40 flex-shrink-0', dark ? 'border-gray-700' : 'border-gray-100')}>
                    {diffs.filter(d => d.status !== 'unchanged').map(diff => (
                      <button key={diff.path} onClick={() => setActiveOutputFile(diff.path)}
                        className={clsx(
                          'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors text-xs',
                          activeOutputFile === diff.path ? 'bg-gray-100' : ''
                        )}
                      >
                        <span className={clsx('flex items-center gap-1 font-medium', STATUS_COLORS[diff.status])}>
                          {STATUS_ICONS[diff.status]}
                          {diff.status}
                        </span>
                        <span className="font-mono text-gray-600 flex-1 truncate">{diff.path.split('/').pop()}</span>
                        <span className="flex-shrink-0 flex items-center gap-1">
                          {diff.additions > 0 && <span className="text-green-600">+{diff.additions}</span>}
                          {diff.deletions > 0 && <span className="text-red-500">-{diff.deletions}</span>}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Monaco Diff Editor */}
                  <div className="flex-1 overflow-hidden">
                    {activeDiff && (activeDiff.status === 'modified') ? (
                      <DiffEditor
                        height="100%"
                        language={monacoLang(generatedCode.files.find(f => f.path === activeOutputFile))}
                        original={activeDiff.oldContent ?? ''}
                        modified={activeDiff.newContent ?? ''}
                        theme={monacoTheme}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          fontSize: 11,
                          renderSideBySide: false,
                          scrollbar: { verticalScrollbarSize: 4 },
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                      />
                    ) : activeDiff && activeDiff.status === 'added' ? (
                      <div className="h-full overflow-auto p-3 font-mono text-xs bg-green-50">
                        {activeDiff.newContent?.split('\n').map((line, i) => (
                          <div key={i} className="flex gap-2 text-green-700">
                            <span className="text-green-400 select-none w-4">+</span>
                            <span>{line}</span>
                          </div>
                        ))}
                      </div>
                    ) : activeDiff && activeDiff.status === 'removed' ? (
                      <div className="h-full overflow-auto p-3 font-mono text-xs bg-red-50">
                        {activeDiff.oldContent?.split('\n').map((line, i) => (
                          <div key={i} className="flex gap-2 text-red-600">
                            <span className="text-red-400 select-none w-4">-</span>
                            <span>{line}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300 text-xs">
                        點擊左側檔案查看差異
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── OPENAPI TAB ──────────────────────────────── */}
          {tab === 'openapi' && (() => {
            const openapiFile = generatedCode.files.find(f => f.path === 'openapi.yaml')
            return openapiFile ? (
              <div className="flex-1 overflow-hidden">
                <Editor
                  height="100%"
                  language="yaml"
                  value={openapiFile.content}
                  theme={monacoTheme}
                  options={{
                    readOnly: true, minimap: { enabled: false }, fontSize: 11,
                    scrollBeyondLastLine: false, wordWrap: 'on',
                    scrollbar: { verticalScrollbarSize: 4 },
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-300 text-xs">
                新增 API 端點積木後會生成 OpenAPI 規格
              </div>
            )
          })()}
        </>
      )}
    </aside>
  )
}
