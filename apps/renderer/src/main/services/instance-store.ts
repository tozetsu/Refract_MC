import { join } from 'path'
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'fs'
import { paths } from './paths'
import { createInstance, type Instance, type CreateInstanceInput } from '@refract/core'

function instanceDir(id: string): string {
  return join(paths.instances, id)
}

function instanceJsonPath(id: string): string {
  return join(instanceDir(id), 'instance.json')
}

export function listInstances(): Instance[] {
  if (!existsSync(paths.instances)) return []

  return readdirSync(paths.instances, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const jsonPath = instanceJsonPath(entry.name)
      if (!existsSync(jsonPath)) return []
      try {
        return [JSON.parse(readFileSync(jsonPath, 'utf-8')) as Instance]
      } catch {
        return []
      }
    })
    .sort((a, b) => (b.lastPlayed ?? b.createdAt).localeCompare(a.lastPlayed ?? a.createdAt))
}

export function getInstanceById(id: string): Instance | null {
  const jsonPath = instanceJsonPath(id)
  if (!existsSync(jsonPath)) return null
  try {
    return JSON.parse(readFileSync(jsonPath, 'utf-8')) as Instance
  } catch {
    return null
  }
}

export function saveInstance(instance: Instance): Instance {
  const dir = instanceDir(instance.id)
  mkdirSync(join(dir, 'minecraft', 'mods'), { recursive: true })
  writeFileSync(instanceJsonPath(instance.id), JSON.stringify(instance, null, 2), 'utf-8')
  return instance
}

export function createAndSaveInstance(input: CreateInstanceInput): Instance {
  const instance = createInstance(input)
  return saveInstance(instance)
}

export function updateInstance(id: string, patch: Partial<Omit<Instance, 'id' | 'createdAt'>>): Instance {
  const existing = getInstanceById(id)
  if (!existing) throw new Error(`Instance not found: ${id}`)
  const updated = { ...existing, ...patch }
  return saveInstance(updated)
}

export function deleteInstance(id: string, deleteFiles: boolean): void {
  if (deleteFiles) {
    const dir = instanceDir(id)
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
  } else {
    const jsonPath = instanceJsonPath(id)
    if (existsSync(jsonPath)) rmSync(jsonPath)
  }
}
