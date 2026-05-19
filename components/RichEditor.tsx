'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { useCharacterStore } from '@/store/characterStore'
import { useCallback, useRef } from 'react'
import './RichEditor.css'

const COLORS = [
  '#FF6B6B','#4ECDC4','#45B7D1','#FFA07A','#98D8C8',
  '#F7DC6F','#BB8FCE','#85C1E2','#F8B88B','#A9DFBF',
]

interface Props {
  content: string
  onChange: (html: string) => void
}

export default function RichEditor({ content, onChange }: Props) {
  const addChar = useCharacterStore((s) => s.addCharacter)

  const onUpdate = useCallback(
    ({ editor }: any) => onChange(editor.getHTML()),
    [onChange],
  )

  // ref 패턴으로 최신 클로저 유지
  const selectRef = useRef<(item: any, cmd: any) => void>(null as any)
  selectRef.current = async (item: any, cmd: any) => {
    if (item.id.startsWith('new:')) {
      const name = item.id.replace('new:', '')
      cmd({ label: name, id: name })
      await addChar(name, COLORS[Math.floor(Math.random() * COLORS.length)])
    } else {
      cmd({ label: item.label, id: item.id })
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: { HTMLAttributes: { class: 'leading-7' } },
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Mention.configure({
        HTMLAttributes: { class: 'mention' },
        suggestion: {
          items: ({ query }: any) => {
            const chars = useCharacterStore.getState().characters
            const q = query.toLowerCase()
            const hit = chars
              .filter((c: any) => c.name.toLowerCase().startsWith(q))
              .slice(0, 10)
            return hit.length === 0 && query.length > 0
              ? [{ label: `${query} (새 인물 추가)`, id: `new:${query}` }]
              : hit.map((c: any) => ({ label: c.name, id: c.id }))
          },
          render: () => {
            let el: HTMLDivElement | null = null
            let selectedIdx = 0
            let commandRef: any = null
            let currentItems: any[] = []

            const draw = () => {
              if (!el) return
              el.innerHTML = ''
              if (!currentItems.length) {
                el.style.display = 'none'
                return
              }
              el.style.display = ''
              currentItems.forEach((it, i) => {
                const b = document.createElement('button')
                b.className = `mention-item ${i === selectedIdx ? 'selected' : ''}`
                b.innerHTML = it.id.startsWith('new:')
                  ? `<i class="ri-add-circle-line" style="color:#6366f1"></i> ${it.label}`
                  : `<i class="ri-user-line"></i> ${it.label}`
                b.onclick = () => selectRef.current?.(it, commandRef)
                el!.appendChild(b)
              })
            }

            const updatePos = (clientRect?: () => DOMRect) => {
              if (!el) return
              const r = clientRect?.()
              if (r) {
                el.style.top = `${r.bottom + 6}px`
                el.style.left = `${r.left}px`
              }
            }

            return {
              onStart: (p: any) => {
                el = document.createElement('div')
                el.className = 'mention-popup'
                document.body.appendChild(el)
                selectedIdx = 0
                commandRef = p.command
                currentItems = p.items
                updatePos(p.clientRect)
                draw()
              },
              onUpdate: (p: any) => {
                selectedIdx = 0
                commandRef = p.command
                currentItems = p.items
                updatePos(p.clientRect)
                draw()
              },
              onKeyDown: (p: any) => {
                if (!el) return false
                if (p.event.key === 'ArrowDown') {
                  selectedIdx = Math.min(selectedIdx + 1, currentItems.length - 1)
                  draw()
                  return true
                }
                if (p.event.key === 'ArrowUp') {
                  selectedIdx = Math.max(selectedIdx - 1, 0)
                  draw()
                  return true
                }
                if (p.event.key === 'Enter') {
                  if (currentItems[selectedIdx]) {
                    selectRef.current?.(currentItems[selectedIdx], commandRef)
                  }
                  return true
                }
                if (p.event.key === 'Escape') {
                  el.remove()
                  el = null
                  return true
                }
                return false
              },
              onExit: () => {
                el?.remove()
                el = null
              },
            }
          },
        },
      }),
    ],
    content: content || '<p></p>',
    onUpdate,
  })

  if (!editor)
    return (
      <div className="p-8 text-center text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-slate-800">
        로딩…
      </div>
    )

  const ToolbarBtn = ({
    active,
    onClick,
    children,
    title,
  }: {
    active: boolean
    onClick: () => void
    children: React.ReactNode
    title?: string
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={`toolbar-btn ${active ? 'active' : ''}`}
    >
      {children}
    </button>
  )

  const Divider = () => (
    <span className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5 inline-block align-middle" />
  )

  return (
    <div className="space-y-2">
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
        {/* Toolbar */}
        <div className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-gray-700 px-2 py-1.5 flex flex-wrap gap-0.5 items-center">
          <ToolbarBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="굵게 (Ctrl+B)">
            <b>B</b>
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="기울임 (Ctrl+I)">
            <i>I</i>
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="밑줄 (Ctrl+U)">
            <u>U</u>
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="취소선">
            <s>S</s>
          </ToolbarBtn>
          <Divider />
          <ToolbarBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="제목 1">
            H1
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="제목 2">
            H2
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="제목 3">
            H3
          </ToolbarBtn>
          <Divider />
          <ToolbarBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="글머리 기호">
            •
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="번호 매기기">
            1.
          </ToolbarBtn>
          <Divider />
          <ToolbarBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="왼쪽 정렬">
            ⬅
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="가운데 정렬">
            ↔
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="오른쪽 정렬">
            ➡
          </ToolbarBtn>
          <Divider />
          <ToolbarBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="인용구">
            &ldquo; &rdquo;
          </ToolbarBtn>
          <ToolbarBtn active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="코드 블록">
            &lt;/&gt;
          </ToolbarBtn>
          <Divider />
          <ToolbarBtn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="수평선">
            —
          </ToolbarBtn>
          <ToolbarBtn active={false} onClick={() => editor.chain().focus().undo().run()} title="실행 취소 (Ctrl+Z)">
            ↶
          </ToolbarBtn>
          <ToolbarBtn active={false} onClick={() => editor.chain().focus().redo().run()} title="다시 실행 (Ctrl+Shift+Z)">
            ↷
          </ToolbarBtn>
        </div>

        <EditorContent editor={editor} className="p-4 min-h-[320px]" />
      </div>
    </div>
  )
}
