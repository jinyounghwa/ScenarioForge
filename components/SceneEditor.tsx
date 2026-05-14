'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSceneStore } from '@/store/sceneStore'
import { useCharacterStore } from '@/store/characterStore'
import Icon from '@/components/Icon'
import RichEditor from './RichEditor'

function buildMentionRegex(name: string) {
  return new RegExp(
    `(<span[^>]*data-label="${name}"[^>]*>@${name}</span>|@${name}(?![가-힣a-zA-Z0-9_]))`,
    'g'
  )
}

export default function SceneEditor() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { currentSceneId, getCurrentScene, createScene, updateScene } = useSceneStore()
  const characters   = useCharacterStore((s) => s.characters)
  const loadChars    = useCharacterStore((s) => s.loadCharacters)
  const currentScene = getCurrentScene()

  useEffect(() => {
    if (currentScene) { setTitle(currentScene.title); setContent(currentScene.content) }
    else { setTitle(''); setContent('') }
  }, [currentScene])

  const taggedChars = characters.filter((ch) => buildMentionRegex(ch.name).test(content))

  const autoSave = useCallback((t: string, c: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!t.trim() || !currentSceneId) return
    timerRef.current = setTimeout(async () => {
      setIsSaving(true)
      try { await updateScene(currentSceneId, t, c); setLastSaved(new Date()) }
      finally { setIsSaving(false) }
    }, 1500)
  }, [currentSceneId, updateScene])

  const handleSave = async () => {
    if (!title.trim()) { alert('제목을 입력해주세요'); return }
    setIsSaving(true)
    try {
      if (currentSceneId) {
        await updateScene(currentSceneId, title, content)
        setLastSaved(new Date())
      } else {
        await createScene(title, content)
        await loadChars()
        setTitle(''); setContent('')
      }
    } finally { setIsSaving(false) }
  }

  return (
    <div className="space-y-4">
      {/* 상태바 */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span className={`font-medium flex items-center gap-1.5 ${currentScene ? 'text-indigo-600' : 'text-green-600'}`}>
            {currentScene
              ? <><Icon name="ri-edit-line" size={16} /> 씬 수정 중</>
              : <><Icon name="ri-file-add-line" size={16} /> 새 씬 작성</>
            }
          </span>
          {isSaving && <span className="text-gray-400 animate-pulse flex items-center gap-1"><Icon name="ri-loader-4-line" size={14} className="animate-spin" /> 저장 중…</span>}
          {lastSaved && !isSaving && <span className="text-gray-400 flex items-center gap-1"><Icon name="ri-check-line" size={14} /> {lastSaved.toLocaleTimeString('ko-KR')}</span>}
        </div>
        {currentSceneId && (
          <button onClick={() => useSceneStore.getState().setCurrentSceneId(null)}
            className="text-gray-400 hover:text-gray-600 text-xs flex items-center gap-1">
            <Icon name="ri-file-add-line" size={14} /> 새 씬 작성
          </button>
        )}
      </div>

      {/* 에디터 카드 */}
      <div className="card p-6">
        <input value={title}
          onChange={(e) => { setTitle(e.target.value); autoSave(e.target.value, content) }}
          placeholder="씬의 제목을 입력하세요"
          className="w-full text-2xl font-bold text-gray-900 placeholder-gray-300 border-0 border-b-2 border-gray-100 pb-3 mb-5 focus:outline-none focus:border-indigo-400 transition" />

        <div className="mb-5">
          <RichEditor content={content} onChange={(v) => { setContent(v); autoSave(title, v) }} />
        </div>

        {taggedChars.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <span className="text-xs text-gray-500 flex items-center gap-1"><Icon name="ri-at-line" size={12} /> 태그:</span>
            {taggedChars.map((ch) => (
              <span key={ch.name} className="character-badge" style={{ backgroundColor: ch.color }}>
                @{ch.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button onClick={handleSave} disabled={isSaving} className="btn-primary">
            {isSaving
              ? <><Icon name="ri-loader-4-line" size={16} className="animate-spin" /> 저장 중…</>
              : currentSceneId
                ? <><Icon name="ri-save-line" size={16} /> 수정 완료</>
                : <><Icon name="ri-check-line" size={16} /> 저장</>
            }
          </button>
          {currentSceneId && (
            <button onClick={() => { useSceneStore.getState().setCurrentSceneId(null); setTitle(''); setContent('') }}
              className="btn-secondary">취소</button>
          )}
        </div>
      </div>
    </div>
  )
}
