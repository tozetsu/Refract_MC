import { ipcMain } from 'electron'
import { getConfig, setConfig, type AppConfig } from '../services/config'

export function registerConfigIpc(): void {
  ipcMain.handle('config.get', () => {
    const config = getConfig()
    // strip encrypted token fields before sending to renderer
    return {
      ...config,
      accounts: config.accounts.map(({ encryptedAccessToken: _, encryptedRefreshToken: __, ...safe }) => safe),
    }
  })

  ipcMain.handle('config.set', <K extends keyof AppConfig>(_event: Electron.IpcMainInvokeEvent, key: K, value: AppConfig[K]) => {
    setConfig(key, value)
  })
}
