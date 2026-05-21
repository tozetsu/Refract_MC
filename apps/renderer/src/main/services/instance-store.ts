import { join } from 'path'
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync, renameSync } from 'fs'
import { paths } from './paths'
import { createInstance, type Instance, type CreateInstanceInput } from '@refract/core'

// Sanitize a user-provided instance name into a safe folder name.
function sanitizeFolderName(name: string): string {
  const safe = name
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]+/g, '') // strip Windows/POSIX-invalid chars
    .replace(/\.+$/, '')                      // no trailing dots
    .slice(0, 64)
  return safe || 'instance'
}

// Return a folder name that doesn't conflict with any existing directory.
// Pass `currentFolder` to allow "same name" (e.g. on rename without a real change).
function uniqueFolderName(desired: string, currentFolder?: string): string {
  const base = sanitizeFolderName(desired)
  if (base === currentFolder) return base
  if (!existsSync(join(paths.instances, base))) return base
  let i = 2
  while (existsSync(join(paths.instances, `${base} (${i})`))) i++
  return `${base} (${i})`
}

// Given an instance id, find its directory on disk.
// New instances use a human-readable folder; legacy ones used the UUID directly.
export function resolveInstanceDir(id: string): string {
  // Fast path for legacy instances (folder == UUID)
  const legacy = join(paths.instances, id)
  if (existsSync(join(legacy, 'instance.json'))) return legacy

  // Scan for named folder containing an instance.json with this id
  if (existsSync(paths.instances)) {
    for (const entry of readdirSync(paths.instances, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const jsonPath = join(paths.instances, entry.name, 'instance.json')
      if (!existsSync(jsonPath)) continue
      try {
        const data = JSON.parse(readFileSync(jsonPath, 'utf-8')) as { id?: string }
        if (data.id === id) return join(paths.instances, entry.name)
      } catch { continue }
    }
  }
  return legacy // fallback (will create here on save)
}

function instanceJsonPath(dir: string): string {
  return join(dir, 'instance.json')
}

// ---------- public API ----------

export function listInstances(): Instance[] {
  if (!existsSync(paths.instances)) return []
  return readdirSync(paths.instances, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .flatMap(e => {
      const jsonPath = join(paths.instances, e.name, 'instance.json')
      if (!existsSync(jsonPath)) return []
      try { return [JSON.parse(readFileSync(jsonPath, 'utf-8')) as Instance] }
      catch { return [] }
    })
    .sort((a, b) => (b.lastPlayed ?? b.createdAt).localeCompare(a.lastPlayed ?? a.createdAt))
}

export function getInstanceById(id: string): Instance | null {
  const dir = resolveInstanceDir(id)
  const jsonPath = instanceJsonPath(dir)
  if (!existsSync(jsonPath)) return null
  try { return JSON.parse(readFileSync(jsonPath, 'utf-8')) as Instance }
  catch { return null }
}

export function saveInstance(instance: Instance): Instance {
  const folder = instance.folderName ?? instance.id
  const dir = join(paths.instances, folder)
  mkdirSync(join(dir, 'minecraft', 'mods'), { recursive: true })
  writeFileSync(instanceJsonPath(dir), JSON.stringify(instance, null, 2), 'utf-8')
  return instance
}

export function createAndSaveInstance(input: CreateInstanceInput): Instance {
  const instance = createInstance(input)
  instance.folderName = uniqueFolderName(input.name)
  return saveInstance(instance)
}

export function updateInstance(id: string, patch: Partial<Omit<Instance, 'id' | 'createdAt'>>): Instance {
  const existing = getInstanceById(id)
  if (!existing) throw new Error(`Instance not found: ${id}`)

  const currentFolder = existing.folderName ?? id
  let newFolder = currentFolder

  // Rename the folder on disk when the display name changes
  if (patch.name && patch.name !== existing.name) {
    newFolder = uniqueFolderName(patch.name, currentFolder)
    if (newFolder !== currentFolder) {
      const oldDir = join(paths.instances, currentFolder)
      const newDir = join(paths.instances, newFolder)
      if (existsSync(oldDir)) renameSync(oldDir, newDir)
    }
  }

  const updated: Instance = { ...existing, ...patch, folderName: newFolder }
  return saveInstance(updated)
}

export function deleteInstance(id: string): void {
  const dir = resolveInstanceDir(id)
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
}
