import {
  beginMicrosoftLogin,
  completeMicrosoftLogin,
  createOfflineAccount,
  renameOfflineAccount,
  getActiveAccount,
  listSafeAccounts,
  logoutAccount,
  setActiveAccount,
  loginYggdrasil,
} from '../services/auth'
import { handleIpc } from './handle'

export function registerAuthIpc(): void {
  handleIpc('auth.accounts', () => listSafeAccounts())
  handleIpc('auth.active', () => getActiveAccount())
  handleIpc('auth.microsoft.begin', () => beginMicrosoftLogin())
  handleIpc('auth.microsoft.complete', (_event, deviceCode) => completeMicrosoftLogin(String(deviceCode)))
  handleIpc('auth.offline.create', (_event, username) => createOfflineAccount(String(username)))
  handleIpc('auth.offline.rename', (_event, uuid, username) => renameOfflineAccount(String(uuid), String(username)))
  handleIpc('auth.setActive', (_event, uuid) => setActiveAccount(String(uuid)))
  handleIpc('auth.logout', (_event, uuid) => logoutAccount(String(uuid)))
  handleIpc('auth.yggdrasil.login', (_event, serverUrl, username, password) =>
    loginYggdrasil(String(serverUrl), String(username), String(password))
  )
}
