import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile, writeJsonFile } from '@/lib/data'
import { Character } from '@/types'
import { randomUUID } from 'crypto'

export async function GET() {
  const characters = await readJsonFile<Character>('characters.json')
  return NextResponse.json({ characters })
}

export async function POST(request: NextRequest) {
  const { name, color, description } = await request.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: '인물명은 필수입니다' }, { status: 400 })
  }

  const characters = await readJsonFile<Character>('characters.json')

  if (characters.some((c) => c.name === name.trim())) {
    return NextResponse.json({ error: '이미 존재하는 인물입니다' }, { status: 400 })
  }

  const newCharacter: Character = {
    id: randomUUID(),
    name: name.trim(),
    color: color || '#FF6B6B',
    description: description || '',
    createdAt: new Date().toISOString(),
  }

  characters.push(newCharacter)
  await writeJsonFile('characters.json', characters)

  return NextResponse.json(newCharacter, { status: 201 })
}
