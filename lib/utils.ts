import { Character } from '@/types'

/** 정규식 특수문자 이스케이프 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 인물명 멘션을 찾는 정규식을 생성합니다.
 * TipTap HTML 태그 형태와 순수 텍스트 @이름 형태 모두 매칭.
 */
export function buildMentionRegex(name: string): RegExp {
  const e = escapeRegex(name)
  return new RegExp(
    `(<span[^>]*data-label="${e}"[^>]*>@${e}</span>|@${e}(?![가-힣a-zA-Z0-9_]))`,
    'g',
  )
}

/** HTML 태그를 제거하고 순수 텍스트만 반환 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

/** 본문에서 특정 인물의 멘션 횟수 계산 */
export function countMentions(content: string, name: string): number {
  const re = buildMentionRegex(name)
  const m = content.match(re)
  return m ? m.length : 0
}

/** 본문에 태그된(멘션된) 인물 목록 반환 */
export function getTaggedCharacters(
  content: string,
  characters: Character[],
): Character[] {
  return characters.filter((ch) => buildMentionRegex(ch.name).test(content))
}

/** 글자 수 계산 (공백 제외 / 포함) */
export function countChars(text: string) {
  const withSpaces = text.length
  const withoutSpaces = text.replace(/\s/g, '').length
  return { withSpaces, withoutSpaces }
}

/** 태그명 해시로부터 HSL 색상 생성 */
export function tagColor(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  const h = ((hash % 360) + 360) % 360
  return `hsl(${h}, 60%, 88%)`
}

export function tagTextColor(tag: string): string {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  const h = ((hash % 360) + 360) % 360
  return `hsl(${h}, 60%, 30%)`
}
