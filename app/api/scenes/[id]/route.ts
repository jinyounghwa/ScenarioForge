import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile, writeJsonFile } from '@/lib/data'
import { Scene } from '@/types'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = await request.json()
  const { id } = params
  const { title, content, status, tags } = body

  const scenes = await readJsonFile<Scene>('scenes.json')
  const index = scenes.findIndex((s) => s.id === id)

  if (index === -1) {
    return NextResponse.json({ error: '씬을 찾을 수 없습니다' }, { status: 404 })
  }

  if (title !== undefined && !title?.trim()) {
    return NextResponse.json({ error: '제목은 필수입니다' }, { status: 400 })
  }

  scenes[index] = {
    ...scenes[index],
    ...(title !== undefined ? { title: title.trim() } : {}),
    ...(content !== undefined ? { content } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(tags !== undefined ? { tags } : {}),
    updatedAt: new Date().toISOString(),
  }

  await writeJsonFile('scenes.json', scenes)
  return NextResponse.json(scenes[index])
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params
  const scenes = await readJsonFile<Scene>('scenes.json')
  const filtered = scenes.filter((s) => s.id !== id)

  if (filtered.length === scenes.length) {
    return NextResponse.json({ error: '씬을 찾을 수 없습니다' }, { status: 404 })
  }

  await writeJsonFile('scenes.json', filtered)
  return NextResponse.json({ success: true })
}
