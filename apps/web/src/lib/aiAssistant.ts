import type { CanvasNode, CanvasEdge, BlockCategory } from '@block-builder/types'
import { BLOCK_DEF_MAP } from '../lib/blockDefinitions'

export type AiProvider = 'claude' | 'gemini' | 'groq'

export interface AiConfig {
  provider: AiProvider
  apiKey: string
}

export interface AiGenerateResult {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  explanation: string
}

export interface AiReviewResult {
  issues: { severity: 'error' | 'warning' | 'suggestion'; message: string; nodeId?: string }[]
  score: number
  summary: string
}

// ─── Storage helpers ──────────────────────────────────────────────────
export function getAiConfig(): AiConfig | null {
  const provider = (localStorage.getItem('bb-ai-provider') ?? 'gemini') as AiProvider
  const key = localStorage.getItem(`bb-ai-key-${provider}`)
  if (!key) return null
  return { provider, apiKey: key }
}

export function saveAiConfig(provider: AiProvider, apiKey: string) {
  localStorage.setItem('bb-ai-provider', provider)
  localStorage.setItem(`bb-ai-key-${provider}`, apiKey)
}

// ─── Unified AI call ──────────────────────────────────────────────────
async function callAi(config: AiConfig, systemPrompt: string, userMessage: string): Promise<string> {
  if (config.provider === 'gemini') {
    return callGemini(config.apiKey, systemPrompt, userMessage)
  } else if (config.provider === 'groq') {
    return callGroq(config.apiKey, systemPrompt, userMessage)
  } else {
    return callClaude(config.apiKey, systemPrompt, userMessage)
  }
}

// ─── Gemini ───────────────────────────────────────────────────────────
async function callGemini(apiKey: string, system: string, user: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 4000 },
      }),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any
    throw new Error(err?.error?.message ?? `Gemini API error ${res.status}`)
  }
  const data = await res.json() as any
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

// ─── Groq ─────────────────────────────────────────────────────────────
async function callGroq(apiKey: string, system: string, user: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any
    throw new Error(err?.error?.message ?? `Groq API error ${res.status}`)
  }
  const data = await res.json() as any
  return data.choices?.[0]?.message?.content ?? ''
}

// ─── Claude ───────────────────────────────────────────────────────────
async function callClaude(apiKey: string, system: string, user: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any
    throw new Error(err?.error?.message ?? `Claude API error ${res.status}`)
  }
  const data = await res.json() as any
  return data.content?.[0]?.text ?? ''
}

// ─── Prompts ──────────────────────────────────────────────────────────
const CANVAS_SYSTEM_PROMPT = `You are an expert software architect assistant for Block Builder, a visual TypeScript code generator.

Given a user's description of a system, you generate a JSON configuration of blocks and connections.

Available block kinds and their categories:
TYPE: interface, dto, enum, pagination
API: api-endpoint (methods: GET/POST/PUT/PATCH/DELETE), nest-module, nest-service, nest-repository
LOGIC: use-query, use-mutation, store, infinite-scroll
AUTH: auth-guard, jwt, oauth
INFRA: middleware, cache, email, job, websocket, stripe, file-upload
UI: data-table, form, chart, card, search-bar, notification, navigation, modal
LAYOUT: page

Rules:
- Always start with type blocks (interface/dto/enum)
- API endpoints come after types
- Hooks (use-query/use-mutation) come after API endpoints
- UI components come last
- Connect type → api → hook → ui in that order
- Add auth-guard + jwt when user mentions login/auth/protected
- Add cache when user mentions performance/fast/cache
- Add websocket when user mentions real-time/live/chat

Respond ONLY with valid JSON in this exact format, no markdown, no explanation outside JSON:
{
  "explanation": "Brief explanation of what you designed",
  "nodes": [
    {
      "id": "n1",
      "defId": "interface",
      "category": "type",
      "label": "User Interface",
      "x": 60, "y": 60,
      "data": { "kind": "interface", "name": "User", "fields": [{"name": "id", "type": "string"}, {"name": "email", "type": "string"}, {"name": "name", "type": "string"}] }
    }
  ],
  "edges": [
    { "id": "e1", "source": "n1", "target": "n2" }
  ]
}`

