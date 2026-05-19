'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSceneStore } from '@/store/sceneStore'
import { useCharacterStore } from '@/store/characterStore'
import { useToastStore } from '@/store/toastStore'
import {
  SceneStatus,
  STATUS_LABELS,
  PRESET_TAGS,
} from '@/types'
import {
  stripHtml,
  getTaggedCharacters,
  tagColor,
  tagTextColor,
} from '@/lib/utils'
import Icon from '@/components/Icon'

export default function SceneEditor() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<SceneStatus>('draft')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)

  const { currentSceneId, getCurrentScene, createScene, updateScene } =
    useSceneStore()
  const characters = useCharacterStore((s) => s.characters)
  const toast = useToastStore((s) => s.addToast)
  const currentScene = getCurrentScene()

  useEffect(() => {
    if (currentScene) {
      setTitle(currentScene.title)
      setContent(currentScene.content)
      setStatus(currentScene.status)
      setTags(currentScene.tags)
    } else {
      setTitle('')
      setContent('')
      setStatus('draft')
      setTags([])
    }
    setLastSaved(null)
  }, [currentScene])

  const taggedChars = useMemo(
    () => getTaggedCharacters(content, characters),
    [content, characters],
  )

  const charCount = useMemo(() => {
    const text = stripHtml(content)
    return {
      chars: text.replace(/\s/g, '').length,
      charsTotal: text.length,
    }
  }, [content])

  // auto-save with debounce
  const autoSave = useCallback(
    (t: string, c: string, s: SceneStatus, tg: string[]) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (!t.trim() || !currentSceneId) return
      timerRef.current = setTimeout(async () => {
        setIsSaving(true)
        try {
          await updateScene(currentSceneId, {
            title: t,
            content: c,
            status: s,
            tags: tg,
          })
          setLastSaved(new Date())
        } finally {
          setIsSaving(false)
        }
      }, 1500)
    },
    [currentSceneId, updateScene],
  )

  // Ctrl+S shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const handleSave = async () => {
    if (!title.trim()) {
      toast('제목을 입력해주세요', 'error')
      return
    }
    setIsSaving(true)
    try {
      if (currentSceneId) {
        await updateScene(currentSceneId, {
          title,
          content,
          status,
          tags,
        })
        setLastSaved(new Date())
        toast('저장되었습니다', 'success')
      } else {
        await createScene(title, content, status, tags)
        toast('새 씬이 생성되었습니다', 'success')
        setTitle('')
        setContent('')
        setStatus('draft')
        setTags([])
      }
    } finally {
      setIsSaving(false)
    }
  }

  const addTag = (tag: string) => {
    const t = tag.trim()
    if (t && !tags.includes(t)) {
      const next = [...tags, t]
      setTags(next)
      autoSave(title, content, status, next)
    }
    setTagInput('')
    setShowTagSuggestions(false)
  }

  const removeTag = (tag: string) => {
    const next = tags.filter((t) => t !== tag)
    setTags(next)
    autoSave(title, content, status, next)
  }

  const filteredSuggestions = PRESET_TAGS.filter(
    (p) =>
      !tags.includes(p) &&
      (tagInput ? p.includes(tagInput) : true),
  )

  return (
    <div className="space-y-4">
      {/* 상태바 */}
      <div className="flex items-center justify-between text-sm flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span
            className={`font-medium flex items-center gap-1.5 ${
              currentScene
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-green-600 dark:text-green-400'
            }`}
          >
            {currentScene ? (
              <>
                <Icon name="ri-edit-line" size={16} /> 씬 수정 중
              </>
            ) : (
              <>
                <Icon name="ri-file-add-line" size={16} /> 새 씬 작성
              </>
            )}
          </span>
          {isSaving && (
            <span className="text-gray-400 animate-pulse flex items-center gap-1">
              <Icon name="ri-loader-4-line" size={14} className="animate-spin" />{' '}
              저장 중…
            </span>
          )}
          {lastSaved && !isSaving && (
            <span className="text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <Icon name="ri-check-line" size={14} />{' '}
              {lastSaved.toLocaleTimeString('ko-KR')}
            </span>
          )}
          {charCount.chars > 0 && (
            <span className="text-gray-400 dark:text-gray-500 text-xs">
              {charCount.chars}자
            </span>
          )}
        </div>
        {currentSceneId && (
          <button
            onClick={() =>
              useSceneStore.getState().setCurrentSceneId(null)
            }
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs flex items-center gap-1"
          >
            <Icon name="ri-file-add-line" size={14} /> 새 씬 작성
          </button>
        )}
      </div>

      {/* 에디터 카드 */}
      <div className="card p-6">
        {/* 제목 입력 */}
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            autoSave(e.target.value, content, status, tags)
          }}
          placeholder="씬의 제목을 입력하세요"
          className="w-full text-2xl font-bold text-gray-900 dark:text-gray-100
            placeholder-gray-300 dark:placeholder-gray-600
            border-0 border-b-2 border-gray-100 dark:border-gray-700
            pb-3 mb-4 bg-transparent
            focus:outline-none focus:border-indigo-400 transition"
        />

        {/* 상태 + 태그 */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* 상태 선택 */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as SceneStatus)
              autoSave(title, content, e.target.value as SceneStatus, tags)
            }}
            className="input-field w-auto text-xs py-1.5"
          >
            {(Object.entries(STATUS_LABELS) as [SceneStatus, string][]).map(
              ([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ),
            )}
          </select>

          {/* 태그 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: tagColor(tag),
                  color: tagTextColor(tag),
                }}
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:opacity-70"
                >
                  <Icon name="ri-close-line" size={12} />
                </button>
              </span>
            ))}
            <div className="relative">
              <input
                ref={tagInputRef}
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value)
                  setShowTagSuggestions(true)
                }}
                onFocus={() => setShowTagSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagInput.trim()) {
                    e.preventDefault()
                    addTag(tagInput)
                  }
                }}
                placeholder="+ 태그"
                className="text-xs bg-transparent border border-dashed border-gray-300 dark:border-gray-600
                  rounded-full px-2 py-0.5 w-20 focus:outline-none focus:border-indigo-400
                  text-gray-500 dark:text-gray-400 placeholder-gray-400"
              />
              {showTagSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1 max-h-40 overflow-y-auto min-w-[120px]">
                  {filteredSuggestions.map((s) => (
                    <button
                      key={s}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-indigo-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        addTag(s)
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 에디터 */}
        <div className="mb-4">
          <RichEditorLazy
            content={content}
            onChange={(v) => {
              setContent(v)
              autoSave(title, v, status, tags)
            }}
          />
        </div>

        {/* 태그된 인물 */}
        {taggedChars.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Icon name="ri-at-line" size={12} /> 태그:
            </span>
            {taggedChars.map((ch) => (
              <span
                key={ch.id}
                className="character-badge"
                style={{ backgroundColor: ch.color }}
              >
                @{ch.name}
              </span>
            ))}
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button onClick={handleSave} disabled={isSaving} className="btn-primary">
            {isSaving ? (
              <>
                <Icon name="ri-loader-4-line" size={16} className="animate-spin" />{' '}
                저장 중…
              </>
            ) : currentSceneId ? (
              <>
                <Icon name="ri-save-line" size={16} /> 수정 완료
              </>
            ) : (
              <>
                <Icon name="ri-check-line" size={16} /> 저장
              </>
            )}
          </button>
          {currentSceneId && (
            <button
              onClick={() => {
                useSceneStore.getState().setCurrentSceneId(null)
                setTitle('')
                setContent('')
                setStatus('draft')
                setTags([])
              }}
              className="btn-secondary"
            >
              취소
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
            Ctrl+S로 빠른 저장
          </span>
        </div>
      </div>
    </div>
  )
}

/** Lazy import for RichEditor to avoid SSR issues */
import dynamic from 'next/dynamic'
const RichEditorLazy = dynamic(() => import('./RichEditor'), { ssr: false })
