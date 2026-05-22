import { join, basename } from 'path'
import { readdirSync, renameSync, rmSync, statSync, existsSync, readFileSync, openSync, readSync, fstatSync, closeSync, mkdirSync, copyFileSync } from 'fs'
import { inflateRawSync } from 'zlib'
import { handleIpc } from './handle'
import { resolveInstanceDir } from '../services/instance-store'

export type ContentType = 'mod' | 'resourcepack' | 'shader' | 'datapack'

export interface ContentEntry {
  filename: string
  displayName: string
  type: ContentType
  enabled: boolean
  sizeKb: number
  iconDataUrl?: string
}

// Backwards compat alias
export type ModEntry = ContentEntry

function contentDir(instanceId: string, subdir: string): string {
  return join(resolveInstanceDir(instanceId), 'minecraft', subdir)
}

function extractPackPngFromZip(zipPath: string): string | null {
  let fd = -1
  try {
    fd = openSync(zipPath, 'r')
    const fileSize = fstatSync(fd).size
    if (fileSize < 22) return null

    // Read tail to find EOCD (max ZIP comment = 65535 bytes, EOCD = 22 bytes)
    const searchSize = Math.min(65557, fileSize)
    const tail = Buffer.alloc(searchSize)
    readSync(fd, tail, 0, searchSize, fileSize - searchSize)

    let eocdRel = -1
    for (let i = tail.length - 22; i >= 0; i--) {
      if (tail[i] === 0x50 && tail[i + 1] === 0x4b && tail[i + 2] === 0x05 && tail[i + 3] === 0x06) {
        eocdRel = i
        break
      }
    }
    if (eocdRel < 0) return null

    const eocdAbs = fileSize - searchSize + eocdRel
    const cdCount = tail.readUInt16LE(eocdRel + 8)
    const cdOffset = tail.readUInt32LE(eocdRel + 16)
    const cdSize = eocdAbs - cdOffset
    if (cdSize <= 0 || cdOffset < 0 || cdCount === 0) return null

    const cd = Buffer.alloc(cdSize)
    readSync(fd, cd, 0, cdSize, cdOffset)

    let pos = 0
    for (let i = 0; i < cdCount && pos + 46 <= cd.length; i++) {
      if (cd[pos] !== 0x50 || cd[pos + 1] !== 0x4b || cd[pos + 2] !== 0x01 || cd[pos + 3] !== 0x02) break

      const compression = cd.readUInt16LE(pos + 10)
      const compressedSize = cd.readUInt32LE(pos + 20)
      const uncompressedSize = cd.readUInt32LE(pos + 24)
      const fileNameLen = cd.readUInt16LE(pos + 28)
      const extraLen = cd.readUInt16LE(pos + 30)
      const commentLen = cd.readUInt16LE(pos + 32)
      const lhOffset = cd.readUInt32LE(pos + 42)

      const fileName = cd.slice(pos + 46, pos + 46 + fileNameLen).toString('utf8')

      if (fileName === 'pack.png' || fileName.endsWith('/pack.png')) {
        const lhHeader = Buffer.alloc(30)
        readSync(fd, lhHeader, 0, 30, lhOffset)
        if (lhHeader[0] !== 0x50 || lhHeader[1] !== 0x4b || lhHeader[2] !== 0x03 || lhHeader[3] !== 0x04) break

        const lhFileNameLen = lhHeader.readUInt16LE(26)
        const lhExtraLen = lhHeader.readUInt16LE(28)
        const dataStart = lhOffset + 30 + lhFileNameLen + lhExtraLen

        const compressed = Buffer.alloc(compressedSize)
        readSync(fd, compressed, 0, compressedSize, dataStart)
        closeSync(fd)
        fd = -1

        const data = compression === 0 ? compressed : compression === 8 ? inflateRawSync(compressed) : null
        if (!data) return null
        return 'data:image/png;base64,' + data.toString('base64')
      }

      pos += 46 + fileNameLen + extraLen + commentLen
    }

    return null
  } catch {
    return null
  } finally {
    if (fd >= 0) try { closeSync(fd) } catch { /* ignore */ }
  }
}

