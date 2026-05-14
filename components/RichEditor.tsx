'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { useCharacterStore } from '@/store/characterStore'
import { useCallback, useState, useRef } from 'react'
import './RichEditor.css'

const COLORS = ['#FF6B6B','#4ECDC4','#45B7D1','#FFA07A','#98D8C8','#F7DC6F','#BB8FCE','#85C1E2','#F8B88B','#A9DFBF']

interface Props { content: string; onChange: (html: string) => void }

export default function RichEditor({ content, onChange }: Props) {
  const addChar = useCharacterStore((s) => s.addCharacter)
  const [help, setHelp] = useState(false)

  const onUpdate = useCallback(({ editor }: any) => onChange(editor.getHTML()), [onChange])

  // ref 패턴으로 최신 클로저 유지
  const selectRef = useRef<(item: any, cmd: any) => void>(null as any)
  selectRef.current = async (item: any, cmd: any) => {
    if (item.id.startsWith('new:')) {
      const name = item.id.replace('new:', '')
      cmd({ label: name, id: name })                               // 먼저 mention 삽입
      await addChar(name, COLORS[Math.floor(Math.random() * COLORS.length)]) // 그 후 인물 생성
    } else {
      cmd({ label: item.label, id: item.id })
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ paragraph: { HTMLAttributes: { class: 'leading-7' } } }),
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
            const hit = chars.filter((c: any) => c.name.toLowerCase().startsWith(q)).slice(0, 10)
            return hit.length === 0 && query.length > 0
              ? [{ label: `${query} (새 인물 추가)`, id: `new:${query}` }]
              : hit.map((c: any) => ({ label: c.name, id: c.id }))
          },
          render: () => {
            let el: HTMLDivElement | null = null
            let sel = 0

            const draw = (p: any) => {
              if (!el) return
              el.innerHTML = ''
              sel = 0
              if (!p.items.length) { el.style.display = 'none'; return }
              el.style.display = ''
              const r = p.clientRect?.()
              if (r) { el.style.top = `${r.bottom + 6}px`; el.style.left = `${r.left}px` }
              p.items.forEach((it: any, i: number) => {
                const b = document.createElement('button')
                b.className = `mention-item ${i === 0 ? 'selected' : ''}`
                b.innerHTML = it.id.startsWith('new:')
                  ? `<i class="ri-add-circle-line" style="color:#6366f1"></i> ${it.label}`
                  : `<i class="ri-user-line"></i> ${it.label}`
                b.onclick = () => selectRef.current?.(it, p.command)
                el!.appendChild(b)
              })
            }

            return {
              onStart: (p: any) => { el = document.createElement('div'); el.className = 'mention-popup'; document.body.appendChild(el); draw(p) },
              onUpdate: draw,
              onKeyDown: (p: any) => {
                if (!el) return false
                if (p.event.key === 'ArrowDown') { sel = Math.min(sel + 1, p.items.length - 1); draw({ ...p }); return true }
                if (p.event.key === 'ArrowUp')   { sel = Math.max(sel - 1, 0); draw({ ...p }); return true }
                if (p.event.key === 'Enter')      { selectRef.current?.(p.items[sel], p.command); return true }
                if (p.event.key === 'Escape')     { el.remove(); el = null; return true }
                return false
              },
              onExit: () => { el?.remove(); el = null },
            }
          },
        },
      }),
    ],
    content: content || '<p></p>',
    onUpdate,
  })

  if (!editor) return <div className="p-8 text-center text-gray-400 border border-gray-200 rounded-xl bg-gray-50">로딩…</div>

  const T = ({ active, onClick, children, title }: any) => (
    <button onClick={onClick} title={title}
      className={`px-2 py-1 rounded-md text-sm font-medium transition-colors ${
        active ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      }`}>
      {children}
    </button>
  )
  const D = () => <span className="w-px h-5 bg-gray-200 mx-0.5 inline-block align-middle" />

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400">@ 입력으로 인물 태그</span>
        <button onClick={() => setHelp(!help)} className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1">{help ? '도움말 닫기' : <><i className="ri-question-line" /> 도움말</>}</button>
      </div>

      {help && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-700 space-y-1">
          <p><strong>@</strong> 인물 태그 · <strong>B</strong> 굵게 · <strong>I</strong> 기울임 · <strong>U</strong> 밑줄</p>
          <p>H1~H3 제목 · 리스트 · 인용구 · 정렬</p>
        </div>
      )}

      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        {/* Toolbar */}
        <div className="bg-gray-50 border-b px-2 py-1.5 flex flex-wrap gap-0.5 items-center">
          <T active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></T>
          <T active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></T>
          <T active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></T>
          <T active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></T>
          <D />
          <T active={editor.isActive('heading',{level:1})} onClick={() => editor.chain().focus().toggleHeading({level:1}).run()}>H1</T>
          <T active={editor.isActive('heading',{level:2})} onClick={() => editor.chain().focus().toggleHeading({level:2}).run()}>H2</T>
          <T active={editor.isActive('heading',{level:3})} onClick={() => editor.chain().focus().toggleHeading({level:3}).run()}>H3</T>
          <D />
          <T active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>•</T>
          <T active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</T>
          <D />
          <T active={editor.isActive({textAlign:'left'})} onClick={() => editor.chain().focus().setTextAlign('left').run()}>⬅</T>
          <T active={editor.isActive({textAlign:'center'})} onClick={() => editor.chain().focus().setTextAlign('center').run()}>↔</T>
          <T active={editor.isActive({textAlign:'right'})} onClick={() => editor.chain().focus().setTextAlign('right').run()}>➡</T>
          <D />
          <T active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>" "</T>
          <T active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>&lt;/&gt;</T>
          <D />
          <T onClick={() => editor.chain().focus().setHorizontalRule().run()}>—</T>
          <T onClick={() => editor.chain().focus().undo().run()}>↶</T>
          <T onClick={() => editor.chain().focus().redo().run()}>↷</T>
        </div>

        <EditorContent editor={editor} className="p-4 min-h-[320px]" />
      </div>
    </div>
  )
}
