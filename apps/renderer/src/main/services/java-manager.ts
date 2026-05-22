import { join } from 'path'
import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import type { JavaInstallation } from '@refract/core'

export function getManagedJavaDir(): string {
  return join(app.getPath('userData'), 'java')
}

export function loadManagedJavas(): JavaInstallation[] {
  const jsonPath = join(getManagedJavaDir(), 'managed.json')
  if (!existsSync(jsonPath)) return []
  try { return JSON.parse(readFileSync(jsonPath, 'utf-8')) as JavaInstallation[] } catch { return [] }
}

export function saveManagedJavas(list: JavaInstallation[]): void {
  const dir = getManagedJavaDir()
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'managed.json'), JSON.stringify(list, null, 2))
}
