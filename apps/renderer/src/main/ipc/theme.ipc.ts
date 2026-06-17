import { join } from 'path'
import { readdirSync, existsSync, copyFileSync, rmSync, readFileSync } from 'fs'
import { BrowserWindow, dialog } from 'electron'
import { paths } from '../services/paths'
import { handleIpc } from './handle'

function imageMime(path: string): string {
  const lower = path.toLowerCase()
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  return 'image/png'
}

export function registerThemeIpc(): void {
  handleIpc('theme.list', () => {
    if (!existsSync(paths.themes)) return []
    return readdirSync(paths.themes)
      .filter((f) => f.endsWith('.json'))
      .flatMap((f) => {
        try {
          return [JSON.parse(readFileSync(join(paths.themes, f), 'utf-8'))]
        } catch {
          return []
        }
      })
  })

  handleIpc('theme.install', (_event, sourcePath) => {
    const source = String(sourcePath)
    const fileName = source.split(/[\\/]/).pop() ?? 'theme.json'
    const dest = join(paths.themes, fileName)
    copyFileSync(source, dest)
    return JSON.parse(readFileSync(dest, 'utf-8'))
  })

  handleIpc('theme.delete', (_event, fileName) => {
    const filePath = join(paths.themes, String(fileName))
    if (existsSync(filePath)) rmSync(filePath)
  })

  handleIpc('theme.browseBackgroundImage', async () => {
    const owner = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    const options = {
      title: 'Select Theme Background',
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'] },
        { name: 'All files', extensions: ['*'] },
      ],
      properties: ['openFile'],
    } satisfies Electron.OpenDialogOptions
    const result = owner
      ? await dialog.showOpenDialog(owner, options)
      : await dialog.showOpenDialog(options)
    if (result.canceled || !result.filePaths[0]) return null
    const path = result.filePaths[0]
    if (!existsSync(path)) return null
    return `data:${imageMime(path)};base64,${readFileSync(path).toString('base64')}`
  })
}
