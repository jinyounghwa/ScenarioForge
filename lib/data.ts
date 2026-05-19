import { promises as fs } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

export async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

export async function readJsonFile<T>(filename: string): Promise<T[]> {
  await ensureDataDir()
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, filename), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2))
}
