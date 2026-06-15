// A dependency resolved for a mod install — shared between the main-process
// resolver (services/mod-deps.ts) and the Browse UI. `key` is the dedupe id
// (Modrinth project id, or `cf:<modId>` for CurseForge).
export interface ResolvedDep {
  source: 'modrinth' | 'curseforge'
  key: string
  name: string
  type: 'required' | 'optional'
  alreadyInstalled: boolean
  // Install coordinates (one set per source):
  projectId?: string   // Modrinth project id
  versionId?: string   // Modrinth version id (resolved for the instance)
  modId?: number       // CurseForge mod id
  fileId?: number      // CurseForge file id (resolved for the instance)
}
