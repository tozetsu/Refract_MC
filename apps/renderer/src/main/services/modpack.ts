import { join, relative, resolve, basename, dirname } from 'path'
import { existsSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync, readFileSync, writeFileSync } from 'fs'
import { execFile } from 'child_process'
import { BrowserWindow } from 'electron'
import { paths } from './paths'
import { downloadFile } from './download'
import { getProjectVersions, getPrimaryFile } from '@refract/core'
import { createAndSaveInstance, updateInstance } from './instance-store'
import type { Instance } from '@refract/core'

interface MrpackFile {
  path: string
  hashes: { sha512?: string; sha1?: string }
  env?: { client?: 'required' | 'optional' | 'unsupported'; server?: string }
  downloads: string[]
  fileSize: number
}

interface MrpackIndex {
  formatVersion: number
  game: string
  versionId: string
  name: string
  summary?: string
  dependencies: Record<string, string>
  files: MrpackFile[]
}

type ContentType = 'resourcepack' | 'shader' | 'datapack'

const CONTENT_DIRS: Record<ContentType, string> = {
  resourcepack: 'resourcepacks',
  shader: 'shaderpacks',
  datapack: 'datapacks',
}

async function findJarExe(): Promise<string> {
  const javaHome = process.env.JAVA_HOME ?? ''
  if (javaHome) {
    const w = join(javaHome, 'bin', 'jar.exe')
    const u = join(javaHome, 'bin', 'jar')
    if (existsSync(w)) return w
    if (existsSync(u)) return u
  }
  try {
    const { detectJavaInstallations } = await import('@refract/core/java-manager')
    const installs = await detectJavaInstallations()
    if (installs.length > 0) {
      const w = join(installs[0].path, 'bin', 'jar.exe')
      const u = join(installs[0].path, 'bin', 'jar')
      if (existsSync(w)) return w
      if (existsSync(u)) return u
    }
  } catch { /* ignore */ }
  return 'jar'
}

async function extractZip(jarExe: string, zipPath: string, destDir: string): Promise<void> {
  mkdirSync(destDir, { recursive: true })

  // Zip Slip guard: list entries first
  await new Promise<void>((res, rej) => {
    execFile(jarExe, ['tf', zipPath], (err, stdout) => {
      if (err) { res(); return }
      for (const entry of stdout.split('\n').map(e => e.trim()).filter(Boolean)) {
        const dest = resolve(destDir, entry)
        if (relative(destDir, dest).startsWith('..')) {
          rej(new Error(`Zip Slip rejected: '${entry}'`))
          return
        }
      }
      res()
    })
  })

  await new Promise<void>((res) => {
    execFile(jarExe, ['xf', zipPath], { cwd: destDir }, () => res())
  })
}

function copyDirSafe(src: string, destDir: string): void {
  if (!existsSync(src)) return
  const entries = readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = join(src, entry.name)
    const destPath = join(destDir, entry.name)
    // Zip Slip guard
    if (relative(destDir, resolve(destPath)).startsWith('..')) continue
    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true })
      copyDirSafe(srcPath, destPath)
    } else {
      mkdirSync(dirname(destPath), { recursive: true })
      copyFileSync(srcPath, destPath)
    }
  }
}

function loaderFromDeps(deps: Record<string, string>): Instance['modLoader'] {
  if ('fabric-loader' in deps) return 'fabric'
  if ('quilt-loader' in deps) return 'quilt'
  if ('neoforge' in deps || 'neoForge' in deps) return 'neoforge'
  if ('forge' in deps) return 'forge'
  return undefined
}

function progress(mainWindow: BrowserWindow, projectId: string, step: string, percent: number): void {
  mainWindow.webContents.send('modpack:progress', { projectId, step, percent })
}

