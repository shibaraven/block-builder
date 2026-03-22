import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type { Connection, Edge, EdgeChange, NodeChange } from 'reactflow'
import { addEdge, applyEdgeChanges, applyNodeChanges } from 'reactflow'
import type { CanvasNode, CanvasEdge, ProjectSettings, GeneratedCode } from '@block-builder/types'
import type { SavedProject } from './persistStore'

interface CanvasStore {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  selectedNodeId: string | null
  clipboard: CanvasNode | null
  project: { name: string; description: string; settings: ProjectSettings }
  generatedCode: GeneratedCode | null
  isGenerating: boolean
  activeOutputFile: string | null
  activeTab: 'typescript' | 'openapi'
  isSidebarCollapsed: boolean
  isOutputCollapsed: boolean
  saveRequested: number

  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void

  addNode: (node: CanvasNode) => void
  updateNodeData: (nodeId: string, data: Partial<CanvasNode['data']>) => void
  removeNode: (nodeId: string) => void
  selectNode: (nodeId: string | null) => void
  setNodesEdges: (nodes: CanvasNode[], edges: CanvasEdge[]) => void
  setClipboard: (node: CanvasNode) => void
  pasteClipboard: (offsetX?: number, offsetY?: number) => void

  setGeneratedCode: (code: GeneratedCode | null) => void
  setIsGenerating: (v: boolean) => void
  setActiveOutputFile: (path: string | null) => void
  setActiveTab: (tab: 'typescript' | 'openapi') => void

  updateProjectSettings: (settings: Partial<ProjectSettings>) => void
  setProjectName: (name: string) => void

  clearCanvas: () => void
  loadExample: () => void
  loadProjectData: (p: SavedProject) => void
  loadTemplateData: (templateId: string) => void
  triggerSave: () => void

  toggleSidebar: () => void
  toggleOutput: () => void
}

const EXAMPLE_NODES: CanvasNode[] = [
  { id: 'n1', type: 'blockNode', position: { x: 40, y: 60 }, data: { blockDefId: 'interface', category: 'type', label: 'User', blockData: { kind: 'interface', name: 'User', fields: [{ name: 'id', type: 'string' }, { name: 'name', type: 'string' }, { name: 'email', type: 'string' }, { name: 'createdAt', type: 'Date', optional: true }] } } },
  { id: 'n2', type: 'blockNode', position: { x: 40, y: 260 }, data: { blockDefId: 'dto', category: 'type', label: 'CreateUserDto', blockData: { kind: 'dto', name: 'CreateUserDto', fields: [{ name: 'name', type: 'string', validation: ['min(1)'] }, { name: 'email', type: 'string', validation: ['email()'] }, { name: 'password', type: 'string', validation: ['min(8)'] }], validator: 'zod' } } },
  { id: 'n3', type: 'blockNode', position: { x: 320, y: 60 }, data: { blockDefId: 'api-get', category: 'api', label: 'GET /users', blockData: { kind: 'api-endpoint', method: 'GET', path: '/api/users', summary: 'List all users', auth: true, responseType: 'User[]', tags: ['users'] } } },
  { id: 'n4', type: 'blockNode', position: { x: 320, y: 260 }, data: { blockDefId: 'api-post', category: 'api', label: 'POST /users', blockData: { kind: 'api-endpoint', method: 'POST', path: '/api/users', summary: 'Create a new user', auth: false, responseType: 'User', bodyType: 'CreateUserDto', tags: ['users'] } } },
  { id: 'n5', type: 'blockNode', position: { x: 600, y: 60 }, data: { blockDefId: 'use-query', category: 'logic', label: 'useUsersQuery', blockData: { kind: 'use-query', hookName: 'useUsersQuery', endpoint: '/api/users', responseType: 'User[]', staleTime: 300000, retry: 3 } } },
  { id: 'n6', type: 'blockNode', position: { x: 600, y: 260 }, data: { blockDefId: 'use-mutation', category: 'logic', label: 'useCreateUserMutation', blockData: { kind: 'use-mutation', hookName: 'useCreateUserMutation', endpoint: '/api/users', method: 'POST', bodyType: 'CreateUserDto', responseType: 'User', onSuccessInvalidate: ['useUsersQuery'] } } },
  { id: 'n7', type: 'blockNode', position: { x: 880, y: 60 }, data: { blockDefId: 'data-table', category: 'ui', label: 'UserTable', blockData: { kind: 'data-table', componentName: 'UserTable', dataType: 'User', columns: [{ key: 'id', label: 'ID', sortable: false }, { key: 'name', label: 'Name', sortable: true }, { key: 'email', label: 'Email', sortable: true }, { key: 'createdAt', label: 'Created', sortable: true, type: 'date' }], pagination: true, searchable: true } } },
  { id: 'n8', type: 'blockNode', position: { x: 880, y: 260 }, data: { blockDefId: 'form', category: 'ui', label: 'CreateUserForm', blockData: { kind: 'form', componentName: 'CreateUserForm', dtoType: 'CreateUserDto', fields: [{ name: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe', required: true }, { name: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com', required: true }, { name: 'password', label: 'Password', type: 'password', required: true }], onSubmit: 'useCreateUserMutation', validator: 'zod' } } },
]