const REVIEW_SYSTEM_PROMPT = `You are a senior TypeScript/Node.js code reviewer specializing in API design and security.

Analyze the provided canvas configuration and identify issues.

Respond ONLY with valid JSON, no markdown:
{
  "score": 85,
  "summary": "Brief overall assessment",
  "issues": [
    { "severity": "error", "message": "GET /api/users has no auth guard", "nodeId": "n1" },
    { "severity": "warning", "message": "Missing cache for frequent read endpoint" },
    { "severity": "suggestion", "message": "Consider adding pagination to list endpoints" }
  ]
}`

const ARCH_SYSTEM_PROMPT = `You are a software architecture consultant. Analyze the current system design and provide specific, actionable improvement suggestions.

Respond ONLY with valid JSON, no markdown:
{
  "suggestions": [
    {
      "title": "Add Rate Limiting",
      "description": "Your API has no rate limiting. Add Middleware block with rate limit config.",
      "priority": "high",
      "blockToAdd": "middleware"
    }
  ]
}`

// ─── Parse JSON from AI response ──────────────────────────────────────
function parseJson(text: string): any {
  // Strip markdown code blocks if present
  const clean = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  // Find first { to last }
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON found in AI response')

  return JSON.parse(clean.slice(start, end + 1))
}

// ─── Main functions ───────────────────────────────────────────────────
export async function generateCanvasFromPrompt(
  prompt: string,
  config: AiConfig,
  existingNodes: CanvasNode[] = []
): Promise<AiGenerateResult> {
  const context = existingNodes.length > 0
    ? `\n\nExisting blocks: ${existingNodes.map(n => `${n.data.label}(${n.data.blockData.kind})`).join(', ')}. Add to these without duplicating.`
    : ''

  const text = await callAi(config, CANVAS_SYSTEM_PROMPT, `Design a system for: ${prompt}${context}`)
  const parsed = parseJson(text)
  return buildCanvasResult(parsed)
}

export async function reviewCanvas(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  config: AiConfig
): Promise<AiReviewResult> {
  const summary = nodes.map(n => {
    const d = n.data.blockData as any
    return { id: n.id, kind: d.kind, label: n.data.label,
      details: { ...(d.path ? { path: d.path, method: d.method, auth: d.auth } : {}), ...(d.name ? { name: d.name } : {}) } }
  })
  const text = await callAi(config, REVIEW_SYSTEM_PROMPT,
    `Review this API design:\nBlocks: ${JSON.stringify(summary, null, 2)}`)
  return parseJson(text)
}

export async function getArchitectureSuggestions(
  nodes: CanvasNode[],
  config: AiConfig
): Promise<{ suggestions: any[] }> {
  const kinds = [...new Set(nodes.map(n => n.data.blockData.kind))]
  const text = await callAi(config, ARCH_SYSTEM_PROMPT,
    `Current system uses: ${kinds.join(', ')}. Blocks: ${nodes.map(n => n.data.label).join(', ')}`)
  return parseJson(text)
}

function buildCanvasResult(parsed: any): AiGenerateResult {
  const nodes: CanvasNode[] = parsed.nodes.map((n: any, i: number) => {
    const def = BLOCK_DEF_MAP[n.defId] ?? Object.values(BLOCK_DEF_MAP)[0]
    return {
      id: n.id ?? `ai-${i}-${Date.now()}`,
      type: 'blockNode' as const,
      position: { x: n.x ?? 60 + (i % 4) * 260, y: n.y ?? 60 + Math.floor(i / 4) * 180 },
      data: {
        blockDefId: n.defId ?? def.id,
        category: (n.category ?? def.category) as BlockCategory,
        label: n.label ?? def.label,
        blockData: { ...structuredClone(def.defaultData), ...n.data } as any,
      },
    }
  })

  const edges: CanvasEdge[] = (parsed.edges ?? []).map((e: any) => ({
    id: e.id ?? `ae-${Date.now()}-${Math.random()}`,
    source: e.source, sourceHandle: 'output',
    target: e.target, targetHandle: 'input',
    type: 'smartEdge', data: { invalid: false, label: null },
  }))

  return { nodes, edges, explanation: parsed.explanation ?? '' }
}

