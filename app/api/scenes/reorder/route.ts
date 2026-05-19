import { NextRequest, NextResponse } from 'next/server'
import { readJsonFile, writeJsonFile } from '@/lib/data'
import { Scene } from '@/types'

/** PUT /api/scenes/reorder  { sceneIds: string[] } */
export async function PUT(request: NextRequest) {
  const { sceneIds }: { sceneIds: string[] } = await request.json()

  if (!Array.isArray(sceneIds)) {
    return NextResponse.json({ error: 'sceneIds 배열이 필요합니다' }, { status: 400 })
  }

  const scenes = await readJsonFile<Scene>('scenes.json')

  sceneIds.forEach((id, order) => {
    const scene = scenes.find((s) => s.id === id)
    if (scene) scene.order = order
  })

  await writeJsonFile('scenes.json', scenes)
  return NextResponse.json({ success: true })
}
