import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { Character } from '@/types'
import { randomUUID } from 'crypto'

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

export async function GET() {
  const characters = await getCharacters()
  return NextResponse.json({ characters })
}

export async function POST(request: NextRequest) {
  const { name, color } = await request.json()

  if (!name?.trim()) {
    return NextResponse.json(
      { error: '인물명은 필수입니다' },
      { status: 400 }
    )
  }

  const characters = await getCharacters()

  if (characters.some((c) => c.name === name)) {
    return NextResponse.json(
      { error: '이미 존재하는 인물입니다' },
      { status: 400 }
    )
  }

  const newCharacter: Character = {
    id: randomUUID(),
    name,
    color: color || '#FF6B6B',
    createdAt: new Date().toISOString(),
  }

  characters.push(newCharacter)
  await saveCharacters(characters)

  return NextResponse.json(newCharacter, { status: 201 })
}
