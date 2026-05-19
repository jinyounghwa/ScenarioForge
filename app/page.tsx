'use client'

import { useState, useEffect, useRef } from 'react'
import SceneEditor from '@/components/SceneEditor'
import SceneList from '@/components/SceneList'
import Dashboard from '@/components/Dashboard'
import CharacterManager from '@/components/CharacterManager'
import Icon from '@/components/Icon'
import ThemeToggle from '@/components/ThemeToggle'
import ToastContainer from '@/components/Toast'
import ConfirmModal from '@/components/ConfirmModal'
import { useSceneStore } from '@/store/sceneStore'
import { useCharacterStore } from '@/store/characterStore'
import { useThemeStore } from '@/store/themeStore'
import { useToastStore } from '@/store/toastStore'

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
  const initTheme = useThemeStore((s) => s.init)
  const toast = useToastStore((s) => s.addToast)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    initTheme()
    loadScenes()
    loadCharacters()
  }, [initTheme, loadScenes, loadCharacters])

  // Export
  const handleExport = async () => {
    try {
      const res = await fetch('/api/export')
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `scenarioforge-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast('데이터가 내보내기 되었습니다', 'success')
    } catch {
      toast('내보내기에 실패했습니다', 'error')
    }
  }

  // Import
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!Array.isArray(data.scenes) || !Array.isArray(data.characters)) {
        toast('올바르지 않은 파일 형식입니다', 'error')
        return
      }
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        await loadScenes()
        await loadCharacters()
        toast(
          `가져오기 완료: 씬 ${data.scenes.length}개, 인물 ${data.characters.length}명`,
          'success',
        )
      } else {
        toast('가져오기에 실패했습니다', 'error')
      }
    } catch {
      toast('파일을 읽을 수 없습니다', 'error')
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-800 dark:to-violet-900 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Icon name="ri-quill-pen-line" size={20} />
              </div>
              <div className="leading-tight">
                <h1 className="text-xl font-bold tracking-tight">
                  ScenarioForge
                </h1>
                <p className="text-[11px] text-indigo-200 hidden sm:block">
                  시나리오 작성·정리 도구
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-indigo-200 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5">
                <Icon name="ri-file-text-line" size={14} />씬 {scenes.length}개
              </span>
              {/* Export/Import */}
              <button
                onClick={handleExport}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                title="데이터 내보내기"
              >
                <Icon name="ri-download-line" size={18} />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                title="데이터 가져오기"
              >
                <Icon name="ri-upload-line" size={18} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <ThemeToggle />
            </div>
          </div>

          {/* Tab nav */}
          <nav className="flex gap-0.5 -mb-px">
            {tabList.map((t) => {
              const active = tab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
                    active
                      ? 'bg-slate-50 dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon name={t.icon} size={16} />
                  <span className="hidden sm:inline">{t.label}</span>
                  {t.key === 'scenes' && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        active
                          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300'
                          : 'bg-white/15 text-white'
                      }`}
                    >
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
      <footer className="text-center py-4 text-xs text-gray-400 dark:text-gray-600 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 flex items-center justify-center gap-1.5">
        <Icon name="ri-quill-pen-line" size={12} />
        ScenarioForge — 로컬 시나리오 작성 도구
      </footer>

      {/* Global overlays */}
      <ToastContainer />
      <ConfirmModal />
    </div>
  )
}