const EXAMPLE_EDGES: CanvasEdge[] = [
  { id: 'e1-3', source: 'n1', sourceHandle: 'output', target: 'n3', targetHandle: 'input', type: 'smoothstep' },
  { id: 'e2-4', source: 'n2', sourceHandle: 'output', target: 'n4', targetHandle: 'input', type: 'smoothstep' },
  { id: 'e3-5', source: 'n3', sourceHandle: 'output', target: 'n5', targetHandle: 'input', type: 'smoothstep' },
  { id: 'e4-6', source: 'n4', sourceHandle: 'output', target: 'n6', targetHandle: 'input', type: 'smoothstep' },
  { id: 'e5-7', source: 'n5', sourceHandle: 'output', target: 'n7', targetHandle: 'input', type: 'smoothstep' },
  { id: 'e6-8', source: 'n6', sourceHandle: 'output', target: 'n8', targetHandle: 'input', type: 'smoothstep' },
]

export const useCanvasStore = create<CanvasStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      clipboard: null,
      project: {
        name: 'My Project',
        description: '',
        settings: { framework: 'react', apiFramework: 'hono', packageManager: 'pnpm', outputPath: './generated' },
      },
      generatedCode: null,
      isGenerating: false,
      activeOutputFile: null,
      activeTab: 'typescript',
      isSidebarCollapsed: false,
      isOutputCollapsed: false,
      saveRequested: 0,

      onNodesChange: (changes) =>
        set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) as CanvasNode[] })),

      onEdgesChange: (changes) =>
        set((s) => ({ edges: applyEdgeChanges(changes, s.edges) as CanvasEdge[] })),

      onConnect: (connection) =>
        set((s) => ({
          edges: addEdge({ ...connection, type: 'smoothstep', id: `e-${Date.now()}` }, s.edges) as CanvasEdge[],
        })),

      addNode: (node) => {
        import('../stores/timelineStore').then(({ useTimelineStore }) => {
          const s = get()
          useTimelineStore.getState().record('node:add', `新增 ${node.data.label}`, [...s.nodes, node], s.edges)
        })
        set((s) => ({ nodes: [...s.nodes, node] }))
      },

      updateNodeData: (nodeId, data) =>
        set((s) => ({
          nodes: s.nodes.map((n) => {
            if (n.id !== nodeId) return n
            const newData = { ...n.data, ...data }
            const bd = newData.blockData as any
            const nameVal = bd?.name || bd?.hookName || bd?.componentName ||
              (bd?.method && bd?.path ? `${bd.method} ${bd.path}` : null)
            if (nameVal) newData.label = nameVal
            return { ...n, data: newData }
          }),
        })),

      removeNode: (nodeId) =>
        set((s) => ({
          nodes: s.nodes.filter((n) => n.id !== nodeId),
          edges: s.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
          selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId,
        })),

      selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

      setNodesEdges: (nodes, edges) => set({ nodes, edges }),

      setClipboard: (node) => set({ clipboard: node }),

      pasteClipboard: (offsetX = 30, offsetY = 30) => {
        const { clipboard } = get()
        if (!clipboard) return
        const newNode: CanvasNode = {
          ...structuredClone(clipboard),
          id: `n-${Date.now()}`,
          position: { x: clipboard.position.x + offsetX, y: clipboard.position.y + offsetY },
        }
        set((s) => ({ nodes: [...s.nodes, newNode], selectedNodeId: newNode.id }))
      },

      setGeneratedCode: (code) => set({ generatedCode: code }),
      setIsGenerating: (v) => set({ isGenerating: v }),
      setActiveOutputFile: (path) => set({ activeOutputFile: path }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      updateProjectSettings: (settings) =>
        set((s) => ({ project: { ...s.project, settings: { ...s.project.settings, ...settings } } })),

      setProjectName: (name) => set((s) => ({ project: { ...s.project, name } })),

      clearCanvas: () => {
        import('../stores/timelineStore').then(({ useTimelineStore }) => {
          useTimelineStore.getState().record('canvas:clear', '清除畫布', [], [])
        })
        set({ nodes: [], edges: [], selectedNodeId: null, generatedCode: null })
      },

      loadExample: () => set({ nodes: EXAMPLE_NODES, edges: EXAMPLE_EDGES, selectedNodeId: null, generatedCode: null }),

      loadProjectData: (p) =>
        set({
          nodes: p.canvas.nodes,
          edges: p.canvas.edges,
          project: { name: p.name, description: p.description, settings: p.settings },
          generatedCode: null,
          selectedNodeId: null,
        }),

      loadTemplateData: (templateId: string) => {
        import('../lib/templates').then(({ TEMPLATE_MAP }) => {
          const t = TEMPLATE_MAP[templateId]
          if (!t) return
          set({ nodes: t.nodes, edges: t.edges, selectedNodeId: null, generatedCode: null })
        })
      },

      triggerSave: () => set((s) => ({ saveRequested: s.saveRequested + 1 })),

      toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
      toggleOutput: () => set((s) => ({ isOutputCollapsed: !s.isOutputCollapsed })),
    })),
    { name: 'canvas-store' }
  )
)
