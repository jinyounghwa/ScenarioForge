import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile, writeJsonFile } from '@/lib/data'
import { Scene } from '@/types'
import { randomUUID } from 'crypto'

export async function GET() {
  const scenes = await readJsonFile<Scene>('scenes.json')
  return NextResponse.json({ scenes })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, content, status, tags } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: '제목은 필수입니다' }, { status: 400 })
  }

  const scenes = await readJsonFile<Scene>('scenes.json')

  const newScene: Scene = {
    id: randomUUID(),
    title: title.trim(),
    content: content || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    characterIds: [],
    order: scenes.length,
    status: status || 'draft',
    tags: tags || [],
  }

  scenes.push(newScene)
  await writeJsonFile('scenes.json', scenes)

  return NextResponse.json(newScene, { status: 201 })
}
