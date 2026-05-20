import { join } from 'path'
import { existsSync, readFileSync, mkdirSync } from 'fs'
import { spawn, ChildProcess } from 'child_process'
import { BrowserWindow } from 'electron'
import { paths } from '../paths'
import { getConfig } from '../config'
import { getOrRefreshMinecraftToken } from '../auth'
import type { VersionJson } from '@refract/core'
import { buildLaunchCommand } from '@refract/core/launcher'
import { detectJavaInstallations } from '@refract/core/java-manager'
import { versionJsonPath, clientJarPath, nativesDir } from './downloader'

const runningProcesses = new Map<string, ChildProcess>()

function readVersionJson(versionId: string): VersionJson | null {
  const p = versionJsonPath(versionId)
  if (!existsSync(p)) return null
  try { return JSON.parse(readFileSync(p, 'utf-8')) as VersionJson } catch { return null }
}

function readFabricJson(versionId: string): VersionJson | null {
  const p = join(paths.versions, `${versionId}-fabric`, `${versionId}-fabric.json`)
  if (!existsSync(p)) return null
  try { return JSON.parse(readFileSync(p, 'utf-8')) as VersionJson } catch { return null }
}

function readForgeJson(versionId: string): VersionJson | null {
  const p = join(paths.versions, `${versionId}-forge`, `${versionId}-forge.json`)
  if (!existsSync(p)) return null
  try { return JSON.parse(readFileSync(p, 'utf-8')) as VersionJson } catch { return null }
}

async function resolveJava(requiredMajor: number, instanceJavaPath?: string): Promise<{ exe: string; version: number }> {
  if (instanceJavaPath) {
    if (existsSync(instanceJavaPath)) return { exe: instanceJavaPath, version: requiredMajor }
    const exeWin  = join(instanceJavaPath, 'bin', 'java.exe')
    if (existsSync(exeWin)) return { exe: exeWin, version: requiredMajor }
    const exeUnix = join(instanceJavaPath, 'bin', 'java')
    if (existsSync(exeUnix)) return { exe: exeUnix, version: requiredMajor }
  }

  const installs = await detectJavaInstallations()

  // Prefer exact version match; never fall back to an incompatible version
  const match = installs.find(j => j.version >= requiredMajor)
  if (match) {
    const exe = join(match.path, 'bin', 'java.exe')
    if (existsSync(exe)) return { exe, version: match.version }
    const exeUnix = join(match.path, 'bin', 'java')
    if (existsSync(exeUnix)) return { exe: exeUnix, version: match.version }
  }

  try {
    const { spawnSync } = await import('child_process')
    const which = require('child_process').execSync('where java', { timeout: 3000 }).toString().trim().split(/\r?\n/)[0]?.trim()
    if (which && existsSync(which)) {
      const result = spawnSync(which, ['-version'], { encoding: 'utf8', timeout: 3000 })
      const out = (result.stdout ?? '') + (result.stderr ?? '')
      const verMatch = out.match(/version "([^"]+)"/)
      const major = verMatch ? (verMatch[1].startsWith('1.') ? parseInt(verMatch[1].split('.')[1]) : parseInt(verMatch[1].split('.')[0])) : 0
      if (major >= requiredMajor) return { exe: which, version: major }
    }
  } catch { /* not in PATH */ }

  const found = installs[0] ? `Java ${installs[0].version} is installed` : 'no Java found'
  throw new Error(
    `This Minecraft version requires Java ${requiredMajor}, but ${found}. Install Java ${requiredMajor} from https://adoptium.net`
  )
}

export async function launchInstance(
  instanceId: string,
  mainWindow: BrowserWindow
): Promise<void> {
  if (runningProcesses.has(instanceId)) {
    throw new Error('Instance is already running.')
  }

  const fullConfig = getConfig()
  const account = fullConfig.accounts.find(a => a.uuid === fullConfig.activeAccountId)
  if (!account) throw new Error('No active account. Please sign in first.')

  const instanceStore = await import('../instance-store')
  const instance = instanceStore.getInstanceById(instanceId)
  if (!instance) throw new Error(`Instance not found: ${instanceId}`)
  if (!instance.isInstalled) throw new Error('Minecraft is not installed for this instance.')

  const versionJson = readVersionJson(instance.minecraftVersion)
  if (!versionJson) throw new Error('Version JSON missing. Please reinstall.')

  const isForge = instance.modLoader === 'forge' || instance.modLoader === 'neoforge'
  const forgeJson = isForge ? readForgeJson(instance.minecraftVersion) : null
  if (isForge && !forgeJson) {
    throw new Error('Forge is not fully installed. Please reinstall this instance.')
  }
  const fabricJson = instance.modLoader === 'fabric'
    ? readFabricJson(instance.minecraftVersion)
    : forgeJson ?? undefined

  const requiredJava = versionJson.javaVersion?.majorVersion ?? 8
  const { exe: javaExe, version: javaVersion } = await resolveJava(requiredJava, instance.javaPath)

  const gameDir = join(paths.instances, instanceId, 'minecraft')
  mkdirSync(join(gameDir, 'mods'), { recursive: true })
  mkdirSync(join(gameDir, 'saves'), { recursive: true })

  const { token: accessToken, xuid, clientId } = await getOrRefreshMinecraftToken(account.uuid)

  const cmd = buildLaunchCommand({
    versionId: instance.minecraftVersion,
    versionJson,
    fabricJson: fabricJson ?? undefined,
    librariesDir: paths.libraries,
    assetsDir: paths.assets,
    nativesDir: nativesDir(instanceId),
    gameDir,
    clientJar: clientJarPath(instance.minecraftVersion),
    javaExe,
    memoryMb: instance.memoryMb,
    auth: {
      username: account.username,
      uuid: account.uuid,
      accessToken,
      xuid,
      clientId,
      userType: account.type === 'microsoft' ? 'msa' : 'legacy',
    },
  })

  // Strip JVM flags that require a Java version newer than what we have
  const versionGatedFlags: Array<{ flag: string; minJava: number }> = [
    { flag: '--sun-misc-unsafe-memory-access', minJava: 25 },
  ]
  const [exe, ...rawArgs] = cmd
  const args = rawArgs.filter(arg =>
    !versionGatedFlags.some(({ flag, minJava }) => arg.startsWith(flag) && javaVersion < minJava)
  )

  const proc = spawn(exe, args, {
    cwd: gameDir,
    detached: false,
  })

  runningProcesses.set(instanceId, proc)

  // Record last played
  instanceStore.updateInstance(instanceId, { lastPlayed: new Date().toISOString() })

  proc.stdout?.on('data', (data: Buffer) => {
    mainWindow.webContents.send('mc:log', { instanceId, line: data.toString(), stream: 'stdout' })
  })
  proc.stderr?.on('data', (data: Buffer) => {
    mainWindow.webContents.send('mc:log', { instanceId, line: data.toString(), stream: 'stderr' })
  })
  proc.on('exit', (code) => {
    runningProcesses.delete(instanceId)
    mainWindow.webContents.send('mc:exit', { instanceId, code })
  })
  proc.on('error', (err) => {
    runningProcesses.delete(instanceId)
    mainWindow.webContents.send('mc:exit', { instanceId, code: -1, error: err.message })
  })
}

export function stopInstance(instanceId: string): void {
  const proc = runningProcesses.get(instanceId)
  if (proc) {
    proc.kill()
    runningProcesses.delete(instanceId)
  }
}

export function isInstanceRunning(instanceId: string): boolean {
  return runningProcesses.has(instanceId)
}
