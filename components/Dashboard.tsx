'use client'

import { useMemo, useEffect } from 'react'
import { useSceneStore } from '@/store/sceneStore'
import { useCharacterStore } from '@/store/characterStore'
import { STATUS_LABELS, STATUS_COLORS, SceneStatus } from '@/types'
import { countMentions, stripHtml } from '@/lib/utils'
import Icon from '@/components/Icon'
import CharacterStats from './CharacterStats'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface Props {
  onNavigate?: (tab: 'dashboard' | 'characters' | 'editor' | 'scenes') => void
}

export default function Dashboard({ onNavigate }: Props) {
  const scenes = useSceneStore((s) => s.scenes)
  const loadScenes = useSceneStore((s) => s.loadScenes)
  const characters = useCharacterStore((s) => s.characters)
  const loadCharacters = useCharacterStore((s) => s.loadCharacters)

  useEffect(() => {
    loadScenes()
    loadCharacters()
  }, [loadScenes, loadCharacters])

  const stats = useMemo(() => {
    return characters.map((ch) => {
      let sc = 0,
        mc = 0
      scenes.forEach((s) => {
        const cnt = countMentions(s.content, ch.name)
        if (cnt > 0) {
          sc++
          mc += cnt
        }
      })
      return {
        characterId: ch.id,
        name: ch.name,
        color: ch.color,
        sceneCount: sc,
        lineCount: mc,
        mentionCount: mc,
      }
    })
  }, [scenes, characters])

  const totalMentions = stats.reduce((a, c) => a + c.mentionCount, 0)
  const activeCharacters = stats.filter((c) => c.mentionCount > 0).length
  const emptyScenes = scenes.filter(
    (s) => !s.content || stripHtml(s.content) === '',
  ).length
  const totalChars = scenes.reduce(
    (a, s) => a + stripHtml(s.content).replace(/\s/g, '').length,
    0,
  )

  const recentScenes = useMemo(
    () =>
      [...scenes]
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
        .slice(0, 5),
    [scenes],
  )

  const charSceneMap = useMemo(() => {
    const map: Record<
      string,
      { sceneId: string; title: string; count: number }[]
    > = {}
    characters.forEach((ch) => {
      map[ch.id] = []
      scenes.forEach((s) => {
        const cnt = countMentions(s.content, ch.name)
        if (cnt > 0) map[ch.id].push({ sceneId: s.id, title: s.title, count: cnt })
      })
    })
    return map
  }, [scenes, characters])

  // Status distribution for PieChart
  const statusData = useMemo(() => {
    const map: Record<string, number> = {}
    scenes.forEach((s) => {
      const key = s.status || 'draft'
      map[key] = (map[key] || 0) + 1
    })
    return Object.entries(map).map(([key, value]) => ({
      name: STATUS_LABELS[key as SceneStatus] || key,
      value,
      status: key,
    }))
  }, [scenes])

  const STATUS_PIE_COLORS: Record<string, string> = {
    draft: '#9ca3af',
    writing: '#3b82f6',
    complete: '#22c55e',
    review: '#f59e0b',
  }

  // Bar chart data: top characters by mentions
  const barData = useMemo(
    () =>
      [...stats]
        .filter((s) => s.mentionCount > 0)
        .sort((a, b) => b.mentionCount - a.mentionCount)
        .slice(0, 10)
        .map((s) => ({ name: s.name, mentions: s.mentionCount, fill: s.color })),
    [stats],
  )

  const summaryCards = [
    {
      label: '전체 씬',
      value: scenes.length,
      icon: 'ri-file-text-line',
      bg: 'bg-blue-50 text-blue-500 dark:bg-blue-900/50 dark:text-blue-400',
      sub: emptyScenes > 0 ? `빈 씬 ${emptyScenes}개` : undefined,
    },
    {
      label: '등장 인물',
      value: characters.length,
      icon: 'ri-team-line',
      bg: 'bg-purple-50 text-purple-500 dark:bg-purple-900/50 dark:text-purple-400',
      sub: characters.length > 0 ? `활성 ${activeCharacters}명` : undefined,
    },
    {
      label: '총 언급',
      value: totalMentions,
      icon: 'ri-chat-3-line',
      bg: 'bg-green-50 text-green-500 dark:bg-green-900/50 dark:text-green-400',
    },
    {
      label: '총 글자',
      value: totalChars.toLocaleString(),
      icon: 'ri-text',
      bg: 'bg-amber-50 text-amber-500 dark:bg-amber-900/50 dark:text-amber-400',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <div key={c.label} className="card p-5 card-hover">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {c.label}
                </p>
                <p className="text-3xl font-extrabold mt-1 text-gray-900 dark:text-gray-100">
                  {c.value}
                </p>
                {c.sub && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {c.sub}
                  </p>
                )}
              </div>
              <div
                className={`${c.bg} w-11 h-11 rounded-xl flex items-center justify-center`}
              >
                <Icon name={c.icon} size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="section-title mb-4">
            <Icon name="ri-bar-chart-2-line" size={20} /> 인물별 언급 수
          </h2>
          {barData.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="ri-bar-chart-line" size={48} className="text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                아직 인물 언급 데이터가 없습니다
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={60}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}회`, '언급']}
                  contentStyle={{
                    borderRadius: 12,
                    fontSize: 13,
                    border: '1px solid #e5e7eb',
                  }}
                />
                <Bar dataKey="mentions" radius={[0, 6, 6, 0]}>
                  {barData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart - Status */}
        <div className="card p-6">
          <h2 className="section-title mb-4">
            <Icon name="ri-pie-chart-line" size={20} /> 씬 상태 분포
          </h2>
          {scenes.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="ri-pie-chart-line" size={48} className="text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                씬이 없습니다
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}`}
                >
                  {statusData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={STATUS_PIE_COLORS[d.status] || '#9ca3af'}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Stats + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">
              <Icon name="ri-team-line" size={20} /> 인물별 상세 통계
            </h2>
          </div>
          <CharacterStats stats={stats} characterSceneMap={charSceneMap} />
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">
              <Icon name="ri-time-line" size={20} /> 최근 활동
            </h2>
            {onNavigate && (
              <button
                onClick={() => onNavigate('scenes')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                전체 보기
              </button>
            )}
          </div>
          {recentScenes.length === 0 ? (
            <div className="text-center py-10">
              <Icon
                name="ri-file-edit-line"
                size={48}
                className="text-gray-300 dark:text-gray-600"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                아직 작성된 씬이 없습니다
              </p>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('editor')}
                  className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  첫 씬 작성하기 →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {recentScenes.map((scene, i) => (
                <button
                  key={scene.id}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 text-left transition group"
                  onClick={() => {
                    useSceneStore.getState().setCurrentSceneId(scene.id)
                    onNavigate?.('scenes')
                  }}
                >
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {scene.title}
                    </span>
                    <span className="block text-[11px] text-gray-400 dark:text-gray-500">
                      {new Date(scene.updatedAt).toLocaleString('ko-KR')}
                    </span>
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[scene.status]}`}
                  >
                    {STATUS_LABELS[scene.status]}
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
          <h2 className="section-title mb-4">
            <Icon name="ri-link" size={20} /> 인물별 등장 씬
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats
              .filter((c) => c.mentionCount > 0)
              .sort((a, b) => b.mentionCount - a.mentionCount)
              .map((st) => (
                <div
                  key={st.characterId}
                  className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 card-hover"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                      style={{ backgroundColor: st.color }}
                    >
                      {st.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      {st.name}
                    </span>
                    <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                      {st.mentionCount}회
                    </span>
                  </div>
                  <div className="space-y-1">
                    {(charSceneMap[st.characterId] || []).map((e) => (
                      <button
                        key={e.sceneId}
                        className="w-full flex items-center justify-between text-xs px-2 py-1.5 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition text-left"
                        onClick={() => {
                          useSceneStore
                            .getState()
                            .setCurrentSceneId(e.sceneId)
                          onNavigate?.('scenes')
                        }}
                      >
                        <span className="truncate font-medium">{e.title}</span>
                        <span className="flex-shrink-0 ml-2 text-gray-400 dark:text-gray-500">
                          ×{e.count}
                        </span>
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
