import { create } from 'zustand'
import { Character, normalizeCharacter } from '@/types'

interface CharacterState {
  characters: Character[]
  isLoading: boolean
  loadCharacters: () => Promise<void>
  addCharacter: (name: string, color: string, description?: string) => Promise<Character | undefined>
  deleteCharacter: (id: string) => Promise<void>
  updateCharacter: (id: string, updates: Partial<Pick<Character, 'name' | 'color' | 'description'>>) => Promise<void>
  getCharacterById: (id: string) => Character | undefined
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  characters: [],
  isLoading: false,

  loadCharacters: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/characters')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      const characters = (data.characters || []).map(normalizeCharacter)
      set({ characters })
    } catch (e) {
      console.error('Failed to load characters:', e)
    } finally {
      set({ isLoading: false })
    }
  },

  addCharacter: async (name, color, description = ''): Promise<Character | undefined> => {
    if (!name?.trim()) return undefined
    const existing = get().characters.find((c) => c.name === name.trim())
    if (existing) return existing

    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color, description }),
      })
      if (!res.ok) {
        await get().loadCharacters()
        return get().characters.find((c) => c.name === name.trim())
      }
      const raw = await res.json()
      const ch = normalizeCharacter(raw)
      set((s) => {
        if (s.characters.some((c) => c.id === ch.id)) return s
        return { characters: [...s.characters, ch] }
      })
      return ch
    } catch (e) {
      console.error('Failed to add character:', e)
      return undefined
    }
  },

  deleteCharacter: async (id) => {
    const prev = get().characters
    set((s) => ({ characters: s.characters.filter((c) => c.id !== id) }))
    try {
      await fetch(`/api/characters/${id}`, { method: 'DELETE' })
    } catch (e) {
      console.error('Failed to delete character:', e)
      set({ characters: prev })
    }
  },

  updateCharacter: async (id, updates) => {
    set((s) => ({
      characters: s.characters.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }))
    try {
      const res = await fetch(`/api/characters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed')
      const raw = await res.json()
      const updated = normalizeCharacter(raw)
      set((s) => ({
        characters: s.characters.map((c) => (c.id === id ? updated : c)),
      }))
    } catch (e) {
      console.error('Failed to update character:', e)
      await get().loadCharacters()
    }
  },

  getCharacterById: (id) => get().characters.find((c) => c.id === id),
}))
