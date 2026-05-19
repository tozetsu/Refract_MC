export interface AuthAccount {
  uuid: string
  username: string
  type: 'microsoft' | 'offline'
  accessToken?: string
}

export async function authenticateMicrosoft(): Promise<AuthAccount> {
  throw new Error('Not implemented')
}

export function createOfflineAccount(username: string): AuthAccount {
  return {
    uuid: crypto.randomUUID(),
    username,
    type: 'offline',
  }
}
