import { NextResponse } from 'next/server'
import { readJsonFile } from '@/lib/data'
import { Scene } from '@/types'
import { Character } from '@/types'

export async function GET() {
  const scenes = await readJsonFile<Scene>('scenes.json')
  const characters = await readJsonFile<Character>('characters.json')
  return NextResponse.json({ scenes, characters })
}
