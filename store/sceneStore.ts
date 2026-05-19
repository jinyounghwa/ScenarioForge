import { create } from 'zustand'
import { Scene, normalizeScene } from '@/types'

interface SceneState {
  scenes: Scene[]
  currentSceneId: string | null
  isLoading: boolean
  loadScenes: () => Promise<void>
  createScene: (title: string, content: string, status?: Scene['status'], tags?: string[]) => Promise<void>
  updateScene: (id: string, updates: Partial<Pick<Scene, 'title' | 'content' | 'status' | 'tags'>>) => Promise<void>
  deleteScene: (id: string) => Promise<void>
  duplicateScene: (id: string) => Promise<void>
  reorderScenes: (sceneIds: string[]) => Promise<void>
  setCurrentSceneId: (id: string | null) => void
  getCurrentScene: () => Scene | undefined
}

export const useSceneStore = create<SceneState>((set, get) => ({
  scenes: [],
  currentSceneId: null,
  isLoading: false,

  loadScenes: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/scenes')
      const data = await res.json()
      const scenes = (data.scenes || []).map(normalizeScene)
      set({ scenes })
    } catch (e) {
      console.error('Failed to load scenes:', e)
    } finally {
      set({ isLoading: false })
    }
  },

  createScene: async (title, content, status = 'draft', tags = []) => {
    try {
      const res = await fetch('/api/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, status, tags }),
      })
      const raw = await res.json()
      const newScene = normalizeScene(raw)
      set((s) => ({ scenes: [...s.scenes, newScene] }))
    } catch (e) {
      console.error('Failed to create scene:', e)
    }
  },

  updateScene: async (id, updates) => {
    // optimistic update
    set((s) => ({
      scenes: s.scenes.map((sc) =>
        sc.id === id ? { ...sc, ...updates, updatedAt: new Date().toISOString() } : sc,
      ),
    }))
    try {
      const res = await fetch(`/api/scenes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const raw = await res.json()
      const updated = normalizeScene(raw)
      set((s) => ({
        scenes: s.scenes.map((sc) => (sc.id === id ? updated : sc)),
      }))
    } catch (e) {
      console.error('Failed to update scene:', e)
      // rollback: reload
      await get().loadScenes()
    }
  },

  deleteScene: async (id) => {
    const prev = get().scenes
    set((s) => ({
      scenes: s.scenes.filter((sc) => sc.id !== id),
      currentSceneId: s.currentSceneId === id ? null : s.currentSceneId,
    }))
    try {
      await fetch(`/api/scenes/${id}`, { method: 'DELETE' })
    } catch (e) {
      console.error('Failed to delete scene:', e)
      set({ scenes: prev })
    }
  },

  duplicateScene: async (id) => {
    const scene = get().scenes.find((s) => s.id === id)
    if (!scene) return
    try {
      const res = await fetch('/api/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${scene.title} (사본)`,
          content: scene.content,
          status: 'draft',
          tags: scene.tags,
        }),
      })
      const raw = await res.json()
      const dup = normalizeScene(raw)
      set((s) => ({ scenes: [...s.scenes, dup] }))
    } catch (e) {
      console.error('Failed to duplicate scene:', e)
    }
  },

  reorderScenes: async (sceneIds) => {
    const prev = get().scenes
    // optimistic
    const reordered = sceneIds
      .map((id, i) => {
        const sc = prev.find((s) => s.id === id)
        return sc ? { ...sc, order: i } : null
      })
      .filter(Boolean) as Scene[]
    set({ scenes: reordered })
    try {
      await fetch('/api/scenes/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneIds }),
      })
    } catch (e) {
      console.error('Failed to reorder:', e)
      set({ scenes: prev })
    }
  },

  setCurrentSceneId: (id) => set({ currentSceneId: id }),

  getCurrentScene: () => {
    const { scenes, currentSceneId } = get()
    return scenes.find((s) => s.id === currentSceneId)
  },
}))
