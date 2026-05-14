'use client'

import { useMemo, useEffect } from 'react'
import { useSceneStore } from '@/store/sceneStore'
import { useCharacterStore } from '@/store/characterStore'
import Icon from '@/components/Icon'
import CharacterStats from './CharacterStats'

interface Props {
  onNavigate?: (tab: 'dashboard' | 'characters' | 'editor' | 'scenes') => void
}

function buildMentionRegex(name: string) {
  return new RegExp(
    `(<span[^>]*data-label="${name}"[^>]*>@${name}</span>|@${name}(?![가-힣a-zA-Z0-9_]))`,
    'g'
  )
}

export default function Dashboard({ onNavigate }: Props) {
  const scenes = useSceneStore((s) => s.scenes)
  const loadScenes = useSceneStore((s) => s.loadScenes)
  const characters = useCharacterStore((s) => s.characters)
  const loadCharacters = useCharacterStore((s) => s.loadCharacters)

  useEffect(() => { loadScenes(); loadCharacters() }, [loadScenes, loadCharacters])

  const stats = useMemo(() => {
    return characters.map((ch) => {
      const re = buildMentionRegex(ch.name)
      let sc = 0, mc = 0
      scenes.forEach((s) => { const m = s.content.match(re); if (m) { sc++; mc += m.length } })
      return { characterId: ch.id, name: ch.name, color: ch.color, sceneCount: sc, lineCount: mc, mentionCount: mc }
    })
  }, [scenes, characters])

  const totalMentions    = stats.reduce((a, c) => a + c.mentionCount, 0)
  const activeCharacters = stats.filter((c) => c.mentionCount > 0).length
  const emptyScenes      = scenes.filter((s) => !s.content || s.content.replace(/<[^>]*>/g, '').trim() === '').length

  const recentScenes = useMemo(
    () => [...scenes].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 5),
    [scenes]
  )

  const charSceneMap = useMemo(() => {
    const map: Record<string, { sceneId: string; title: string; count: number }[]> = {}
    characters.forEach((ch) => {
      map[ch.id] = []
      const re = buildMentionRegex(ch.name)
      scenes.forEach((s) => { const m = s.content.match(re); if (m) map[ch.id].push({ sceneId: s.id, title: s.title, count: m.length }) })
    })
    return map
  }, [scenes, characters])

  const summaryCards = [
    { label: '전체 씬', value: scenes.length, icon: 'ri-file-text-line', bg: 'bg-blue-50 text-blue-500', sub: emptyScenes > 0 ? `빈 씬 ${emptyScenes}개` : undefined },
    { label: '등장 인물', value: characters.length, icon: 'ri-team-line', bg: 'bg-purple-50 text-purple-500', sub: characters.length > 0 ? `활성 ${activeCharacters}명` : undefined },
    { label: '총 언급', value: totalMentions, icon: 'ri-chat-3-line', bg: 'bg-green-50 text-green-500' },
    { label: '평균 언급', value: characters.length ? (totalMentions / characters.length).toFixed(1) : '0', icon: 'ri-line-chart-line', bg: 'bg-amber-50 text-amber-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <div key={c.label} className="card p-5 card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{c.label}</p>
                <p className="text-3xl font-extrabold mt-1">{c.value}</p>
                {c.sub && <p className="text-xs text-gray-400 mt-1">{c.sub}</p>}
              </div>
              <div className={`${c.bg} w-11 h-11 rounded-xl flex items-center justify-center`}>
                <Icon name={c.icon} size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title"><Icon name="ri-team-line" size={20} /> 인물별 통계</h2>
          </div>
          <CharacterStats stats={stats} characterSceneMap={charSceneMap} />
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title"><Icon name="ri-time-line" size={20} /> 최근 활동</h2>
            {onNavigate && (
              <button onClick={() => onNavigate('scenes')} className="text-xs text-indigo-600 hover:underline font-medium">
                전체 보기
              </button>
            )}
          </div>
          {recentScenes.length === 0 ? (
            <div className="text-center py-10">
              <Icon name="ri-file-edit-line" size={48} className="text-gray-300" />
              <p className="text-sm text-gray-500 mt-2">아직 작성된 씬이 없습니다</p>
              {onNavigate && (
                <button onClick={() => onNavigate('editor')} className="mt-3 text-sm text-indigo-600 hover:underline font-medium">
                  첫 씬 작성하기 →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {recentScenes.map((scene, i) => (
                <button
                  key={scene.id}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-left transition group"
                  onClick={() => { useSceneStore.getState().setCurrentSceneId(scene.id); onNavigate?.('scenes') }}
                >
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-gray-800 truncate group-hover:text-indigo-600 transition">
                      {scene.title}
                    </span>
                    <span className="block text-[11px] text-gray-400">
                      {new Date(scene.updatedAt).toLocaleString('ko-KR')}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 인물별 등장 씬 */}
      {activeCharacters > 0 && (
        <div className="card p-6">
          <h2 className="section-title mb-4"><Icon name="ri-link" size={20} /> 인물별 등장 씬</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.filter((c) => c.mentionCount > 0).sort((a, b) => b.mentionCount - a.mentionCount).map((st) => (
              <div key={st.characterId} className="border border-gray-100 rounded-xl p-4 card-hover">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                    style={{ backgroundColor: st.color }}>
                    {st.name.charAt(0)}
                  </div>
                  <span className="font-semibold text-sm">{st.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{st.mentionCount}회</span>
                </div>
                <div className="space-y-1">
                  {(charSceneMap[st.characterId] || []).map((e) => (
                    <button
                      key={e.sceneId}
                      className="w-full flex items-center justify-between text-xs px-2 py-1.5 bg-gray-50 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition text-left"
                      onClick={() => { useSceneStore.getState().setCurrentSceneId(e.sceneId); onNavigate?.('scenes') }}
                    >
                      <span className="truncate font-medium">{e.title}</span>
                      <span className="flex-shrink-0 ml-2 text-gray-400">×{e.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
