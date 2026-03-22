import React, { useCallback, useRef, useState, useEffect } from 'react'
import ReactFlow, {
  Background, Controls, MiniMap, BackgroundVariant,
  ReactFlowProvider, useReactFlow, EdgeProps, getSmoothStepPath,
  BaseEdge, EdgeLabelRenderer,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useCanvasStore } from '../../stores/canvasStore'
import { BlockNode } from './BlockNode'
import { AlignToolbar } from './AlignToolbar'
import { ContextMenu, type ContextMenuState } from './ContextMenu'
import { SuggestionPanel } from './SuggestionPanel'
import { GuideBanner } from './GuideMode'
import { suggestName } from '../../lib/snapAndSuggest'
import { TimelinePanel } from './TimelinePanel'
import { useTimelineStore } from '../../stores/timelineStore'
import type { BlockDefinition, CanvasNode, BlockCategory } from '@block-builder/types'
import { isValidConnection } from '@block-builder/types'
import { useThemeStore } from '../../stores/themeStore'

const NODE_TYPES = { blockNode: BlockNode }

function SmartEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd, style }: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  const isInvalid = data?.invalid
  const color = isInvalid ? '#E24B4A' : '#378ADD'
  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, stroke: color, strokeWidth: isInvalid ? 2 : 1.5, strokeDasharray: '5 4', opacity: 0.7 }} />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'all' }}
            className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono text-gray-500 shadow-sm"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

const EDGE_TYPES = { smartEdge: SmartEdge }
const CATEGORY_MINIMAP_COLORS: Record<BlockCategory, string> = {
  api: '#378ADD', type: '#1D9E75', logic: '#BA7517', ui: '#D4537E',
  auth: '#7F77DD', infra: '#D85A30', layout: '#888780',
}

