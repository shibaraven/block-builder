import React, { useState } from 'react'
import { Settings, Key, Eye, EyeOff, ExternalLink, CheckCircle } from 'lucide-react'
import { useCanvasStore } from '../../stores/canvasStore'
import { DraggableModal } from './DraggableModal'
import clsx from 'clsx'

const FRAMEWORKS = [
  { id: 'react',   label: 'React',   desc: '+ Vite + TanStack Query', color: 'text-blue-600' },
  { id: 'vue',     label: 'Vue 3',   desc: '+ Vite + Pinia',          color: 'text-green-600' },
  { id: 'svelte',  label: 'Svelte',  desc: '+ SvelteKit',             color: 'text-orange-600' },
]

const API_FRAMEWORKS = [
  { id: 'hono',     label: 'Hono',     desc: '輕量、邊緣相容' },
  { id: 'nestjs',   label: 'NestJS',   desc: '完整 Module 架構' },
  { id: 'express',  label: 'Express',  desc: '經典、彈性' },
  { id: 'fastify',  label: 'Fastify',  desc: '高效能' },
  { id: 'graphql',  label: 'GraphQL',  desc: 'NestJS + GraphQL' },
  { id: 'trpc',     label: 'tRPC',     desc: '端對端型別安全' },
]

const PKG_MANAGERS = ['pnpm', 'npm', 'yarn']

const OUTPUT_LANGUAGES = [
  { id: 'typescript', label: 'TypeScript', flag: '🟦' },
  { id: 'python',     label: 'Python',     flag: '🐍' },
  { id: 'go',         label: 'Go',         flag: '🐹' },
  { id: 'java',       label: 'Java',       flag: '☕' },
]

const AI_PROVIDERS = [
  { id: 'gemini', label: 'Gemini', sub: '免費', color: 'text-blue-600',   link: 'https://aistudio.google.com/app/apikey' },
  { id: 'groq',   label: 'Groq',   sub: '免費', color: 'text-orange-600', link: 'https://console.groq.com' },
  { id: 'claude', label: 'Claude', sub: '付費', color: 'text-violet-600', link: 'https://console.anthropic.com/settings/keys' },
]

interface SettingsModalProps { onClose: () => void }

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { project, updateProjectSettings, setProjectName } = useCanvasStore()
  const { settings } = project

  const [apiKey, setApiKey]     = useState(() => {
    const p = localStorage.getItem('bb-ai-provider') ?? 'gemini'
    return localStorage.getItem(`bb-ai-key-${p}`) ?? ''
  })
  const [aiProvider, setAiProvider] = useState(() => localStorage.getItem('bb-ai-provider') ?? 'gemini')
  const [showKey,  setShowKey]  = useState(false)
  const [keySaved, setKeySaved] = useState(false)

  const switchProvider = (id: string) => {
    setAiProvider(id)
    localStorage.setItem('bb-ai-provider', id)
    setApiKey(localStorage.getItem(`bb-ai-key-${id}`) ?? '')
  }

  const saveApiKey = () => {
    localStorage.setItem(`bb-ai-key-${aiProvider}`, apiKey)
    localStorage.setItem('bb-ai-provider', aiProvider)
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 2000)
  }

  const footer = (
    <button
      onClick={onClose}
      className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
    >
      儲存設定
    </button>
  )

  return (
    <DraggableModal
      title="專案設定"
      icon={<Settings size={14} />}
      onClose={onClose}
      footer={footer}
      width={500}
      maxHeight="85vh"
    >
      <div className="p-5 space-y-6">

        {/* Project name */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1.5">專案名稱</label>
          <input
            type="text"
            value={project.name}
            onChange={e => setProjectName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        </div>

        {/* Frontend framework */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">前端框架</label>
          <div className="grid grid-cols-3 gap-2">
            {FRAMEWORKS.map(f => (
              <button key={f.id}
                onClick={() => updateProjectSettings({ framework: f.id as any })}
                className={clsx(
                  'p-3 rounded-xl border text-left transition-all',
                  settings.framework === f.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <p className={clsx('text-sm font-semibold', settings.framework === f.id ? 'text-blue-700' : 'text-gray-700')}>{f.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* API framework */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">後端框架</label>
          <div className="grid grid-cols-2 gap-2">
            {API_FRAMEWORKS.map(f => (
              <button key={f.id}
                onClick={() => updateProjectSettings({ apiFramework: f.id as any })}
                className={clsx(
                  'p-3 rounded-xl border text-left transition-all',
                  settings.apiFramework === f.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <p className={clsx('text-sm font-semibold', settings.apiFramework === f.id ? 'text-blue-700' : 'text-gray-700')}>{f.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Package manager */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">套件管理器</label>
          <div className="flex gap-2">
            {PKG_MANAGERS.map(pm => (
              <button key={pm}
                onClick={() => updateProjectSettings({ packageManager: pm as any })}
                className={clsx(
                  'flex-1 py-2 rounded-lg border text-sm font-mono font-medium transition-all',
                  settings.packageManager === pm ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {pm}
              </button>
            ))}
          </div>
        </div>

        {/* Output language */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">輸出語言</label>
          <div className="grid grid-cols-4 gap-2">
            {OUTPUT_LANGUAGES.map(lang => (
              <button key={lang.id}
                onClick={() => updateProjectSettings({ outputLanguage: lang.id as any })}
                className={clsx(
                  'p-2.5 rounded-xl border text-center transition-all',
                  (settings as any).outputLanguage === lang.id || (!((settings as any).outputLanguage) && lang.id === 'typescript')
                    ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="text-lg">{lang.flag}</div>
                <p className="text-xs font-medium text-gray-600 mt-0.5">{lang.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* AI Provider */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">AI 助手設定</label>
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-3 gap-1.5">
              {AI_PROVIDERS.map(p => (
                <button key={p.id}
                  onClick={() => switchProvider(p.id)}
                  className={clsx(
                    'p-2 rounded-lg border text-center transition-all',
                    aiProvider === p.id ? 'border-violet-400 bg-white shadow-sm' : 'border-transparent bg-white/50 hover:bg-white'
                  )}
                >
                  <p className={clsx('text-xs font-semibold', p.color)}>{p.label}</p>
                  <p className="text-xs text-gray-400">{p.sub}</p>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="貼上 API Key..."
                  className="w-full pl-3 pr-8 py-2 text-xs font-mono border border-violet-200 rounded-lg outline-none focus:border-violet-400 bg-white"
                  onKeyDown={e => e.key === 'Enter' && saveApiKey()}
                />
                <button onClick={() => setShowKey(s => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <button onClick={saveApiKey}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex-shrink-0">
                {keySaved ? <><CheckCircle size={11} />已儲存</> : <><Key size={11} />儲存</>}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-violet-600">Key 只存在本機瀏覽器</p>
              <a href={AI_PROVIDERS.find(p => p.id === aiProvider)?.link ?? '#'}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 underline">
                免費申請 <ExternalLink size={10} />
              </a>
            </div>

            {apiKey && (
              <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 rounded-lg px-2.5 py-1.5">
                <CheckCircle size={11} className="text-green-500 flex-shrink-0" />
                已設定！點工具列「✦ AI」開始使用
              </div>
            )}
          </div>
        </div>

      </div>
    </DraggableModal>
  )
}
