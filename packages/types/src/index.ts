// ─── Block Categories ────────────────────────────────────────────────
export type BlockCategory = 'api' | 'type' | 'ui' | 'logic' | 'auth' | 'infra' | 'layout'

// ─── Block Definitions ───────────────────────────────────────────────
export interface BlockDefinition {
  id: string
  category: BlockCategory
  label: string
  description: string
  icon: string
  color: string
  defaultData: BlockData
  inputs: PortDefinition[]
  outputs: PortDefinition[]
}

export interface PortDefinition {
  id: string
  label: string
  type: PortType
  required?: boolean
}

export type PortType =
  | 'typescript-type'
  | 'api-endpoint'
  | 'react-component'
  | 'hook'
  | 'middleware'
  | 'service'
  | 'any'

// ─── All Block Data types ────────────────────────────────────────────
export type BlockData =
  // API
  | ApiEndpointData
  // Types
  | InterfaceData
  | DtoData
  | EnumData
  // Logic
  | UseQueryData
  | UseMutationData
  | StoreData
  // UI
  | DataTableData
  | FormData
  | ModalData
  | CardData
  | NavigationData
  | SearchBarData
  | ChartData
  | NotificationData
  // Auth
  | AuthGuardData
  | JwtData
  | RolesData
  // Infra
  | MiddlewareData
  | CacheData
  | FileUploadData
  | EmailData
  | JobData
  | WebSocketData
  | PaginationData
  // NestJS
  | NestModuleData
  | NestServiceData
  | NestRepositoryData
  | PageData
  | OAuthData
  | StripeData
  | InfiniteScrollData

// ─── API ─────────────────────────────────────────────────────────────
export interface ApiEndpointData {
  kind: 'api-endpoint'
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  summary: string
  auth: boolean
  responseType: string
  bodyType?: string
  queryParams?: FieldDef[]
  tags: string[]
}

// ─── Types ───────────────────────────────────────────────────────────
export interface InterfaceData {
  kind: 'interface'
  name: string
  fields: FieldDef[]
  extends?: string[]
}

export interface DtoData {
  kind: 'dto'
  name: string
  fields: FieldDef[]
  validator: 'zod' | 'class-validator' | 'none'
}

export interface EnumData {
  kind: 'enum'
  name: string
  values: { key: string; value: string }[]
  style: 'string' | 'numeric'
}

// ─── Logic ───────────────────────────────────────────────────────────
export interface UseQueryData {
  kind: 'use-query'
  hookName: string
  endpoint: string
  responseType: string
  staleTime: number
  retry: number
}

export interface UseMutationData {
  kind: 'use-mutation'
  hookName: string
  endpoint: string
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  bodyType: string
  responseType: string
  onSuccessInvalidate: string[]
}

export interface StoreData {
  kind: 'store'
  name: string
  lib: 'zustand' | 'pinia' | 'redux'
  state: FieldDef[]
  actions: { name: string; description: string }[]
}

// ─── UI ──────────────────────────────────────────────────────────────
export interface DataTableData {
  kind: 'data-table'
  componentName: string
  dataType: string
  columns: ColumnDef[]
  pagination: boolean
  searchable: boolean
}

export interface FormData {
  kind: 'form'
  componentName: string
  dtoType: string
  fields: FormFieldDef[]
  onSubmit: string
  validator: 'zod' | 'react-hook-form'
}

export interface ModalData {
  kind: 'modal'
  componentName: string
  title: string
  contentComponent: string
  actions: { label: string; variant: 'primary' | 'secondary' | 'danger' }[]
}

export interface CardData {
  kind: 'card'
  componentName: string
  dataType: string
  fields: { key: string; label: string; type: string }[]
  actions: { label: string; variant: string }[]
}

export interface NavigationData {
  kind: 'navigation'
  componentName: string
  type: 'navbar' | 'sidebar' | 'tabs' | 'breadcrumb'
  items: { label: string; path: string; icon?: string }[]
  auth: boolean
}

export interface SearchBarData {
  kind: 'search-bar'
  componentName: string
  placeholder: string
  searchType: 'local' | 'remote'
  endpoint?: string
  debounce: number
  resultType: string
}

export interface ChartData {
  kind: 'chart'
  componentName: string
  chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter'
  dataType: string
  xKey: string
  yKey: string
  lib: 'recharts' | 'chartjs'
}

export interface NotificationData {
  kind: 'notification'
  componentName: string
  lib: 'sonner' | 'react-hot-toast' | 'shadcn'
  position: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center'
  types: ('success' | 'error' | 'warning' | 'info')[]
}

// ─── Auth ────────────────────────────────────────────────────────────
export interface AuthGuardData {
  kind: 'auth-guard'
  name: string
  strategy: 'jwt' | 'session' | 'api-key' | 'oauth'
  framework: 'nestjs' | 'hono' | 'express'
}

export interface JwtData {
  kind: 'jwt'
  name: string
  secret: string
  expiresIn: string
  refreshToken: boolean
  payload: FieldDef[]
}

export interface RolesData {
  kind: 'roles'
  name: string
  roles: string[]
  decorator: string
}

// ─── Infrastructure ───────────────────────────────────────────────────
export interface MiddlewareData {
  kind: 'middleware'
  name: string
  type: 'cors' | 'rate-limit' | 'logger' | 'compression' | 'helmet' | 'custom'
  options: Record<string, string>
}

export interface CacheData {
  kind: 'cache'
  name: string
  store: 'redis' | 'memory' | 'file'
  ttl: number
  keyPrefix: string
}

export interface FileUploadData {
  kind: 'file-upload'
  componentName: string
  accept: string[]
  maxSize: number
  multiple: boolean
  storage: 'local' | 's3' | 'cloudinary'
  endpoint: string
}

