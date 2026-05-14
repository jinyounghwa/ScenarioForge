'use client'

import { useState } from 'react'
import { Scene } from '@/types'
import { useSceneStore } from '@/store/sceneStore'
import { useCharacterStore } from '@/store/characterStore'
import Icon from '@/components/Icon'
import RichEditor from './RichEditor'

interface Props { scene: Scene; onClose: () => void }

function buildMentionRegex(name: string) {
  return new RegExp(
    `(<span[^>]*data-label="${name}"[^>]*>@${name}</span>|@${name}(?![가-힣a-zA-Z0-9_]))`,
    'g'
  )
}

export default function SceneDetail({ scene, onClose }: Props) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(scene.title)
  const [content, setContent] = useState(scene.content)
  const [saving, setSaving] = useState(false)

  const { updateScene, deleteScene } = useSceneStore()
  const characters = useCharacterStore((s) => s.characters)

  const tagged = characters.filter((ch) => buildMentionRegex(ch.name).test(editing ? content : scene.content))
  const txt = (editing ? content : scene.content).replace(/<[^>]*>/g, '').trim()

  const handleSave = async () => {
    if (!title.trim()) { alert('제목을 입력해주세요'); return }
    setSaving(true)
    try { await updateScene(scene.id, title, content); setEditing(false) }
    finally { setSaving(false) }
  }

  return (
    <div className="card overflow-hidden">
      {editing ? (
        <div className="p-6 space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="section-title"><Icon name="ri-edit-line" size={20} /> 씬 편집</h2>
            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
              <Icon name="ri-close-line" size={20} />
            </button>
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목"
            className="w-full text-xl font-bold placeholder-gray-300 border-0 border-b-2 border-gray-100 pb-3 focus:outline-none focus:border-indigo-400 transition" />
          <RichEditor content={content} onChange={setContent} />
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <><Icon name="ri-loader-4-line" size={16} className="animate-spin" /> 저장 중…</> : <><Icon name="ri-save-line" size={16} /> 저장</>}
            </button>
            <button onClick={() => { setTitle(scene.title); setContent(scene.content); setEditing(false) }} className="btn-secondary">취소</button>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-5">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-gray-900">{scene.title}</h2>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400 flex-wrap">
                <span className="flex items-center gap-1"><Icon name="ri-calendar-line" size={12} /> 작성 {new Date(scene.createdAt).toLocaleString('ko-KR')}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Icon name="ri-refresh-line" size={12} /> 수정 {new Date(scene.updatedAt).toLocaleString('ko-KR')}</span>
                <span>·</span>
                <span>{txt.length}자</span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => useSceneStore.getState().setCurrentSceneId(scene.id)}
                className="btn-primary text-xs py-2 px-3">
                <Icon name="ri-edit-line" size={14} /> 에디터로 열기
              </button>
              <button onClick={() => setEditing(true)}
                className="btn-secondary text-xs py-2 px-3 flex items-center gap-1">
                <Icon name="ri-pencil-line" size={14} /> 빠른 수정
              </button>
            </div>
          </div>

          {tagged.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 flex items-center gap-1"><Icon name="ri-at-line" size={12} /> 등장:</span>
              {tagged.map((ch) => (
                <span key={ch.id} className="character-badge" style={{ backgroundColor: ch.color }}>@{ch.name}</span>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 pt-5">
            {txt ? (
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: scene.content }} />
            ) : (
              <p className="text-gray-400 text-sm italic">내용이 없습니다</p>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4 flex gap-3">
            <button onClick={async () => { if (confirm('삭제하시겠습니까?')) { await deleteScene(scene.id); onClose() } }}
              className="btn-danger flex items-center gap-1">
              <Icon name="ri-delete-bin-6-line" size={14} /> 삭제
            </button>
            <button onClick={onClose} className="btn-secondary">닫기</button>
          </div>
        </div>
      )}
    </div>
  )
}
