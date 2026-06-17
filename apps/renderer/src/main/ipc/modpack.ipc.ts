import { BrowserWindow, dialog } from 'electron'
import { handleIpc } from './handle'
import { installModpack, installContentPack, installModpackFromFile } from '../services/modpack'
import { checkModpackUpdate, updateModpack } from '../services/modpack-updates'
import { enqueueDownload } from '../services/download-queue'

function sendQueued(mainWindow: BrowserWindow, projectId: string, position: number): void {
  if (position > 0) {
    mainWindow.webContents.send('modpack:progress', {
      projectId,
      step: `Queued (${position} ahead)`,
      percent: 0,
    })
  }
}

export function registerModpackIpc(mainWindow: BrowserWindow): void {
  handleIpc('modpack.checkUpdate', async (_event, instanceId) => checkModpackUpdate(String(instanceId)))

  handleIpc('modpack.update', async (_event, instanceId) =>
    enqueueDownload(
      position => sendQueued(mainWindow, `update:${String(instanceId)}`, position),
      () => updateModpack(String(instanceId), mainWindow)
    )
  )

  handleIpc('modpack.install', async (_event, name, projectId, versionId) =>
    enqueueDownload(
      position => sendQueued(mainWindow, String(projectId), position),
      () => installModpack(
        String(name),
        String(projectId),
        versionId ? String(versionId) : undefined,
        mainWindow
      )
    )
  )

  handleIpc('modpack.content.install', async (_event, instanceId, projectId, projectName, contentType, versionId) =>
    enqueueDownload(
      undefined,
      () => installContentPack(
        String(instanceId),
        String(projectId),
        String(projectName),
        String(contentType) as 'resourcepack' | 'shader' | 'datapack',
        versionId ? String(versionId) : undefined
      )
    )
  )

  handleIpc('modpack.openFileDialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Modpack',
      filters: [
        { name: 'Modpack files', extensions: ['mrpack', 'zip'] },
        { name: 'All files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })
    return result.canceled ? null : result.filePaths[0] ?? null
  })

  handleIpc('modpack.installFromFile', async (_event, filePath, name, importId) =>
    enqueueDownload(
      position => sendQueued(mainWindow, importId ? String(importId) : String(filePath), position),
      () => installModpackFromFile(String(filePath), name ? String(name) : '', mainWindow, importId ? String(importId) : undefined)
    )
  )
}