export interface EmailData {
  kind: 'email'
  name: string
  provider: 'nodemailer' | 'resend' | 'sendgrid' | 'ses'
  templates: { name: string; subject: string }[]
}

export interface JobData {
  kind: 'job'
  name: string
  type: 'cron' | 'queue' | 'interval'
  schedule?: string
  interval?: number
  lib: 'bullmq' | 'agenda' | 'node-cron'
}

export interface WebSocketData {
  kind: 'websocket'
  name: string
  namespace: string
  events: { name: string; payload: string; direction: 'in' | 'out' | 'both' }[]
  framework: 'socket.io' | 'ws' | 'nestjs-gateway'
}

export interface PaginationData {
  kind: 'pagination'
  name: string
  type: 'offset' | 'cursor' | 'infinite'
  defaultLimit: number
  maxLimit: number
  sortable: boolean
}

// ─── NestJS specific ──────────────────────────────────────────────────
export interface NestModuleData {
  kind: 'nest-module'
  name: string
  imports: string[]
  providers: string[]
  exports: string[]
  controllers: string[]
  global: boolean
}

export interface NestServiceData {
  kind: 'nest-service'
  name: string
  injectable: boolean
  methods: { name: string; params: string; returnType: string; description: string }[]
  dependencies: string[]
}

export interface NestRepositoryData {
  kind: 'nest-repository'
  name: string
  entity: string
  orm: 'prisma' | 'typeorm' | 'drizzle'
  methods: ('findAll' | 'findOne' | 'create' | 'update' | 'delete' | 'count' | 'findMany')[]
}


export interface PageData {
  kind: 'page'
  name: string
  path: string
  title: string
  protected: boolean
  layout: 'default' | 'auth' | 'dashboard' | 'fullscreen'
}

export interface OAuthData {
  kind: 'oauth'
  name: string
  providers: ('google' | 'github' | 'discord' | 'facebook')[]
  callbackPath: string
  successRedirect: string
}

export interface StripeData {
  kind: 'stripe'
  name: string
  products: { name: string; priceId: string; amount: number; currency: string }[]
  successUrl: string
  cancelUrl: string
  webhookEndpoint: string
}

export interface InfiniteScrollData {
  kind: 'infinite-scroll'
  hookName: string
  endpoint: string
  responseType: string
  cursorField: string
  pageSize: number
}

// ─── Field helpers ────────────────────────────────────────────────────
export interface FieldDef {
  name: string
  type: string
  optional?: boolean
  description?: string
  validation?: string[]
  defaultValue?: string
}

export interface ColumnDef {
  key: string
  label: string
  sortable?: boolean
  type?: 'string' | 'number' | 'date' | 'boolean' | 'badge'
}

export interface FormFieldDef {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'date' | 'file'
  placeholder?: string
  options?: { label: string; value: string }[]
  required?: boolean
}

// ─── Canvas Node ──────────────────────────────────────────────────────
export interface CanvasNode {
  id: string
  type: 'blockNode'
  position: { x: number; y: number }
  data: {
    blockDefId: string
    category: BlockCategory
    label: string
    blockData: BlockData
  }
}

export interface CanvasEdge {
  id: string
  source: string
  sourceHandle: string
  target: string
  targetHandle: string
  type?: 'smoothstep' | 'bezier' | 'straight'
  label?: string
  animated?: boolean
  style?: Record<string, string>
}

// ─── Project ──────────────────────────────────────────────────────────
export interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  canvas: CanvasState
  settings: ProjectSettings
}

export interface CanvasState {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  viewport: { x: number; y: number; zoom: number }
}

export type ApiFramework = 'nestjs' | 'hono' | 'express' | 'fastify' | 'graphql' | 'trpc'
export type OutputLanguage = 'typescript' | 'python' | 'go' | 'java'

export interface ProjectSettings {
  framework: 'react' | 'vue' | 'svelte'
  apiFramework: ApiFramework
  packageManager: 'npm' | 'yarn' | 'pnpm'
  outputPath: string
  outputLanguage?: OutputLanguage
}

// ─── Codegen output ───────────────────────────────────────────────────
export interface GeneratedCode {
  files: GeneratedFile[]
  summary: CodeSummary
}

export interface GeneratedFile {
  path: string
  content: string
  language: 'typescript' | 'yaml' | 'json' | 'markdown' | 'prisma' | 'dockerfile'
  category: 'type' | 'api' | 'component' | 'hook' | 'spec' | 'infra' | 'test' | 'module' | 'service'
}

export interface CodeSummary {
  totalFiles: number
  types: string[]
  endpoints: string[]
  components: string[]
  hooks: string[]
}

// ─── Connection validation ────────────────────────────────────────────
export type ConnectionRule = {
  from: BlockCategory[]
  to: BlockCategory[]
  label?: string
}

export const CONNECTION_RULES: ConnectionRule[] = [
  { from: ['type'], to: ['api', 'logic', 'ui', 'infra'], label: 'provides type' },
  { from: ['api'], to: ['logic', 'infra'], label: 'consumed by' },
  { from: ['logic'], to: ['ui', 'layout'], label: 'data to' },
  { from: ['auth'], to: ['api', 'infra'], label: 'guards' },
  { from: ['infra'], to: ['api', 'logic'], label: 'enhances' },
  { from: ['ui'], to: ['layout', 'ui'], label: 'composed into' },
  { from: ['layout'], to: ['layout'], label: 'nested in' },
]

export function isValidConnection(fromCategory: BlockCategory, toCategory: BlockCategory): boolean {
  return CONNECTION_RULES.some(
    (r) => r.from.includes(fromCategory) && r.to.includes(toCategory)
  )
}
