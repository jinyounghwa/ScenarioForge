import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile, writeJsonFile } from '@/lib/data'
import { Character } from '@/types'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = await request.json()
  const { id } = params
  const { name, color, description } = body

  if (name !== undefined && !name?.trim()) {
    return NextResponse.json({ error: '인물명은 필수입니다' }, { status: 400 })
  }

  const characters = await readJsonFile<Character>('characters.json')
  const index = characters.findIndex((c) => c.id === id)

  if (index === -1) {
    return NextResponse.json({ error: '인물을 찾을 수 없습니다' }, { status: 404 })
  }

  characters[index] = {
    ...characters[index],
    ...(name !== undefined ? { name: name.trim() } : {}),
    ...(color !== undefined ? { color } : {}),
    ...(description !== undefined ? { description } : {}),
  }

  await writeJsonFile('characters.json', characters)
  return NextResponse.json(characters[index])
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params
  const characters = await readJsonFile<Character>('characters.json')
  const filtered = characters.filter((c) => c.id !== id)

  if (filtered.length === characters.length) {
    return NextResponse.json({ error: '인물을 찾을 수 없습니다' }, { status: 404 })
  }

  await writeJsonFile('characters.json', filtered)
  return NextResponse.json({ success: true })
}
