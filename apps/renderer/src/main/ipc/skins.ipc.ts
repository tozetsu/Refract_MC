import { dialog } from 'electron'
import { handleIpc } from './handle'
import { listSkins, addSkin, deleteSkin, getSkinPath } from '../services/skins'
import { uploadSkin } from '../services/auth'

export function registerSkinsIpc(): void {
  handleIpc('skins.list', () => listSkins())

  handleIpc('skins.browse', async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: 'Select Skin PNG',
      filters: [{ name: 'PNG Image', extensions: ['png'] }],
      properties: ['openFile'],
    })
    return canceled ? null : (filePaths[0] ?? null)
  })

  handleIpc('skins.add', (_e, name, sourcePath, variant) =>
    addSkin(String(name), String(sourcePath), (String(variant) as 'classic' | 'slim'))
  )

  handleIpc('skins.delete', (_e, id) => deleteSkin(String(id)))

  handleIpc('skins.getPath', (_e, filename) => getSkinPath(String(filename)))

  handleIpc('skins.getDataUrl', (_e, filename) => {
    const { readFileSync, existsSync } = require('fs') as typeof import('fs')
    const p = getSkinPath(String(filename))
    if (!existsSync(p)) return null
    return `data:image/png;base64,${readFileSync(p).toString('base64')}`
  })

  // Read any arbitrary PNG path as base64 data URL (for new skin preview before saving)
  handleIpc('skins.fileToDataUrl', (_e, fullPath) => {
    const { readFileSync, existsSync } = require('fs') as typeof import('fs')
    if (!existsSync(String(fullPath))) return null
    return `data:image/png;base64,${readFileSync(String(fullPath)).toString('base64')}`
  })

  handleIpc('skins.apply', async (_e, skinId, accountUuid) => {
    const skins = listSkins()
    const skin = skins.find(s => s.id === String(skinId))
    if (!skin) throw new Error('Skin not found')
    await uploadSkin(String(accountUuid), getSkinPath(skin.filename), skin.variant)
  })
}
