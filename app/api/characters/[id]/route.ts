import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Character } from '@/types'

const DATA_DIR = path.join(process.cwd(), 'data')
const CHARACTERS_FILE = path.join(DATA_DIR, 'characters.json')

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

async function getCharacters(): Promise<Character[]> {
  await ensureDataDir()
  try {
    const data = await fs.readFile(CHARACTERS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function saveCharacters(characters: Character[]) {
  await ensureDataDir()
  await fs.writeFile(CHARACTERS_FILE, JSON.stringify(characters, null, 2))
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { name, color } = await request.json()
  const { id } = params

  if (!name?.trim()) {
    return NextResponse.json(
      { error: '인물명은 필수입니다' },
      { status: 400 }
    )
  }

  const characters = await getCharacters()
  const index = characters.findIndex((c) => c.id === id)

  if (index === -1) {
    return NextResponse.json(
      { error: '인물을 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  characters[index] = {
    ...characters[index],
    name,
    color: color || characters[index].color,
  }

  await saveCharacters(characters)
  return NextResponse.json(characters[index])
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const characters = await getCharacters()
  const filtered = characters.filter((c) => c.id !== id)

  if (filtered.length === characters.length) {
    return NextResponse.json(
      { error: '인물을 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  await saveCharacters(filtered)
  return NextResponse.json({ success: true })
}
