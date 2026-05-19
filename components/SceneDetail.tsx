'use client'

import { useState } from 'react'
import { Scene, STATUS_LABELS, STATUS_COLORS } from '@/types'
import { useSceneStore } from '@/store/sceneStore'
import { useCharacterStore } from '@/store/characterStore'
import { useConfirmStore } from '@/store/confirmStore'
import { useToastStore } from '@/store/toastStore'
import { stripHtml, getTaggedCharacters, tagColor, tagTextColor } from '@/lib/utils'
import Icon from '@/components/Icon'
import RichEditor from './RichEditor'

interface Props {
  scene: Scene
  onClose: () => void
}

export default function SceneDetail({ scene, onClose }: Props) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(scene.title)
  const [content, setContent] = useState(scene.content)
  const [saving, setSaving] = useState(false)

  const { updateScene, deleteScene, duplicateScene } = useSceneStore()
  const characters = useCharacterStore((s) => s.characters)
  const confirm = useConfirmStore((s) => s.confirm)
  const toast = useToastStore((s) => s.addToast)

  const tagged = getTaggedCharacters(
    editing ? content : scene.content,
    characters,
  )
  const txt = stripHtml(editing ? content : scene.content).trim()
  const charCount = txt.replace(/\s/g, '').length

  const handleSave = async () => {
    if (!title.trim()) {
      toast('제목을 입력해주세요', 'error')
      return
    }
    setSaving(true)
    try {
      await updateScene(scene.id, { title, content })
      setEditing(false)
      toast('저장되었습니다', 'success')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const ok = await confirm({
      title: '씬 삭제',
      message: `"${scene.title}"을(를) 삭제하시겠습니까?`,
      confirmText: '삭제',
      variant: 'danger',
    })
    if (ok) {
      await deleteScene(scene.id)
      onClose()
      toast('씬이 삭제되었습니다', 'success')
    }
  }

  const handleDuplicate = async () => {
    await duplicateScene(scene.id)
    toast(`"${scene.title}" 복제됨`, 'success')
  }

  return (
    <div className="card overflow-hidden">
      {editing ? (
        <div className="p-6 space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="section-title">
              <Icon name="ri-edit-line" size={20} /> 씬 편집
            </h2>
            <button
              onClick={() => setEditing(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Icon name="ri-close-line" size={20} />
            </button>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="w-full text-xl font-bold text-gray-900 dark:text-gray-100
              placeholder-gray-300 dark:placeholder-gray-600
              bg-transparent border-0 border-b-2 border-gray-100 dark:border-gray-700
              pb-3 focus:outline-none focus:border-indigo-400 transition"
          />
          <RichEditor content={content} onChange={setContent} />
          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? (
                <>
                  <Icon
                    name="ri-loader-4-line"
                    size={16}
                    className="animate-spin"
                  />{' '}
                  저장 중…
                </>
              ) : (
                <>
                  <Icon name="ri-save-line" size={16} /> 저장
                </>
              )}
            </button>
            <button
              onClick={() => {
                setTitle(scene.title)
                setContent(scene.content)
                setEditing(false)
              }}
              className="btn-secondary"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-5">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {scene.title}
                </h2>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[scene.status]}`}
                >
                  {STATUS_LABELS[scene.status]}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Icon name="ri-calendar-line" size={12} /> 작성{' '}
                  {new Date(scene.createdAt).toLocaleString('ko-KR')}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Icon name="ri-refresh-line" size={12} /> 수정{' '}
                  {new Date(scene.updatedAt).toLocaleString('ko-KR')}
                </span>
                <span>·</span>
                <span>{charCount}자</span>
              </div>
              {scene.tags?.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {scene.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] px-2 py-0.5 rounded-full font-medium"
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
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() =>
                  useSceneStore.getState().setCurrentSceneId(scene.id)
                }
                className="btn-primary text-xs py-2 px-3"
              >
                <Icon name="ri-edit-line" size={14} /> 에디터로 열기
              </button>
              <button
                onClick={() => setEditing(true)}
                className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"
              >
                <Icon name="ri-pencil-line" size={14} /> 빠른 수정
              </button>
            </div>
          </div>

          {tagged.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Icon name="ri-at-line" size={12} /> 등장:
              </span>
              {tagged.map((ch) => (
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

          <div className="border-t border-gray-100 dark:border-gray-700 pt-5">
            {txt ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: editing ? content : scene.content,
                }}
              />
            ) : (
              <p className="text-gray-400 dark:text-gray-500 text-sm italic">
                내용이 없습니다
              </p>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-4 flex gap-3">
            <button
              onClick={handleDuplicate}
              className="btn-secondary flex items-center gap-1"
            >
              <Icon name="ri-file-copy-line" size={14} /> 복제
            </button>
            <button
              onClick={handleDelete}
              className="btn-danger flex items-center gap-1"
            >
              <Icon name="ri-delete-bin-6-line" size={14} /> 삭제
            </button>
            <button onClick={onClose} className="btn-secondary ml-auto">
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