export async function installModpack(
  instanceName: string,
  projectId: string,
  versionId: string | undefined,
  mainWindow: BrowserWindow
): Promise<Instance> {
  progress(mainWindow, projectId, 'Fetching version info', 2)
  const versions = await getProjectVersions(projectId)
  const version = versionId ? versions.find(v => v.id === versionId) : versions[0]
  if (!version) throw new Error('No compatible modpack version found.')

  const file = getPrimaryFile(version)
  if (!file) throw new Error('No download file found for this modpack version.')

  // Determine MC version and loader from version metadata
  const mcVersion = version.game_versions[0] ?? '1.20.1'
  const rawLoader = version.loaders.find(l => l !== 'mrpack')
  const modLoader = (rawLoader as Instance['modLoader']) ?? undefined

  progress(mainWindow, projectId, 'Creating instance', 5)
  const instance = createAndSaveInstance({
    name: instanceName,
    minecraftVersion: mcVersion,
    modLoader,
    memoryMb: 4096,
  })

  const gameDir = join(paths.instances, instance.id, 'minecraft')
  mkdirSync(join(gameDir, 'mods'), { recursive: true })

  const tempDir = join(paths.cache, `mrpack-${instance.id}`)
  const mrpackPath = join(paths.cache, `${instance.id}.mrpack`)

  try {
    progress(mainWindow, projectId, 'Downloading modpack', 10)
    // Force re-download (remove skip-if-exists behavior for mrpacks)
    if (existsSync(mrpackPath)) rmSync(mrpackPath)
    await downloadFile(file.url, mrpackPath, ({ percent: p }) => {
      progress(mainWindow, projectId, 'Downloading modpack', 10 + p * 0.3)
    })

    progress(mainWindow, projectId, 'Extracting manifest', 42)
    const jarExe = await findJarExe()
    await extractZip(jarExe, mrpackPath, tempDir)

    const indexPath = join(tempDir, 'modrinth.index.json')
    if (!existsSync(indexPath)) throw new Error('modrinth.index.json not found in modpack archive.')

    const index = JSON.parse(readFileSync(indexPath, 'utf-8')) as MrpackIndex

    // Patch instance with exact MC version and loader from manifest
    const manifestMc = index.dependencies?.minecraft
    const manifestLoader = loaderFromDeps(index.dependencies ?? {})
    if (manifestMc && manifestMc !== mcVersion) {
      updateInstance(instance.id, { minecraftVersion: manifestMc })
      instance.minecraftVersion = manifestMc
    }
    if (manifestLoader && manifestLoader !== modLoader) {
      updateInstance(instance.id, { modLoader: manifestLoader })
      instance.modLoader = manifestLoader
    }

    const clientFiles = (index.files ?? []).filter(f => f.env?.client !== 'unsupported')
    const total = clientFiles.length
    let done = 0

    progress(mainWindow, projectId, `Downloading files (0/${total})`, 45)
    for (const f of clientFiles) {
      if (!f.downloads?.[0]) { done++; continue }
      const safePath = f.path.replace(/\\/g, '/')
      const destPath = resolve(gameDir, safePath)
      if (relative(gameDir, destPath).startsWith('..')) { done++; continue }
      mkdirSync(dirname(destPath), { recursive: true })
      try { await downloadFile(f.downloads[0], destPath) } catch { /* non-fatal — mod CDN can fail */ }
      done++
      progress(mainWindow, projectId, `Downloading files (${done}/${total})`, 45 + (done / Math.max(total, 1)) * 45)
    }

    progress(mainWindow, projectId, 'Copying overrides', 92)
    copyDirSafe(join(tempDir, 'overrides'), gameDir)
    copyDirSafe(join(tempDir, 'client-overrides'), gameDir)

    progress(mainWindow, projectId, 'Done', 100)
    mainWindow.webContents.send('modpack:done', { projectId, instanceId: instance.id })
    return instance
  } catch (err) {
    // Clean up broken instance on failure
    try { rmSync(join(paths.instances, instance.id), { recursive: true, force: true }) } catch { /* ignore */ }
    mainWindow.webContents.send('modpack:done', { projectId, error: err instanceof Error ? err.message : String(err) })
    throw err
  } finally {
    // Clean up temp files
    try { if (existsSync(mrpackPath)) rmSync(mrpackPath) } catch { /* ignore */ }
    try { if (existsSync(tempDir)) rmSync(tempDir, { recursive: true, force: true }) } catch { /* ignore */ }
  }
}

export async function installContentPack(
  instanceId: string,
  projectId: string,
  projectName: string,
  contentType: ContentType,
  versionId?: string
): Promise<void> {
  const { getInstanceById } = await import('./instance-store')
  const instance = getInstanceById(instanceId)
  if (!instance) throw new Error(`Instance not found: ${instanceId}`)

  const versions = await getProjectVersions(
    projectId,
    instance.minecraftVersion,
    contentType === 'shader' ? undefined : instance.modLoader
  )

  let target = versionId ? versions.find(v => v.id === versionId) : versions[0]
  if (!target && versions.length > 0) target = versions[0]
  if (!target) throw new Error(`No compatible version of ${projectName} found.`)

  const file = getPrimaryFile(target)
  if (!file) throw new Error(`No download file found for ${projectName}.`)

  const subDir = CONTENT_DIRS[contentType]
  const destFolder = join(paths.instances, instanceId, 'minecraft', subDir)
  const safeName = basename(file.filename)
  const destPath = resolve(destFolder, safeName)
  if (relative(destFolder, destPath).startsWith('..')) throw new Error(`Unsafe filename: ${file.filename}`)

  mkdirSync(destFolder, { recursive: true })
  await downloadFile(file.url, destPath)
}
