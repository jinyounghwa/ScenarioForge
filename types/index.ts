export interface Scene {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  characterIds: string[]
}

export interface Character {
  id: string
  name: string
  color: string
  createdAt: string
}

export interface CharacterStats {
  characterId: string
  name: string
  color: string
  sceneCount: number
  lineCount: number
  mentionCount: number
}
