import { create } from 'zustand'
import type { GeneratedCode } from '@block-builder/types'

interface DiffStore {
  previousCode: GeneratedCode | null
  setPreviousCode: (code: GeneratedCode | null) => void
}

export const useDiffStore = create<DiffStore>((set) => ({
  previousCode: null,
  setPreviousCode: (code) => set({ previousCode: code }),
}))

// ─── Diff computation ─────────────────────────────────────────────────
export interface FileDiff {
  path: string
  status: 'added' | 'removed' | 'modified' | 'unchanged'
  oldContent?: string
  newContent?: string
  additions: number
  deletions: number
}

export function computeDiff(
  prev: GeneratedCode | null,
  curr: GeneratedCode
): FileDiff[] {
  const diffs: FileDiff[] = []

  const prevMap = new Map(prev?.files.map(f => [f.path, f.content]) ?? [])
  const currMap = new Map(curr.files.map(f => [f.path, f.content]))

  // Added + Modified files
  for (const file of curr.files) {
    const oldContent = prevMap.get(file.path)
    if (!oldContent) {
      diffs.push({
        path: file.path,
        status: 'added',
        newContent: file.content,
        additions: file.content.split('\n').length,
        deletions: 0,
      })
    } else if (oldContent !== file.content) {
      const { additions, deletions } = countChanges(oldContent, file.content)
      diffs.push({
        path: file.path,
        status: 'modified',
        oldContent,
        newContent: file.content,
        additions,
        deletions,
      })
    } else {
      diffs.push({ path: file.path, status: 'unchanged', newContent: file.content, additions: 0, deletions: 0 })
    }
  }

  // Removed files
  for (const [path, content] of prevMap) {
    if (!currMap.has(path)) {
      diffs.push({
        path,
        status: 'removed',
        oldContent: content,
        deletions: content.split('\n').length,
        additions: 0,
      })
    }
  }

  return diffs.sort((a, b) => {
    const order = { modified: 0, added: 1, removed: 2, unchanged: 3 }
    return order[a.status] - order[b.status]
  })
}

function countChanges(oldText: string, newText: string): { additions: number; deletions: number } {
  const oldLines = new Set(oldText.split('\n'))
  const newLines = new Set(newText.split('\n'))
  let additions = 0, deletions = 0
  for (const line of newText.split('\n')) if (!oldLines.has(line)) additions++
  for (const line of oldText.split('\n')) if (!newLines.has(line)) deletions++
  return { additions, deletions }
}

// ─── Inline diff renderer ─────────────────────────────────────────────
export interface DiffLine {
  type: 'add' | 'remove' | 'context'
  content: string
  lineNum?: number
}

export function computeInlineDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const result: DiffLine[] = []

  // Simple LCS-based diff
  const m = Math.min(oldLines.length, 200)
  const n = Math.min(newLines.length, 200)
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = oldLines[i-1] === newLines[j-1]
        ? dp[i-1][j-1] + 1
        : Math.max(dp[i-1][j], dp[i][j-1])

  // Traceback
  const changes: DiffLine[] = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i-1] === newLines[j-1]) {
      changes.unshift({ type: 'context', content: oldLines[i-1], lineNum: j })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      changes.unshift({ type: 'add', content: newLines[j-1], lineNum: j })
      j--
    } else {
      changes.unshift({ type: 'remove', content: oldLines[i-1] })
      i--
    }
  }

  // Only show context around changes (3 lines each side)
  const changeIdxs = new Set(changes.map((c, i) => c.type !== 'context' ? i : -1).filter(i => i >= 0))
  const visible = new Set<number>()
  for (const idx of changeIdxs) {
    for (let k = Math.max(0, idx - 3); k <= Math.min(changes.length - 1, idx + 3); k++) {
      visible.add(k)
    }
  }

  let lastVisible = -1
  for (let k = 0; k < changes.length; k++) {
    if (visible.has(k)) {
      if (lastVisible >= 0 && k - lastVisible > 1) {
        result.push({ type: 'context', content: `... ${k - lastVisible - 1} lines unchanged ...` })
      }
      result.push(changes[k])
      lastVisible = k
    }
  }

  return result.length > 0 ? result : [{ type: 'context', content: '// No changes' }]
}
