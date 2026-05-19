import { BrowserWindow } from 'electron'
import { registerWindowIpc } from './window.ipc'
import { registerConfigIpc } from './config.ipc'

export function registerAllIpcHandlers(mainWindow: BrowserWindow): void {
  registerWindowIpc(mainWindow)
  registerConfigIpc()
}
