import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Group {
  id: string
  name: string
  nodeIds: string[]
  collapsed: boolean
  color: string
  position: { x: number; y: number }
}

interface GroupStore {
  groups: Group[]
  createGroup: (nodeIds: string[], name?: string) => void
  toggleCollapse: (groupId: string) => void
  dissolve: (groupId: string) => void
  rename: (groupId: string, name: string) => void
  getGroupForNode: (nodeId: string) => Group | null
}

const COLORS = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#ede9fe', '#ffedd5']

export const useGroupStore = create<GroupStore>()(
  persist(
    (set, get) => ({
      groups: [],
      createGroup: (nodeIds, name) => {
        const id = 'grp-' + Date.now()
        const color = COLORS[get().groups.length % COLORS.length]
        set(s => ({
          groups: [...s.groups, {
            id, name: name ?? 'Group ' + (s.groups.length + 1),
            nodeIds, collapsed: false, color,
            position: { x: 0, y: 0 },
          }],
        }))
      },
      toggleCollapse: (groupId) =>
        set(s => ({
          groups: s.groups.map(g =>
            g.id === groupId ? { ...g, collapsed: !g.collapsed } : g
          ),
        })),
      dissolve: (groupId) =>
        set(s => ({ groups: s.groups.filter(g => g.id !== groupId) })),
      rename: (groupId, name) =>
        set(s => ({
          groups: s.groups.map(g => g.id === groupId ? { ...g, name } : g),
        })),
      getGroupForNode: (nodeId) =>
        get().groups.find(g => g.nodeIds.includes(nodeId)) ?? null,
    }),
    { name: 'bb-groups' }
  )
)
