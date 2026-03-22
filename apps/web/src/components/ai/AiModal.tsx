import React, { useState, useRef, useEffect } from 'react'
import { X, Sparkles, Send, Bot, User, AlertCircle, CheckCircle, Lightbulb, RefreshCw } from 'lucide-react'
import { usePwaStore } from '../../stores/pwaStore'
import { generateCanvasFromPrompt, reviewCanvas, getArchitectureSuggestions, getAiConfig, modifyCanvasWithAi, explainCode, type AiConfig } from '../../lib/aiAssistant'
import { useCanvasStore } from '../../stores/canvasStore'
import { BLOCK_DEF_MAP } from '../../lib/blockDefinitions'
import clsx from 'clsx'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  type?: 'text' | 'review' | 'suggestions' | 'generated'
  data?: any
}

interface AiModalProps { onClose: () => void }

const QUICK_PROMPTS = [
  '幫我設計一個使用者管理系統，含 JWT 登入和角色權限',
  '建立一個部落格 API，有文章 CRUD 和留言功能',
  '電商後台，含商品管理、訂單系統和 Stripe 支付',
  '即時聊天應用，用 WebSocket 和 JWT 認證',
]

export function AiModal({ onClose }: AiModalProps) {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant', type: 'text',
    content: '你好！我是 Block Builder AI 助手。告訴我你想建立什麼系統，我會自動在畫布上生成對應的積木配置。\n\n你也可以要求我：\n• 審查目前的設計是否有問題\n• 給出架構改善建議\n• 新增更多積木到現有設計',
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<AiConfig | null>(() => getAiConfig())

  // Refresh config when modal opens
  React.useEffect(() => { setConfig(getAiConfig()) }, [])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { nodes, edges, addNode, onConnect, clearCanvas, setNodesEdges } = useCanvasStore()

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])


  const addMessage = (msg: Message) => setMessages(prev => [...prev, msg])

  const applyGeneratedCanvas = (result: any, merge = false) => {
    if (!merge) {
      setNodesEdges(result.nodes, result.edges)
    } else {
      result.nodes.forEach((n: any) => addNode(n))
      result.edges.forEach((e: any) => {
        onConnect({ source: e.source, sourceHandle: 'output', target: e.target, targetHandle: 'input' } as any)
      })
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const { isOnline } = usePwaStore.getState()
    if (!isOnline) {
      addMessage({ role: 'assistant', type: 'text', content: '⚠️ 目前離線中。AI 功能需要網路連線，但積木設計和代碼生成功能可以正常使用。' })
      return
    }
    if (!config) {
      addMessage({ role: 'assistant', type: 'text', content: '請先在⚙️ 設定面板中設定 AI API Key（支援免費的 Gemini 或 Groq）。' })
      return
    }

    const userMsg = input.trim()
    setInput('')
    addMessage({ role: 'user', type: 'text', content: userMsg })
    setLoading(true)

    try {
      const isReview  = /審查|review|檢查|問題|check/i.test(userMsg)
      const isArch    = /建議|suggest|改善|improve|architect/i.test(userMsg)
      const isModify  = /修改|改|把|更新|刪除欄位|加欄位|rename|change|update|modify/i.test(userMsg) && nodes.length > 0
      const isMerge   = /新增|加入|add|增加/i.test(userMsg) && nodes.length > 0 && !isModify

      if (isModify && nodes.length > 0) {
        const result = await modifyCanvasWithAi(userMsg, nodes, config)
        // Apply modifications
        result.modifications.forEach(mod => {
          const node = nodes.find(n => n.id === mod.id)
          if (node) useCanvasStore.getState().updateNodeData(mod.id, mod.data)
        })
        result.additions.forEach((add, i) => {
          const def = BLOCK_DEF_MAP[add.defId]
          if (!def) return
          addNode({
            id: `ai-mod-${Date.now()}-${i}`,
            type: 'blockNode',
            position: { x: add.x ?? 400, y: add.y ?? 200 },
            data: { blockDefId: def.id, category: def.category, label: add.label ?? def.label, blockData: { ...structuredClone(def.defaultData), ...add.data } as any },
          })
        })
        addMessage({ role: 'assistant', type: 'text', content: `✅ ${result.explanation}${result.modifications.length > 0 ? `

修改了 ${result.modifications.length} 個積木` : ''}${result.additions.length > 0 ? `
新增了 ${result.additions.length} 個積木` : ''}` })
      } else if (isReview && nodes.length > 0) {
        const result = await reviewCanvas(nodes, edges, config)
        addMessage({ role: 'assistant', type: 'review', content: result.summary, data: result })
      } else if (isArch && nodes.length > 0) {
        const result = await getArchitectureSuggestions(nodes, config)
        addMessage({ role: 'assistant', type: 'suggestions', content: '以下是架構改善建議：', data: result })
      } else {
        const result = await generateCanvasFromPrompt(userMsg, config, isMerge ? nodes : [])
        addMessage({
          role: 'assistant', type: 'generated',
          content: result.explanation,
          data: { result, merge: isMerge, nodeCount: result.nodes.length, edgeCount: result.edges.length },
        })
        applyGeneratedCanvas(result, isMerge)
      }
    } catch (e: any) {
      addMessage({ role: 'assistant', type: 'text', content: `❌ 錯誤：${e.message}\n\n請確認 API Key 是否正確，或稍後再試。` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
      <div className="pointer-events-auto w-[420px] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-in" style={{ height: '600px' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-blue-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
              <Sparkles size={14} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">AI 架構助手</p>
              <p className="text-xs text-gray-400">由 Claude 驅動</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="text-xs text-violet-400 font-medium mr-1">
              {config ? (config.provider === 'gemini' ? 'Gemini' : config.provider === 'groq' ? 'Groq' : 'Claude') : '未設定'}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white transition-colors">
              <X size={13} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* No API key warning */}
        {!config && (
          <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex-shrink-0">
            <p className="text-xs text-amber-700">
              尚未設定 API Key。請點工具列⚙️ <strong>設定</strong> → 選擇免費的 <strong>Gemini</strong> 或 <strong>Groq</strong> 並填入 Key。
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={clsx('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
              <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                msg.role === 'user' ? 'bg-blue-100' : 'bg-violet-100')}>
                {msg.role === 'user'
                  ? <User size={11} className="text-blue-600" />
                  : <Bot size={11} className="text-violet-600" />
                }
              </div>
              <div className={clsx('max-w-[300px] rounded-xl px-3 py-2 text-xs leading-relaxed',
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700')}>

                {/* Text message */}
                {msg.type === 'text' && <p className="whitespace-pre-wrap">{msg.content}</p>}

                {/* Generated canvas */}
                {msg.type === 'generated' && (
                  <>
                    <p className="whitespace-pre-wrap mb-2">{msg.content}</p>
                    <div className="bg-green-50 border border-green-200 rounded-lg px-2.5 py-2 mt-1">
                      <p className="text-green-700 font-medium flex items-center gap-1">
                        <CheckCircle size={11} /> 已生成 {msg.data.nodeCount} 個積木，{msg.data.edgeCount} 條連線
                      </p>
                    </div>
                  </>
                )}

                {/* Review result */}
                {msg.type === 'review' && msg.data && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium">設計評分：</p>
                      <span className={clsx('font-bold text-sm', msg.data.score >= 80 ? 'text-green-600' : msg.data.score >= 60 ? 'text-amber-600' : 'text-red-600')}>
                        {msg.data.score}/100
                      </span>
                    </div>
                    <p className="mb-2 text-gray-600">{msg.content}</p>
                    <div className="space-y-1.5">
                      {msg.data.issues?.map((issue: any, j: number) => (
                        <div key={j} className={clsx('flex items-start gap-1.5 rounded-lg px-2 py-1.5',
                          issue.severity === 'error' ? 'bg-red-50 text-red-700' :
                          issue.severity === 'warning' ? 'bg-amber-50 text-amber-700' :
                          'bg-blue-50 text-blue-700')}>
                          <AlertCircle size={10} className="flex-shrink-0 mt-0.5" />
                          <span>{issue.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Architecture suggestions */}
                {msg.type === 'suggestions' && msg.data && (
                  <div>
                    <p className="mb-2">{msg.content}</p>
                    <div className="space-y-2">
                      {msg.data.suggestions?.map((s: any, j: number) => (
                        <div key={j} className="bg-white border border-gray-200 rounded-lg px-2.5 py-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Lightbulb size={10} className={s.priority === 'high' ? 'text-red-500' : s.priority === 'medium' ? 'text-amber-500' : 'text-blue-500'} />
                            <span className="font-medium text-gray-800">{s.title}</span>
                          </div>
                          <p className="text-gray-500 text-xs">{s.description}</p>
                          {s.blockToAdd && BLOCK_DEF_MAP[s.blockToAdd] && (
                            <button
                              onClick={() => {
                                const def = BLOCK_DEF_MAP[s.blockToAdd]
                                addNode({
                                  id: `ai-sug-${Date.now()}`,
                                  type: 'blockNode',
                                  position: { x: 60 + nodes.length * 40, y: 60 + nodes.length * 40 },
                                  data: { blockDefId: def.id, category: def.category, label: def.label, blockData: structuredClone(def.defaultData) as any },
                                })
                              }}
                              className="mt-1.5 text-xs text-violet-600 hover:text-violet-800 font-medium"
                            >
                              + 加入 {BLOCK_DEF_MAP[s.blockToAdd]?.label}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                <RefreshCw size={11} className="text-violet-600 animate-spin" />
              </div>
              <div className="bg-gray-100 rounded-xl px-3 py-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex-shrink-0">
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => { setInput(p) }}
                  className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors truncate max-w-full">
                  {p.slice(0, 30)}...
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2 px-4 py-3 border-t border-gray-100 flex-shrink-0">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="描述你想建立的系統..."
            className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-8 h-8 flex items-center justify-center bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-40 transition-colors flex-shrink-0"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
