import { ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'

export const api = {
  config: {
    get: () => ipcRenderer.invoke('config.get'),
    set: <K extends string>(key: K, value: unknown) => ipcRenderer.invoke('config.set', key, value),
  },
  window: {
    minimize: (): void => ipcRenderer.send('window:minimize'),
    maximize: (): void => ipcRenderer.send('window:maximize'),
    close: (): void => ipcRenderer.send('window:close'),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),
    onMaximizedChange: (callback: (isMaximized: boolean) => void): (() => void) => {
      const handler = (_event: IpcRendererEvent, value: boolean): void => callback(value)
      ipcRenderer.on('window:maximized-change', handler)
      return () => ipcRenderer.off('window:maximized-change', handler)
    },
  },
} as const

export type RefractAPI = typeof api
