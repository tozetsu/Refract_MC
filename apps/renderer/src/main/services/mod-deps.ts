import { getInstanceById } from './instance-store'
import { getProjectVersions, getCurseForgeFiles, CF_LOADER } from '@refract/core'
import type { ModrinthVersion, CFFile, ResolvedDep, Instance } from '@refract/core'

const UA = 'Refract/1.0 (github.com/ShevRuslan1)'

function instanceContext(instanceId: string): { mc?: string; loader?: Instance['modLoader']; installed: Set<string> } {
  const inst = getInstanceById(instanceId)
  return {
    mc: inst?.minecraftVersion,
    loader: inst?.modLoader,
    installed: new Set((inst?.mods ?? []).map(m => m.projectId)),
  }
}

async function modrinthNames(ids: string[]): Promise<Record<string, string>> {
  if (!ids.length) return {}
  try {
    const res = await fetch(
      `https://api.modrinth.com/v2/projects?ids=${encodeURIComponent(JSON.stringify(ids))}`,
      { headers: { 'User-Agent': UA, Accept: 'application/json' } },
    )
    if (!res.ok) return {}
    const arr = await res.json() as Array<{ id: string; title: string }>
    const map: Record<string, string> = {}
    for (const p of arr) map[p.id] = p.title
    return map
  } catch { return {} }
}

/** Transitive required deps + direct optional deps for a Modrinth version. */
export async function planModrinthDeps(instanceId: string, version: ModrinthVersion): Promise<ResolvedDep[]> {
  const { mc, loader, installed } = instanceContext(instanceId)
  const out = new Map<string, ResolvedDep>()
  const visited = new Set<string>()

  async function walk(deps: ModrinthVersion['dependencies']): Promise<void> {
    const req: string[] = []
    const opt: string[] = []
    for (const d of deps) {
      if (!d.project_id || d.project_id.startsWith('cf:')) continue
      if (d.dependency_type === 'required') req.push(d.project_id)
      else if (d.dependency_type === 'optional') opt.push(d.project_id)
    }
    const names = await modrinthNames([...new Set([...req, ...opt])])
    for (const id of opt) {
      if (out.has(id)) continue
      out.set(id, { source: 'modrinth', key: id, name: names[id] ?? id, type: 'optional', alreadyInstalled: installed.has(id), projectId: id })
    }
    for (const id of req) {
      if (visited.has(id)) continue
      visited.add(id)
      let versionId: string | undefined
      let childDeps: ModrinthVersion['dependencies'] = []
      try {
        const vs = await getProjectVersions(id, mc, loader)
        versionId = vs[0]?.id
        childDeps = vs[0]?.dependencies ?? []
      } catch { /* unresolved — still surface it so the user knows */ }
      out.set(id, { source: 'modrinth', key: id, name: names[id] ?? out.get(id)?.name ?? id, type: 'required', alreadyInstalled: installed.has(id), projectId: id, versionId })
      await walk(childDeps)
    }
  }

  await walk(version.dependencies)
  return [...out.values()]
}

async function cfModName(modId: number, apiKey: string): Promise<string> {
  try {
    const res = await fetch(`https://api.curseforge.com/v1/mods/${modId}`, { headers: { 'x-api-key': apiKey, Accept: 'application/json' } })
    if (!res.ok) return `Mod ${modId}`
    return (await res.json() as { data?: { name?: string } }).data?.name ?? `Mod ${modId}`
  } catch { return `Mod ${modId}` }
}

/** Transitive required deps + direct optional deps for a CurseForge file. */
export async function planCfDeps(instanceId: string, file: CFFile, apiKey: string): Promise<ResolvedDep[]> {
  const { mc, loader, installed } = instanceContext(instanceId)
  const loaderType = loader ? CF_LOADER[loader as keyof typeof CF_LOADER] : undefined
  const out = new Map<string, ResolvedDep>()
  const visited = new Set<number>()

  async function bestFile(modId: number): Promise<CFFile | undefined> {
    try { return (await getCurseForgeFiles(modId, apiKey, mc, loaderType))[0] } catch { return undefined }
  }

  async function walk(deps: CFFile['dependencies']): Promise<void> {
    for (const d of deps ?? []) {
      const key = `cf:${d.modId}`
      if (d.relationType === 3) { // required
        if (visited.has(d.modId)) continue
        visited.add(d.modId)
        const best = await bestFile(d.modId)
        out.set(key, { source: 'curseforge', key, name: await cfModName(d.modId, apiKey), type: 'required', alreadyInstalled: installed.has(key), modId: d.modId, fileId: best?.id })
        await walk(best?.dependencies)
      } else if (d.relationType === 2) { // optional
        if (out.has(key)) continue
        const best = await bestFile(d.modId)
        out.set(key, { source: 'curseforge', key, name: await cfModName(d.modId, apiKey), type: 'optional', alreadyInstalled: installed.has(key), modId: d.modId, fileId: best?.id })
      }
    }
  }

  await walk(file.dependencies)
  return [...out.values()]
}