// Field autocomplete — no API needed, just local rules
export function autocompleteField(fieldName: string): { type: string; validation: string[]; optional: boolean } {
  const lower = fieldName.toLowerCase()
  const rules: Record<string, { type: string; validation: string[]; optional: boolean }> = {
    id: { type: 'string', validation: [], optional: false },
    email: { type: 'string', validation: ['email()'], optional: false },
    password: { type: 'string', validation: ['min(8)'], optional: false },
    name: { type: 'string', validation: ['min(1)', 'max(255)'], optional: false },
    price: { type: 'number', validation: ['min(0)'], optional: false },
    quantity: { type: 'number', validation: ['int()', 'min(0)'], optional: false },
    url: { type: 'string', validation: ['url()'], optional: true },
    avatar: { type: 'string', validation: ['url()'], optional: true },
    slug: { type: 'string', validation: ['regex(/^[a-z0-9-]+$/)'], optional: false },
    description: { type: 'string', validation: ['max(1000)'], optional: true },
    title: { type: 'string', validation: ['min(1)', 'max(200)'], optional: false },
    createdAt: { type: 'Date', validation: [], optional: true },
    updatedAt: { type: 'Date', validation: [], optional: true },
    isActive: { type: 'boolean', validation: [], optional: true },
  }
  for (const [key, rule] of Object.entries(rules)) {
    if (lower === key) return rule
  }
  if (lower.endsWith('id')) return { type: 'string', validation: [], optional: false }
  if (lower.endsWith('at') || lower.includes('date')) return { type: 'Date', validation: [], optional: true }
  if (lower.startsWith('is') || lower.startsWith('has')) return { type: 'boolean', validation: [], optional: true }
  if (lower.endsWith('count') || lower.endsWith('total')) return { type: 'number', validation: ['int()', 'min(0)'], optional: false }
  return { type: 'string', validation: [], optional: false }
}

// ─── AI modify existing canvas ────────────────────────────────────────
const MODIFY_SYSTEM_PROMPT = `You are an expert assistant for Block Builder, a visual TypeScript code generator.

The user has an existing canvas with blocks and wants to modify it.
You must return ONLY the modified blocks as JSON - only include blocks that need to change.

Respond ONLY with valid JSON:
{
  "explanation": "What was changed",
  "modifications": [
    {
      "id": "existing-node-id",
      "action": "update",
      "data": { "kind": "interface", "name": "User", "fields": [...updated fields...] }
    }
  ],
  "additions": [
    {
      "defId": "interface",
      "category": "type",
      "label": "New Block",
      "x": 400, "y": 200,
      "data": { "kind": "interface", "name": "NewType", "fields": [] }
    }
  ],
  "removals": ["node-id-to-remove"]
}`

export async function modifyCanvasWithAi(
  instruction: string,
  currentNodes: CanvasNode[],
  config: AiConfig
): Promise<{
  explanation: string
  modifications: { id: string; action: 'update'; data: any }[]
  additions: any[]
  removals: string[]
}> {
  const nodesSummary = currentNodes.map(n => ({
    id: n.id,
    label: n.data.label,
    kind: n.data.blockData.kind,
    data: n.data.blockData,
  }))

  const text = await callAi(
    config,
    MODIFY_SYSTEM_PROMPT,
    `Current canvas blocks:\n${JSON.stringify(nodesSummary, null, 2)}\n\nInstruction: ${instruction}`
  )

  const parsed = parseJson(text)
  return {
    explanation: parsed.explanation ?? '',
    modifications: parsed.modifications ?? [],
    additions: parsed.additions ?? [],
    removals: parsed.removals ?? [],
  }
}

// ─── AI explain code ──────────────────────────────────────────────────
const EXPLAIN_SYSTEM_PROMPT = `You are a TypeScript expert. Explain the provided code clearly in Traditional Chinese (繁體中文).
Focus on:
1. What this file does
2. Key functions/classes and their purpose
3. How it connects to other parts of the system
4. Any important patterns or techniques used
Keep explanation concise but complete (3-5 paragraphs).`

export async function explainCode(
  filePath: string,
  code: string,
  config: AiConfig
): Promise<string> {
  return callAi(
    config,
    EXPLAIN_SYSTEM_PROMPT,
    `File: ${filePath}\n\n\`\`\`typescript\n${code.slice(0, 3000)}\n\`\`\``
  )
}
