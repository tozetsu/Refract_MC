/// <reference types="vite/client" />

import type { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      config: {
        get: () => Promise<{
          activeAccountId: string | null
          activeThemeId: string
          windowBounds: { width: number; height: number; x?: number; y?: number }
          accounts: Array<{
            uuid: string
            username: string
            type: 'microsoft' | 'offline' | 'yggdrasil'
            expiresAt?: number
            yggdrasilServer?: string
          }>
        }>
        set: (key: string, value: unknown) => Promise<void>
      }
      window: {
        minimize: () => void
        maximize: () => void
        close: () => void
        isMaximized: () => Promise<boolean>
        onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void
      }
    }
  }
}