function CanvasInner({ onOpenSpotlight }: { onOpenSpotlight: () => void }) {
  const { nodes, edges, onNodesChange, onEdgesChange, addNode, selectNode, setNodesEdges } = useCanvasStore()
  const { screenToFlowPosition, fitView, setCenter } = useReactFlow()
  const { dark } = useThemeStore()
  const idRef = useRef(Date.now())

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null)
  const [suggestionNode, setSuggestionNode] = useState<CanvasNode | null>(null)
  const [snapHighlight, setSnapHighlight] = useState<string | null>(null)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)

  // Listen for focus-node events from GlobalSearch
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { nodeId } = e.detail
      const node = nodes.find(n => n.id === nodeId)
      if (node) {
        setCenter(node.position.x + 110, node.position.y + 60, { zoom: 1.2, duration: 500 })
        selectNode(nodeId)
      }
    }
    window.addEventListener('bb:focus-node', handler as EventListener)
    return () => window.removeEventListener('bb:focus-node', handler as EventListener)
  }, [nodes, setCenter, selectNode])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const raw = e.dataTransfer.getData('application/block-builder')
    if (!raw) return
    let blockDef: BlockDefinition
    try { blockDef = JSON.parse(raw) } catch { return }
    // Account for browser zoom level and devicePixelRatio
    const zoom = window.devicePixelRatio || 1
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    // Use clientX/Y relative to the ReactFlow container for accurate positioning
    const position = screenToFlowPosition({
      x: e.clientX,
      y: e.clientY,
    })
    const node: CanvasNode = {
      id: `n-${++idRef.current}`,
      type: 'blockNode',
      position,
      data: { blockDefId: blockDef.id, category: blockDef.category, label: blockDef.label, blockData: structuredClone(blockDef.defaultData) as any },
    }
    // Try auto-naming based on connected context
    const connectedCtx = nodes
      .filter(n => Math.abs(n.position.x - position.x) < 400 && Math.abs(n.position.y - position.y) < 400)
      .map(n => ({ defId: n.data.blockDefId, blockData: n.data.blockData }))
    const suggested = suggestName(blockDef.id, connectedCtx)
    if (suggested) {
      const bd = node.data.blockData as any
      if (bd.kind === 'api-endpoint') bd.path = suggested.replace(/^(GET|POST|PUT|DELETE|PATCH)\s/, '')
      else if (bd.hookName !== undefined) bd.hookName = suggested
      else if (bd.componentName !== undefined) bd.componentName = suggested
      else if (bd.name !== undefined) bd.name = suggested
      node.data.label = suggested
    }
    addNode(node)
    // Show suggestion panel after short delay
    setTimeout(() => setSuggestionNode(node), 300)
  }, [screenToFlowPosition, addNode])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleConnect = useCallback((connection: any) => {
    const sourceNode = nodes.find(n => n.id === connection.source)
    const targetNode = nodes.find(n => n.id === connection.target)
    if (!sourceNode || !targetNode) return
    const valid = isValidConnection(sourceNode.data.category, targetNode.data.category)
    useCanvasStore.getState().onConnect({
      ...connection,
      type: 'smartEdge',
      id: `e-${Date.now()}`,
      data: { invalid: !valid, label: null },
    } as any)
    // Dismiss suggestion panel on manual connect
    setSuggestionNode(null)
  }, [nodes])

  const handleSelectionChange = useCallback(({ nodes: sel }: { nodes: any[] }) => {
    const ids = sel.map((n: any) => n.id)
    setSelectedIds(ids)
    if (ids.length === 1) {
      selectNode(ids[0])
      setSuggestionNode(null)
    }
    else if (ids.length === 0) selectNode(null)
  }, [selectNode])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.react-flow__node')) return
    fitView({ padding: 0.15, duration: 400 })
  }, [fitView])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const nodeEl = (e.target as HTMLElement).closest('[data-id]')
    if (nodeEl) {
      const nodeId = nodeEl.getAttribute('data-id')
      if (nodeId) { setCtxMenu({ x: e.clientX, y: e.clientY, type: 'node', nodeId }); return }
    }
    setCtxMenu({ x: e.clientX, y: e.clientY, type: 'canvas' })
  }, [])

  // Auto-snap: highlight nodes close to dragging node
  const handleConnectStart = useCallback((_: any, { nodeId }: { nodeId: string | null }) => {
    setConnectingFrom(nodeId)
  }, [])

  const handleConnectEnd = useCallback(() => {
    setConnectingFrom(null)
  }, [])

  const handleNodeDrag = useCallback((_: React.MouseEvent, node: any) => {
    const SNAP = 100
    let nearest: string | null = null
    let minDist = SNAP
    for (const other of nodes) {
      if (other.id === node.id) continue
      const dist = Math.hypot(node.position.x - other.position.x, node.position.y - other.position.y)
      if (dist < minDist) { minDist = dist; nearest = other.id }
    }
    setSnapHighlight(nearest)
  }, [nodes])

  const handleNodeDragStop = useCallback((_: React.MouseEvent, node: any) => {
    if (snapHighlight) {
      const target = nodes.find(n => n.id === snapHighlight)
      if (target && isValidConnection(node.data.category, target.data.category)) {
        // Auto-create edge if close and valid
        const dist = Math.hypot(node.position.x - target.position.x, node.position.y - target.position.y)
        if (dist < 80) {
          useCanvasStore.getState().onConnect({
            source: node.id,
            sourceHandle: 'output',
            target: snapHighlight,
            targetHandle: 'input',
            type: 'smartEdge',
            id: `auto-${Date.now()}`,
            data: { invalid: false, label: null },
          } as any)
        }
      }
    }
    setSnapHighlight(null)
  }, [snapHighlight, nodes])

  // Highlight snap target on nodes
  const sourceNode = connectingFrom ? nodes.find(n => n.id === connectingFrom) : null
  const nodesWithSnap = nodes.map(n => ({
    ...n,
    className: n.id === snapHighlight
      ? 'ring-2 ring-green-400 ring-offset-1'
      : connectingFrom && n.id !== connectingFrom && sourceNode
        ? isValidConnection(sourceNode.data.category, n.data.category)
          ? 'ring-2 ring-blue-300 ring-offset-1 opacity-100'
          : 'opacity-40'
        : undefined,
  }))

  return (
    <div
      style={{ width: "100%", height: "100%", position: "relative" }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="text-5xl mb-4 opacity-10">⊞</div>
          <p className="text-sm text-gray-400 font-medium">從左側拖曳積木到這裡</p>
          <p className="text-xs text-gray-300 mt-1">按 Space 快速搜尋 · 雙擊空白處自動縮放</p>
        </div>
      )}

      <AlignToolbar selectedIds={selectedIds} />

      {/* Suggestion panel */}
      {suggestionNode && (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="pointer-events-auto">
            <SuggestionPanel
              node={suggestionNode}
              onClose={() => setSuggestionNode(null)}
            />
          </div>
        </div>
      )}

      {/* Guide banner */}
      <GuideBanner />

      {/* Timeline panel */}
      {useTimelineStore(s => s.isOpen) && <TimelinePanel />}

      {ctxMenu && (
        <ContextMenu
          menu={ctxMenu}
          onClose={() => setCtxMenu(null)}
          onOpenSpotlight={onOpenSpotlight}
        />
      )}

      <ReactFlow
        nodes={nodesWithSnap}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={(_, node) => { selectNode(node.id); setSuggestionNode(null) }}
        onPaneClick={() => { selectNode(null); setSelectedIds([]); setSuggestionNode(null) }}
        onSelectionChange={handleSelectionChange}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        onConnectStart={handleConnectStart}
        onConnectEnd={handleConnectEnd}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        defaultEdgeOptions={{ type: 'smartEdge' }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={2.5}
        multiSelectionKeyCode="Shift"
        selectionOnDrag
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={dark ? '#374151' : '#e5e7eb'} />
        <Controls position="bottom-left" showInteractive={false} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm" />
        <MiniMap
          position="bottom-right"
          maskColor={dark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)'}
          nodeColor={node => (CATEGORY_MINIMAP_COLORS as any)[(node.data as any)?.category] ?? '#888'}
          className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
        />
      </ReactFlow>
    </div>
  )
}

export function Canvas({ onOpenSpotlight }: { onOpenSpotlight: () => void }) {
  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: '100%' }}>
        <CanvasInner onOpenSpotlight={onOpenSpotlight} />
      </div>
    </ReactFlowProvider>
  )
}
