export interface LauncherPlugin {
  id: string
  name: string
  version: string
  description?: string
  onLoad?: () => void | Promise<void>
  onUnload?: () => void | Promise<void>
}

export interface PluginContext {
  registerTab: (tab: { id: string; label: string; component: unknown }) => void
}
