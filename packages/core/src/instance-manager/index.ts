export type ModLoader = 'fabric' | 'forge' | 'quilt' | 'neoforge'

export interface Instance {
  id: string
  name: string
  minecraftVersion: string
  modLoader?: ModLoader
  modLoaderVersion?: string
  javaPath?: string
  javaArgs?: string
  memoryMb: number
  iconPath?: string
  groupId?: string
  lastPlayed?: string
  totalTimePlayed: number
  createdAt: string
}

export type CreateInstanceInput = Omit<Instance, 'id' | 'createdAt' | 'totalTimePlayed'>

export function createInstance(input: CreateInstanceInput): Instance {
  return {
    ...input,
    id: crypto.randomUUID(),
    totalTimePlayed: 0,
    createdAt: new Date().toISOString(),
  }
}
