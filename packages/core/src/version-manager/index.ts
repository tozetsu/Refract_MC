export interface MinecraftVersion {
  id: string
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha'
  releaseTime: string
  url: string
}

export async function fetchVersionList(): Promise<MinecraftVersion[]> {
  throw new Error('Not implemented')
}
