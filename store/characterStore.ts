import { create } from 'zustand'
import { Character } from '@/types'

interface CharacterState {
  characters: Character[]
  isLoading: boolean
  loadCharacters: () => Promise<void>
  addCharacter: (name: string, color: string) => Promise<Character | undefined>
  deleteCharacter: (id: string) => Promise<void>
  updateCharacter: (id: string, name: string, color: string) => Promise<void>
  getCharacterById: (id: string) => Character | undefined
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  characters: [],
  isLoading: false,

  loadCharacters: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/characters')
      if (!res.ok) throw new Error('Failed to fetch characters')
      const data = await res.json()
      set({ characters: data.characters || [] })
    } catch (error) {
      console.error('Failed to load characters:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  addCharacter: async (name: string, color: string): Promise<Character | undefined> => {
    if (!name?.trim()) return undefined

    try {
      // 먼저 스토어에 이미 있는지 확인
      const existing = get().characters.find((c) => c.name === name.trim())
      if (existing) return existing

      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color }),
      })

      if (!res.ok) {
        // 중복이거나 다른 에러 — 서버에서 최신 목록 다시 로드
        await get().loadCharacters()
        return get().characters.find((c) => c.name === name.trim())
      }

      const newCharacter: Character = await res.json()
      // 중복 방지: 이미 같은 id가 있으면 추가하지 않음
      set((state) => {
        if (state.characters.some((c) => c.id === newCharacter.id)) {
          return state
        }
        return { characters: [...state.characters, newCharacter] }
      })
      return newCharacter
    } catch (error) {
      console.error('Failed to add character:', error)
      return undefined
    }
  },

  deleteCharacter: async (id: string) => {
    try {
      await fetch(`/api/characters/${id}`, { method: 'DELETE' })
      set((state) => ({
        characters: state.characters.filter((c) => c.id !== id),
      }))
    } catch (error) {
      console.error('Failed to delete character:', error)
    }
  },

  updateCharacter: async (id: string, name: string, color: string) => {
    try {
      const res = await fetch(`/api/characters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      })
      if (!res.ok) throw new Error('Failed to update')
      const updatedCharacter = await res.json()
      set((state) => ({
        characters: state.characters.map((c) => (c.id === id ? updatedCharacter : c)),
      }))
    } catch (error) {
      console.error('Failed to update character:', error)
    }
  },

  getCharacterById: (id: string) => {
    const { characters } = get()
    return characters.find((c) => c.id === id)
  },
}))
