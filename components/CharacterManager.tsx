'use client'

import { useState, useEffect } from 'react'
import { useCharacterStore } from '@/store/characterStore'
import { useSceneStore } from '@/store/sceneStore'
import { useConfirmStore } from '@/store/confirmStore'
import { useToastStore } from '@/store/toastStore'
import { countMentions } from '@/lib/utils'
import Icon from '@/components/Icon'

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#A9DFBF',
  '#F1948A', '#82E0AA', '#F8C471', '#AED6F1', '#D7BDE2',
]

export default function CharacterManager() {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [search, setSearch] = useState('')

  const characters = useCharacterStore((s) => s.characters)
  const loadChars = useCharacterStore((s) => s.loadCharacters)
  const addCharacter = useCharacterStore((s) => s.addCharacter)
  const deleteChar = useCharacterStore((s) => s.deleteCharacter)
  const updateChar = useCharacterStore((s) => s.updateCharacter)
  const scenes = useSceneStore((s) => s.scenes)
  const confirm = useConfirmStore((s) => s.confirm)
  const toast = useToastStore((s) => s.addToast)

  useEffect(() => { loadChars() }, [loadChars])

  const sceneCountMap = characters.map((ch) => ({
    id: ch.id,
    count: scenes.filter((s) => countMentions(s.content, ch.name) > 0).length,
  }))

  const filtered = characters.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase()),
  )

  const handleAdd = async () => {
    if (!name.trim()) return
    setIsAdding(true)
    try {
      const result = await addCharacter(name, selectedColor, desc)
      if (result) {
        toast(`"${result.name}" 인물이 추가되었습니다`, 'success')
      }
      setName('')
      setDesc('')
      setSelectedColor(COLORS[Math.floor(Math.random() * COLORS.length)])
    } finally {
      setIsAdding(false)
    }
  }

  const handleDelete = async (ch: typeof characters[0]) => {
    const ok = await confirm({
      title: '인물 삭제',
      message: `"${ch.name}"을(를) 삭제하시겠습니까?`,
      confirmText: '삭제',
      variant: 'danger',
    })
    if (ok) {
      await deleteChar(ch.id)
      toast(`"${ch.name}" 삭제됨`, 'success')
    }
  }

  const handleUpdate = async () => {
    if (!editName.trim() || !editingId) return
    await updateChar(editingId, { name: editName, color: editColor, description: editDesc })
    setEditingId(null)
    toast('인물 정보가 수정되었습니다', 'success')
  }

  return (
    <div className="space-y-6">
      {/* 추가 카드 */}
      <div className="card p-6">
        <h2 className="section-title mb-4">
          <Icon name="ri-user-add-line" size={20} /> 새 인물 추가
        </h2>
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="인물명 입력..."
              className="input-field flex-1"
            />
            <button onClick={handleAdd} disabled={isAdding} className="btn-primary">
              {isAdding ? '추가 중…' : (
                <>
                  <Icon name="ri-add-line" size={16} /> 추가
                </>
              )}
            </button>
          </div>
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="인물 설명 (선택) — 예: 주인공의 친구, 20대 대학생..."
            className="input-field"
          />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
              색상
            </p>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    selectedColor === c
                      ? 'ring-2 ring-offset-2 ring-gray-800 dark:ring-gray-200 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 목록 */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">
            <Icon name="ri-team-line" size={20} /> 인물 목록
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-1">
              ({characters.length}명)
            </span>
          </h2>
        </div>

        {characters.length > 3 && (
          <div className="relative mb-4">
            <Icon
              name="ri-search-line"
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="인물 검색…"
              className="input-field pl-9"
            />
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <i className="ri-user-line text-5xl text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {characters.length === 0
                ? '추가된 인물이 없습니다'
                : '검색 결과가 없습니다'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((ch) => {
              const sc = sceneCountMap.find((x) => x.id === ch.id)?.count || 0
              const isEdit = editingId === ch.id
              return (
                <div
                  key={ch.id}
                  className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 card-hover group transition"
                >
                  {isEdit ? (
                    <div className="space-y-3">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input-field text-sm"
                        placeholder="인물명"
                      />
                      <input
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="input-field text-sm"
                        placeholder="설명"
                      />
                      <div className="flex gap-1 flex-wrap">
                        {COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={() => setEditColor(c)}
                            className={`w-5 h-5 rounded ${
                              editColor === c
                                ? 'ring-2 ring-offset-1 ring-gray-800 dark:ring-gray-200'
                                : ''
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdate}
                          className="btn-primary flex-1 text-xs py-1.5"
                        >
                          <Icon name="ri-check-line" size={14} /> 저장
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="btn-secondary flex-1 text-xs py-1.5"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0"
                          style={{ backgroundColor: ch.color }}
                        >
                          {ch.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate text-gray-900 dark:text-gray-100">
                            {ch.name}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            {sc > 0 ? `${sc}개 씬에 등장` : '미등장'}
                          </p>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingId(ch.id)
                              setEditName(ch.name)
                              setEditColor(ch.color)
                              setEditDesc(ch.description || '')
                            }}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-700 text-gray-400 hover:text-indigo-600 transition"
                            title="수정"
                          >
                            <Icon name="ri-pencil-line" size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(ch)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 transition"
                            title="삭제"
                          >
                            <Icon name="ri-delete-bin-6-line" size={16} />
                          </button>
                        </div>
                      </div>
                      {ch.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                          {ch.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