function getIcon(dir: string, filename: string): string | undefined {
  const fullPath = join(dir, filename)
  try {
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      const pngPath = join(fullPath, 'pack.png')
      if (existsSync(pngPath)) {
        return 'data:image/png;base64,' + readFileSync(pngPath).toString('base64')
      }
      return undefined
    }
    const base = filename.replace(/\.disabled$/, '')
    if (base.endsWith('.zip') || base.endsWith('.jar')) {
      return extractPackPngFromZip(fullPath) ?? undefined
    }
  } catch { /* ignore */ }
  return undefined
}

function listContentDir(
  instanceId: string,
  subdir: string,
  type: ContentType,
  extensions: string[],
): ContentEntry[] {
  const dir = contentDir(instanceId, subdir)
  if (!existsSync(dir)) return []

  const entries: ContentEntry[] = []
  for (const filename of readdirSync(dir)) {
    const fullPath = join(dir, filename)
    let stat: ReturnType<typeof statSync>
    try { stat = statSync(fullPath) } catch { continue }

    const isDir = stat.isDirectory()
    const baseName = filename.replace(/\.disabled$/, '')
    const matchesExt = extensions.some(ext => baseName.endsWith(ext))

    if (!isDir && !matchesExt) continue

    const enabled = !filename.endsWith('.disabled')
    const displayName = baseName.replace(/\.(zip|jar)$/, '')
    const sizeKb = isDir ? 0 : Math.round(stat.size / 1024)
    const iconDataUrl = getIcon(dir, filename)

    entries.push({ filename, displayName, type, enabled, sizeKb, iconDataUrl })
  }

  return entries.sort((a, b) => a.displayName.localeCompare(b.displayName))
}

const SUBDIRS: Record<ContentType, { dir: string; exts: string[] }> = {
  mod:         { dir: 'mods',         exts: ['.jar'] },
  resourcepack: { dir: 'resourcepacks', exts: ['.zip'] },
  shader:      { dir: 'shaderpacks',  exts: ['.zip'] },
  datapack:    { dir: 'datapacks',    exts: ['.zip'] },
}

function resolveDir(instanceId: string, type: ContentType): string {
  return contentDir(instanceId, SUBDIRS[type].dir)
}

export function registerModsIpc(): void {
  handleIpc('mods.list', (_e, instanceId) => {
    const id = String(instanceId)
    return [
      ...listContentDir(id, 'mods',         'mod',         ['.jar']),
      ...listContentDir(id, 'resourcepacks', 'resourcepack', ['.zip']),
      ...listContentDir(id, 'shaderpacks',   'shader',      ['.zip']),
      ...listContentDir(id, 'datapacks',     'datapack',    ['.zip']),
    ]
  })

  handleIpc('mods.toggle', (_e, instanceId, filename, type) => {
    const id = String(instanceId)
    const file = String(filename)
    const dir = resolveDir(id, (type as ContentType) ?? 'mod')
    const src = join(dir, file)
    if (!existsSync(src)) throw new Error(`Not found: ${file}`)

    const stat = statSync(src)
    if (stat.isDirectory()) return // folders can't be toggled

    const dst = file.endsWith('.disabled')
      ? join(dir, file.slice(0, -'.disabled'.length))
      : join(dir, file + '.disabled')
    renameSync(src, dst)
  })

  handleIpc('mods.installLocal', (_e, instanceId: unknown, srcPath: unknown) => {
    const id = String(instanceId)
    const src = String(srcPath)
    const filename = basename(src)
    const modsDir = contentDir(id, 'mods')
    if (!existsSync(modsDir)) mkdirSync(modsDir, { recursive: true })
    copyFileSync(src, join(modsDir, filename))
    return filename
  })

  handleIpc('mods.delete', (_e, instanceId, filename, type) => {
    const id = String(instanceId)
    const file = String(filename)
    const dir = resolveDir(id, (type as ContentType) ?? 'mod')
    const src = join(dir, file)
    if (!existsSync(src)) return

    const stat = statSync(src)
    if (stat.isDirectory()) {
      rmSync(src, { recursive: true, force: true })
    } else {
      rmSync(src)
    }
  })
}
