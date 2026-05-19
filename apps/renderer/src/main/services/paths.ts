import { app } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'

const userData = app.getPath('userData')

export const paths = {
  userData,
  instances: join(userData, 'instances'),
  themes:    join(userData, 'themes'),
  plugins:   join(userData, 'plugins'),
  java:      join(userData, 'java'),
  assets:    join(userData, 'assets'),
  libraries: join(userData, 'libraries'),
  versions:  join(userData, 'versions'),
  cache:     join(userData, 'cache'),
  logs:      join(userData, 'logs'),
} as const

export function ensureAppDirs(): void {
  for (const dir of Object.values(paths)) {
    if (dir !== userData) {
      mkdirSync(dir, { recursive: true })
    }
  }
}
