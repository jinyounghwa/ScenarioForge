'use client'

import { useState, useEffect } from 'react'
import SceneEditor from '@/components/SceneEditor'
import SceneList from '@/components/SceneList'
import Dashboard from '@/components/Dashboard'
import CharacterManager from '@/components/CharacterManager'
import Icon from '@/components/Icon'
import { useSceneStore } from '@/store/sceneStore'
import { useCharacterStore } from '@/store/characterStore'

type Tab = 'dashboard' | 'characters' | 'editor' | 'scenes'

const tabList: { key: Tab; label: string; icon: string }[] = [
  { key: 'dashboard', label: '대시보드', icon: 'ri-dashboard-3-line' },
  { key: 'characters', label: '인물 관리', icon: 'ri-team-line' },
  { key: 'editor', label: '에디터', icon: 'ri-edit-line' },
  { key: 'scenes', label: '씬 목록', icon: 'ri-file-list-3-line' },
]

export default function Home() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const { scenes, loadScenes } = useSceneStore()
  const { loadCharacters } = useCharacterStore()

  useEffect(() => {
    loadScenes()
    loadCharacters()
  }, [loadScenes, loadCharacters])

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Icon name="ri-quill-pen-line" size={20} />
              </div>
              <div className="leading-tight">
                <h1 className="text-xl font-bold tracking-tight">ScenarioForge</h1>
                <p className="text-[11px] text-indigo-200 hidden sm:block">시나리오 작성·정리 도구</p>
              </div>
            </div>
            <span className="text-sm text-indigo-200 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5">
              <Icon name="ri-file-text-line" size={14} />
              씬 {scenes.length}개
            </span>
          </div>

          {/* Tab nav */}
          <nav className="flex gap-0.5 -mb-px">
            {tabList.map((t) => {
              const active = tab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`
                    flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all
                    ${active
                      ? 'bg-slate-50 text-indigo-700 shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/10'}
                  `}
                >
                  <Icon name={t.icon} size={16} />
                  <span className="hidden sm:inline">{t.label}</span>
                  {t.key === 'scenes' && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      active ? 'bg-indigo-100 text-indigo-600' : 'bg-white/15 text-white'
                    }`}>
                      {scenes.length}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <div className="fade-in" key={tab}>
          {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
          {tab === 'characters' && <CharacterManager />}
          {tab === 'editor' && <SceneEditor />}
          {tab === 'scenes' && <SceneList />}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="text-center py-4 text-xs text-gray-400 border-t border-gray-100 bg-white flex items-center justify-center gap-1.5">
        <Icon name="ri-quill-pen-line" size={12} />
        ScenarioForge — 로컬 시나리오 작성 도구
      </footer>
    </div>
  )
}
