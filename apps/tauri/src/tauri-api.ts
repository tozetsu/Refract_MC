import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'

// This is the Tauri equivalent of the Electron preload's `window.api`. In the
// full migration, the renderer's `lib/api.ts` would route here (invoke) instead
// of `ipcRenderer`. For the POC we only port the `config` surface.
export interface AppConfig {
  activeAccountId: string | null
  activeThemeId: string
  defaultMemoryMb: number
  onboardingDone: boolean
  analyticsEnabled?: boolean
  [key: string]: unknown
}

export const configApi = {
  get: (): Promise<AppConfig> => invoke<AppConfig>('config_get'),
  set: (key: string, value: unknown): Promise<AppConfig> =>
    invoke<AppConfig>('config_set', { key, value }),
}

export interface InstanceSummary {
  id: string
  name: string
  minecraftVersion: string
  modLoader?: string
  isInstalled?: boolean
  lastPlayed?: string
  [key: string]: unknown
}

export const instancesApi = {
  list: (): Promise<InstanceSummary[]> => invoke<InstanceSummary[]>('instances_list'),
}

export interface DownloadProgress {
  downloaded: number
  total: number
  percent: number
}

export const downloadApi = {
  start: (url: string): Promise<string> => invoke<string>('download_demo', { url }),
  onProgress: (cb: (p: DownloadProgress) => void): Promise<UnlistenFn> =>
    listen<DownloadProgress>('download://progress', e => cb(e.payload)),
}

export const processApi = {
  run: (program: string, args: string[]): Promise<number> => invoke<number>('process_run', { program, args }),
  onLog: (cb: (line: string) => void): Promise<UnlistenFn> =>
    listen<string>('process://log', e => cb(e.payload)),
  onExit: (cb: (code: number) => void): Promise<UnlistenFn> =>
    listen<number>('process://exit', e => cb(e.payload)),
}

export interface DeviceStart {
  device_code: string
  user_code: string
  verification_uri: string
  interval: number
  expires_in: number
  message: string
}
export type PollResult =
  | { status: 'pending' }
  | { status: 'success'; access_token: string; refresh_token?: string; expires_in: number }

export const authApi = {
  deviceStart: (): Promise<DeviceStart> => invoke<DeviceStart>('auth_device_start'),
  devicePoll: (deviceCode: string): Promise<PollResult> =>
    invoke<PollResult>('auth_device_poll', { deviceCode }),
  vaultPath: (): Promise<string> => invoke<string>('vault_path'),
}
