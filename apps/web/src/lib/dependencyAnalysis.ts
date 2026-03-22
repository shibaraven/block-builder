import type { CanvasNode, CanvasEdge } from '@block-builder/types'

export interface ImpactResult {
  directDeps: string[]    // nodes directly connected
  transitiveDeps: string[] // all downstream nodes
  affectedFiles: string[]  // generated files that would change
}

// ─── Build adjacency map ──────────────────────────────────────────────
function buildGraph(nodes: CanvasNode[], edges: CanvasEdge[]): Map<string, string[]> {
  const graph = new Map<string, string[]>()
  for (const node of nodes) graph.set(node.id, [])
  for (const edge of edges) {
    const targets = graph.get(edge.source) ?? []
    targets.push(edge.target)
    graph.set(edge.source, targets)
  }
  return graph
}

function buildReverseGraph(nodes: CanvasNode[], edges: CanvasEdge[]): Map<string, string[]> {
  const graph = new Map<string, string[]>()
  for (const node of nodes) graph.set(node.id, [])
  for (const edge of edges) {
    const sources = graph.get(edge.target) ?? []
    sources.push(edge.source)
    graph.set(edge.target, sources)
  }
  return graph
}

// ─── BFS to find all downstream nodes ────────────────────────────────
function bfsDownstream(startId: string, graph: Map<string, string[]>): string[] {
  const visited = new Set<string>()
  const queue = [startId]
  while (queue.length > 0) {
    const curr = queue.shift()!
    if (visited.has(curr)) continue
    visited.add(curr)
    for (const next of graph.get(curr) ?? []) {
      if (!visited.has(next)) queue.push(next)
    }
  }
  visited.delete(startId)
  return [...visited]
}

// ─── Get impact of removing/changing a node ───────────────────────────
export function getImpact(
  nodeId: string,
  nodes: CanvasNode[],
  edges: CanvasEdge[]
): ImpactResult {
  const forward = buildGraph(nodes, edges)
  const reverse = buildReverseGraph(nodes, edges)

  // Direct deps = nodes that use this node (reverse edges)
  const directDeps = reverse.get(nodeId) ?? []

  // All downstream = everything that depends on this, transitively
  const allDownstream = bfsDownstream(nodeId, reverse)

  // Which generated files would be affected
  const affectedNodes = [nodeId, ...allDownstream]
    .map(id => nodes.find(n => n.id === id))
    .filter(Boolean) as CanvasNode[]

  const affectedFiles = getAffectedFiles(affectedNodes)

  return {
    directDeps,
    transitiveDeps: allDownstream,
    affectedFiles,
  }
}

function getAffectedFiles(nodes: CanvasNode[]): string[] {
  const files: string[] = []
  for (const n of nodes) {
    const d = n.data.blockData as any
    const name = (d.name ?? d.componentName ?? d.hookName ?? n.data.label)
      .replace(/\s+/g, '-').toLowerCase()

    switch (d.kind) {
      case 'interface':
      case 'dto':
      case 'enum':        files.push(`src/types/${name}.ts`); break
      case 'api-endpoint': files.push(`src/api/routes/api-${name}.ts`, 'openapi.yaml'); break
      case 'use-query':
      case 'use-mutation': files.push(`src/hooks/${name}.ts`); break
      case 'data-table':
      case 'form':
      case 'chart':        files.push(`src/components/${name}.tsx`); break
      case 'nest-service': files.push(`src/modules/${name}.service.ts`); break
      case 'nest-module':  files.push(`src/modules/${name}.module.ts`); break
    }
  }
  return [...new Set(files)]
}

// ─── Check if canvas has cycles ───────────────────────────────────────
export function detectCycles(nodes: CanvasNode[], edges: CanvasEdge[]): string[][] {
  const graph = buildGraph(nodes, edges)
  const cycles: string[][] = []
  const visited = new Set<string>()
  const inStack = new Set<string>()
  const stack: string[] = []

  function dfs(nodeId: string) {
    visited.add(nodeId)
    inStack.add(nodeId)
    stack.push(nodeId)

    for (const next of graph.get(nodeId) ?? []) {
      if (!visited.has(next)) dfs(next)
      else if (inStack.has(next)) {
        const cycleStart = stack.indexOf(next)
        cycles.push(stack.slice(cycleStart))
      }
    }

    stack.pop()
    inStack.delete(nodeId)
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) dfs(node.id)
  }
  return cycles
}
