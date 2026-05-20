import { BrowserWindow } from 'electron'
import { handleIpc } from './handle'
import { installModpack, installContentPack } from '../services/modpack'

export function registerModpackIpc(mainWindow: BrowserWindow): void {
  handleIpc('modpack.install', async (_event, name, projectId, versionId) =>
    installModpack(
      String(name),
      String(projectId),
      versionId ? String(versionId) : undefined,
      mainWindow
    )
  )

  handleIpc('modpack.content.install', async (_event, instanceId, projectId, projectName, contentType, versionId) =>
    installContentPack(
      String(instanceId),
      String(projectId),
      String(projectName),
      String(contentType) as 'resourcepack' | 'shader' | 'datapack',
      versionId ? String(versionId) : undefined
    )
  )
}
