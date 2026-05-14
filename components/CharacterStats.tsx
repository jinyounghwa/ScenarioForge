'use client'

import { CharacterStats as CharacterStatsType } from '@/types'

interface Props {
  stats: CharacterStatsType[]
  characterSceneMap?: Record<string, { sceneId: string; title: string; count: number }[]>
}

export default function CharacterStats({ stats, characterSceneMap }: Props) {
  if (stats.length === 0) {
    return (
      <div className="text-center py-12">
        <i className="ri-user-line text-5xl text-gray-300" />
        <p className="text-sm text-gray-500 mt-2">등록된 인물이 없습니다</p>
        <p className="text-xs text-gray-400 mt-1">인물 관리에서 추가하거나, 에디터에서 @태그하세요</p>
      </div>
    )
  }

  const sorted = [...stats].sort((a, b) => b.mentionCount - a.mentionCount)
  const max = Math.max(...sorted.map((s) => s.mentionCount), 1)

  return (
    <div>
      <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b text-xs font-semibold text-gray-400 uppercase tracking-wider">
        <div className="col-span-4">인물</div>
        <div className="col-span-2 text-center">씬</div>
        <div className="col-span-4">빈도</div>
        <div className="col-span-2 text-center">언급</div>
      </div>
      <div className="divide-y divide-gray-50">
        {sorted.map((s) => (
          <div key={s.characterId} className="grid grid-cols-12 gap-2 items-center px-4 py-3 hover:bg-gray-50/60 transition rounded-lg">
            <div className="col-span-4 flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                style={{ backgroundColor: s.color }}>
                {s.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{s.name}</p>
                <p className="text-[11px] text-gray-400">
                  {s.mentionCount > 0
                    ? `${(characterSceneMap?.[s.characterId] || []).length}개 씬에 등장`
                    : '미등장'}
                </p>
              </div>
            </div>
            <div className="col-span-2 text-center">
              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold ${
                s.sceneCount > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-300'
              }`}>
                {s.sceneCount}
              </span>
            </div>
            <div className="col-span-4">
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max((s.mentionCount / max) * 100, s.mentionCount > 0 ? 6 : 0)}%`,
                    backgroundColor: s.color,
                  }}
                />
              </div>
            </div>
            <div className="col-span-2 text-center">
              <span className={`text-sm font-bold ${s.mentionCount > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                {s.mentionCount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
