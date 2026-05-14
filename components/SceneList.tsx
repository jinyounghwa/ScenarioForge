'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSceneStore } from '@/store/sceneStore'
import { useCharacterStore } from '@/store/characterStore'
import Icon from '@/components/Icon'
import SceneDetail from './SceneDetail'

function buildMentionRegex(name: string) {
  return new RegExp(
    `(<span[^>]*data-label="${name}"[^>]*>@${name}</span>|@${name}(?![가-힣a-zA-Z0-9_]))`,
    'g'
  )
}

export default function SceneList() {
  const [q, setQ] = useState('')
  const [selId, setSelId] = useState<string | null>(null)
  const [filterChar, setFilterChar] = useState('')
  const [sort, setSort] = useState<'updated' | 'created' | 'title'>('updated')

  const scenes     = useSceneStore((s) => s.scenes)
  const characters = useCharacterStore((s) => s.characters)
  const loadChars  = useCharacterStore((s) => s.loadCharacters)

  useEffect(() => { loadChars() }, [loadChars])

  const filtered = useMemo(() => {
    let r = [...scenes]
    if (q.trim()) {
      const ql = q.toLowerCase()
      r = r.filter((s) =>
        s.title.toLowerCase().includes(ql) ||
        s.content.replace(/<[^>]*>/g, '').toLowerCase().includes(ql)
      )
    }
    if (filterChar) {
      const ch = characters.find((c) => c.id === filterChar)
      if (ch) r = r.filter((s) => buildMentionRegex(ch.name).test(s.content))
    }
    r.sort((a, b) => {
      if (sort === 'updated') return +new Date(b.updatedAt) - +new Date(a.updatedAt)
      if (sort === 'created') return +new Date(b.createdAt) - +new Date(a.createdAt)
      return a.title.localeCompare(b.title, 'ko')
    })
    return r
  }, [scenes, q, filterChar, sort, characters])

  const selScene = scenes.find((s) => s.id === selId)
  const getChars = (content: string) =>
    characters.filter((ch) => buildMentionRegex(ch.name).test(content))

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Icon name="ri-search-line" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="씬 검색…" className="input-field pl-9" />
          </div>
          <select value={filterChar} onChange={(e) => setFilterChar(e.target.value)} className="input-field w-auto">
            <option value="">전체 인물</option>
            {characters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="input-field w-auto">
            <option value="updated">수정일 순</option>
            <option value="created">작성일 순</option>
            <option value="title">제목 순</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 목록 */}
        <div className="lg:col-span-1 space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <i className="ri-inbox-line text-5xl text-gray-300" />
              <p className="text-sm text-gray-500 mt-2">{q || filterChar ? '검색 결과가 없습니다' : '씬이 없습니다'}</p>
            </div>
          ) : filtered.map((scene) => {
            const chars = getChars(scene.content)
            const txt = scene.content.replace(/<[^>]*>/g, '').trim()
            return (
              <button key={scene.id}
                onClick={() => setSelId(scene.id)}
                className={`w-full text-left card p-4 card-hover transition ${selId === scene.id ? 'ring-2 ring-indigo-400' : ''}`}>
                <p className="text-sm font-semibold text-gray-900 truncate">{scene.title}</p>
                {txt && <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{txt.slice(0, 100)}</p>}
                {chars.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {chars.slice(0, 4).map((c) => (
                      <span key={c.id} className="character-badge" style={{ backgroundColor: c.color }}>{c.name}</span>
                    ))}
                    {chars.length > 4 && <span className="text-xs text-gray-400">+{chars.length - 4}</span>}
                  </div>
                )}
                <p className="text-[11px] text-gray-400 mt-2">{new Date(scene.updatedAt).toLocaleString('ko-KR')}</p>
              </button>
            )
          })}
        </div>

        {/* 상세 */}
        <div className="lg:col-span-2">
          {selScene
            ? <SceneDetail scene={selScene} onClose={() => setSelId(null)} />
            : <div className="card p-16 text-center">
                <i className="ri-book-open-line text-6xl text-gray-300" />
                <p className="text-gray-500 font-medium mt-3">씬을 선택하면 상세 내용이 표시됩니다</p>
              </div>
          }
        </div>
      </div>
    </div>
  )
}
