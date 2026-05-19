import { NextRequest, NextResponse } from 'next/server'
import { writeJsonFile } from '@/lib/data'
import { Scene, Character } from '@/types'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { scenes, characters } = body as {
    scenes: Scene[]
    characters: Character[]
  }

  if (!Array.isArray(scenes) || !Array.isArray(characters)) {
    return NextResponse.json(
      { error: 'scenes와 characters 배열이 필요합니다' },
      { status: 400 },
    )
  }

  await writeJsonFile('scenes.json', scenes)
  await writeJsonFile('characters.json', characters)

  return NextResponse.json({
    success: true,
    sceneCount: scenes.length,
    characterCount: characters.length,
  })
}
