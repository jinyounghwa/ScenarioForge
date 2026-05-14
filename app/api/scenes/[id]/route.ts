import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Scene } from '@/types'

const DATA_DIR = path.join(process.cwd(), 'data')
const SCENES_FILE = path.join(DATA_DIR, 'scenes.json')

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

async function getScenes(): Promise<Scene[]> {
  await ensureDataDir()
  try {
    const data = await fs.readFile(SCENES_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function saveScenes(scenes: Scene[]) {
  await ensureDataDir()
  await fs.writeFile(SCENES_FILE, JSON.stringify(scenes, null, 2))
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { title, content } = await request.json()
  const { id } = params

  if (!title?.trim()) {
    return NextResponse.json(
      { error: '제목은 필수입니다' },
      { status: 400 }
    )
  }

  const scenes = await getScenes()
  const index = scenes.findIndex((s) => s.id === id)

  if (index === -1) {
    return NextResponse.json(
      { error: '씬을 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  scenes[index] = {
    ...scenes[index],
    title,
    content: content || '',
    updatedAt: new Date().toISOString(),
  }

  await saveScenes(scenes)
  return NextResponse.json(scenes[index])
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const scenes = await getScenes()
  const filtered = scenes.filter((s) => s.id !== id)

  if (filtered.length === scenes.length) {
    return NextResponse.json(
      { error: '씬을 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  await saveScenes(filtered)
  return NextResponse.json({ success: true })
}
