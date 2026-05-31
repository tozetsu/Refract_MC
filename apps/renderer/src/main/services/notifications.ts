import { Notification } from 'electron'

export function notify(title: string, body: string): void {
  try {
    if (!Notification.isSupported()) return
    new Notification({ title, body }).show()
  } catch { /* ignore */ }
}
