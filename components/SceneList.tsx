'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSceneStore } from '@/store/sceneStore'
import { useCharacterStore } from '@/store/characterStore'
import { useConfirmStore } from '@/store/confirmStore'
import { useToastStore } from '@/store/toastStore'
import { Scene, STATUS_LABELS, STATUS_COLORS } from '@/types'
import { stripHtml, getTaggedCharacters, tagColor, tagTextColor } from '@/lib/utils'
import Icon from '@/components/Icon'
import SceneDetail from './SceneDetail'

type SortKey = 'order' | 'updated' | 'created' | 'title'

export default function SceneList() {
  const [q, setQ] = useState('')
  const [selId, setSelId] = useState<string | null>(null)
  const [filterChar, setFilterChar] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [sort, setSort] = useState<SortKey>('order')

  // drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  const scenes = useSceneStore((s) => s.scenes)
  const characters = useCharacterStore((s) => s.characters)
  const loadChars = useCharacterStore((s) => s.loadCharacters)
  const loadScenes = useSceneStore((s) => s.loadScenes)
  const reorderScenes = useSceneStore((s) => s.reorderScenes)
  const duplicateScene = useSceneStore((s) => s.duplicateScene)
  const deleteScene = useSceneStore((s) => s.deleteScene)
  const confirm = useConfirmStore((s) => s.confirm)
  const toast = useToastStore((s) => s.addToast)

  useEffect(() => {
    loadChars()
    loadScenes()
  }, [loadChars, loadScenes])

  // all tags used across scenes
  const allTags = useMemo(() => {
    const set = new Set<string>()
    scenes.forEach((s) => s.tags?.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [scenes])

  const filtered = useMemo(() => {
    let r = [...scenes]
    if (q.trim()) {
      const ql = q.toLowerCase()
      r = r.filter(
        (s) =>
          s.title.toLowerCase().includes(ql) ||
          stripHtml(s.content).toLowerCase().includes(ql),
      )
    }
    if (filterChar) {
      const ch = characters.find((c) => c.id === filterChar)
      if (ch) r = r.filter((s) => getTaggedCharacters(s.content, [ch]).length > 0)
    }
    if (filterStatus) {
      r = r.filter((s) => s.status === filterStatus)
    }
    if (filterTag) {
      r = r.filter((s) => s.tags?.includes(filterTag))
    }
    r.sort((a, b) => {
      if (sort === 'order') return (a.order ?? 0) - (b.order ?? 0)
      if (sort === 'updated')
        return +new Date(b.updatedAt) - +new Date(a.updatedAt)
      if (sort === 'created')
        return +new Date(b.createdAt) - +new Date(a.createdAt)
      return a.title.localeCompare(b.title, 'ko')
    })
    return r
  }, [scenes, q, filterChar, filterStatus, filterTag, sort, characters])

  const selScene = scenes.find((s) => s.id === selId)

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverIdx(idx)
  }

  const handleDrop = async (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null)
      setOverIdx(null)
      return
    }
    const reordered = [...filtered]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(idx, 0, moved)
    await reorderScenes(reordered.map((s) => s.id))
    setDragIdx(null)
    setOverIdx(null)
    toast('씬 순서가 변경되었습니다', 'success')
  }

  const handleDragEnd = () => {
    setDragIdx(null)
    setOverIdx(null)
  }

  const handleDuplicate = async (scene: Scene) => {
    await duplicateScene(scene.id)
    toast(`"${scene.title}" 복제됨`, 'success')
  }

  const handleDelete = async (scene: Scene) => {
    const ok = await confirm({
      title: '씬 삭제',
      message: `"${scene.title}"을(를) 삭제하시겠습니까?`,
      confirmText: '삭제',
      variant: 'danger',
    })
    if (ok) {
      await deleteScene(scene.id)
      if (selId === scene.id) setSelId(null)
      toast('씬이 삭제되었습니다', 'success')
    }
  }

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Icon
              name="ri-search-line"
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="씬 검색…"
              className="input-field pl-9"
            />
          </div>
          <select
            value={filterChar}
            onChange={(e) => setFilterChar(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">전체 인물</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">전체 상태</option>
            {(
              Object.entries(STATUS_LABELS) as [string, string][]
            ).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          {allTags.length > 0 && (
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">전체 태그</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="input-field w-auto"
          >
            <option value="order">순서 순</option>
            <option value="updated">수정일 순</option>
            <option value="created">작성일 순</option>
            <option value="title">제목 순</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 목록 */}
        <div className="lg:col-span-1 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <i className="ri-inbox-line text-5xl text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {q || filterChar || filterStatus || filterTag
                  ? '검색 결과가 없습니다'
                  : '씬이 없습니다'}
              </p>
            </div>
          ) : (
            filtered.map((scene, idx) => {
              const chars = getTaggedCharacters(scene.content, characters)
              const txt = stripHtml(scene.content).slice(0, 100)
              const isDragging = dragIdx === idx
              const isOver = overIdx === idx
              return (
                <div
                  key={scene.id}
                  draggable={sort === 'order'}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`w-full text-left card p-4 card-hover transition cursor-pointer
                    ${selId === scene.id ? 'ring-2 ring-indigo-400' : ''}
                    ${isDragging ? 'opacity-40' : ''}
                    ${isOver ? 'border-indigo-400 border-dashed' : ''}
                  `}
                  onClick={() => setSelId(scene.id)}
                >
                  <div className="flex items-start gap-2">
                    {sort === 'order' && (
                      <div
                        className="mt-1 text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0"
                        title="드래그하여 순서 변경"
                      >
                        <Icon name="ri-draggable" size={16} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {scene.title}
                        </p>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[scene.status]}`}
                        >
                          {STATUS_LABELS[scene.status]}
                        </span>
                      </div>
                      {txt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                          {txt}
                        </p>
                      )}
                      {chars.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {chars.slice(0, 4).map((c) => (
                            <span
                              key={c.id}
                              className="character-badge"
                              style={{ backgroundColor: c.color }}
                            >
                              {c.name}
                            </span>
                          ))}
                          {chars.length > 4 && (
                            <span className="text-xs text-gray-400">
                              +{chars.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                      {scene.tags?.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {scene.tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] px-1.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor: tagColor(t),
                                color: tagTextColor(t),
                              }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          {new Date(scene.updatedAt).toLocaleString('ko-KR')}
                        </p>
                        <div
                          className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleDuplicate(scene)}
                            className="p-1 rounded hover:bg-indigo-50 dark:hover:bg-slate-700 text-gray-400 hover:text-indigo-600 transition"
                            title="복제"
                          >
                            <Icon name="ri-file-copy-line" size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(scene)}
                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 transition"
                            title="삭제"
                          >
                            <Icon name="ri-delete-bin-6-line" size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* 상세 */}
        <div className="lg:col-span-2">
          {selScene ? (
            <SceneDetail scene={selScene} onClose={() => setSelId(null)} />
          ) : (
            <div className="card p-16 text-center">
              <i className="ri-book-open-line text-6xl text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400 font-medium mt-3">
                씬을 선택하면 상세 내용이 표시됩니다
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
