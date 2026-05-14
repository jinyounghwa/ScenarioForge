import { create } from 'zustand'
import { Scene } from '@/types'

interface SceneState {
  scenes: Scene[]
  currentSceneId: string | null
  isLoading: boolean
  loadScenes: () => Promise<void>
  createScene: (title: string, content: string) => Promise<void>
  updateScene: (id: string, title: string, content: string) => Promise<void>
  deleteScene: (id: string) => Promise<void>
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
      set({ scenes: data.scenes || [] })
    } catch (error) {
      console.error('Failed to load scenes:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  createScene: async (title: string, content: string) => {
    try {
      const res = await fetch('/api/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })
      const newScene = await res.json()
      set((state) => ({ scenes: [...state.scenes, newScene] }))
    } catch (error) {
      console.error('Failed to create scene:', error)
    }
  },

  updateScene: async (id: string, title: string, content: string) => {
    try {
      const res = await fetch(`/api/scenes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })
      const updatedScene = await res.json()
      set((state) => ({
        scenes: state.scenes.map((s) => (s.id === id ? updatedScene : s)),
      }))
    } catch (error) {
      console.error('Failed to update scene:', error)
    }
  },

  deleteScene: async (id: string) => {
    try {
      await fetch(`/api/scenes/${id}`, { method: 'DELETE' })
      set((state) => ({
        scenes: state.scenes.filter((s) => s.id !== id),
        currentSceneId: state.currentSceneId === id ? null : state.currentSceneId,
      }))
    } catch (error) {
      console.error('Failed to delete scene:', error)
    }
  },

  setCurrentSceneId: (id: string | null) => {
    set({ currentSceneId: id })
  },

  getCurrentScene: () => {
    const { scenes, currentSceneId } = get()
    return scenes.find((s) => s.id === currentSceneId)
  },
}))
