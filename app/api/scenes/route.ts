import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Scene } from '@/types'
import { randomUUID } from 'crypto'

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

export async function GET() {
  const scenes = await getScenes()
  return NextResponse.json({ scenes })
}

export async function POST(request: NextRequest) {
  const { title, content } = await request.json()

  if (!title?.trim()) {
    return NextResponse.json(
      { error: '제목은 필수입니다' },
      { status: 400 }
    )
  }

  const scenes = await getScenes()
  const newScene: Scene = {
    id: randomUUID(),
    title,
    content: content || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    characterIds: [],
  }

  scenes.push(newScene)
  await saveScenes(scenes)

  return NextResponse.json(newScene, { status: 201 })
}
