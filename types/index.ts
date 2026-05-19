export type SceneStatus = 'draft' | 'writing' | 'complete' | 'review'

export interface Scene {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  characterIds: string[]
  order: number
  status: SceneStatus
  tags: string[]
}

export interface Character {
  id: string
  name: string
  color: string
  description: string
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

/* ── helpers: normalize legacy data ── */

export function normalizeScene(raw: any): Scene {
  return {
    id: raw.id,
    title: raw.title ?? '',
    content: raw.content ?? '',
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
    characterIds: raw.characterIds ?? [],
    order: raw.order ?? 0,
    status: raw.status ?? 'draft',
    tags: raw.tags ?? [],
  }
}

export function normalizeCharacter(raw: any): Character {
  return {
    id: raw.id,
    name: raw.name ?? '',
    color: raw.color ?? '#FF6B6B',
    description: raw.description ?? '',
    createdAt: raw.createdAt ?? new Date().toISOString(),
  }
}

/* ── status label map ── */
export const STATUS_LABELS: Record<SceneStatus, string> = {
  draft: '초안',
  writing: '작성 중',
  complete: '완료',
  review: '검토',
}

export const STATUS_COLORS: Record<SceneStatus, string> = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  writing: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  complete: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  review: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
}

export const PRESET_TAGS = [
  '서론', '전개', '갈등', '클라이맥스', '결말',
  '액션', '대화', '회상', '반전', '감정',
  '실내', '실외', '낮', '밤',
]
