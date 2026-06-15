import { Stronghold, type Client } from '@tauri-apps/plugin-stronghold'
import { authApi } from './tauri-api'

// Encrypted token store (replaces Electron's safeStorage). POC: a fixed passphrase
// derives the vault key (the Rust plugin hashes it). A real build would prompt for
// or derive this from an OS-protected secret.
const PASSWORD = 'refract-poc'
const CLIENT = 'refract'

async function open(): Promise<{ stronghold: Stronghold; store: ReturnType<Client['getStore']> }> {
  const path = await authApi.vaultPath()
  const stronghold = await Stronghold.load(path, PASSWORD)
  let client: Client
  try {
    client = await stronghold.loadClient(CLIENT)
  } catch {
    client = await stronghold.createClient(CLIENT)
  }
  return { stronghold, store: client.getStore() }
}

export async function vaultSet(key: string, value: string): Promise<void> {
  const { stronghold, store } = await open()
  await store.insert(key, Array.from(new TextEncoder().encode(value)))
  await stronghold.save()
}

export async function vaultGet(key: string): Promise<string | null> {
  const { store } = await open()
  const data = await store.get(key)
  if (!data) return null
  return new TextDecoder().decode(new Uint8Array(data))
}
