export interface Instance {
  id: string
  name: string
  minecraftVersion: string
  modLoader?: 'fabric' | 'forge' | 'quilt' | 'neoforge'
  modLoaderVersion?: string
  javaArgs?: string
  createdAt: string
}

export function createInstance(partial: Omit<Instance, 'id' | 'createdAt'>): Instance {
  return {
    ...partial,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
}
