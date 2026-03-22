import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CanvasState, ProjectSettings } from '@block-builder/types'

export interface SavedProject {
  id: string
  name: string
  description: string
  canvas: CanvasState
  settings: ProjectSettings
  createdAt: string
  updatedAt: string
  thumbnail?: string
}

interface PersistStore {
  projects: SavedProject[]
  activeProjectId: string | null

  saveProject: (project: Omit<SavedProject, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => string
  loadProject: (id: string) => SavedProject | null
  deleteProject: (id: string) => void
  duplicateProject: (id: string) => string
  setActiveProject: (id: string | null) => void
  getActiveProject: () => SavedProject | null
}

export const usePersistStore = create<PersistStore>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,

      saveProject: (project) => {
        const now = new Date().toISOString()
        const id = project.id ?? `proj_${Date.now()}`
        const existing = get().projects.find((p) => p.id === id)

        const saved: SavedProject = {
          ...project,
          id,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        }

        set((s) => ({
          projects: existing
            ? s.projects.map((p) => (p.id === id ? saved : p))
            : [...s.projects, saved],
          activeProjectId: id,
        }))
        return id
      },

      loadProject: (id) => {
        return get().projects.find((p) => p.id === id) ?? null
      },

      deleteProject: (id) => {
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
        }))
      },

      duplicateProject: (id) => {
        const project = get().projects.find((p) => p.id === id)
        if (!project) return ''
        const newId = `proj_${Date.now()}`
        const now = new Date().toISOString()
        const duplicate: SavedProject = {
          ...structuredClone(project),
          id: newId,
          name: `${project.name} (複製)`,
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ projects: [...s.projects, duplicate] }))
        return newId
      },

      setActiveProject: (id) => set({ activeProjectId: id }),

      getActiveProject: () => {
        const { projects, activeProjectId } = get()
        return projects.find((p) => p.id === activeProjectId) ?? null
      },
    }),
    {
      name: 'block-builder-projects',
      version: 1,
    }
  )
)
