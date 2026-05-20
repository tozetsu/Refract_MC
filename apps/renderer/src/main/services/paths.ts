import { app } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'

function getUserData() {
  return app.getPath('userData')
}

export const paths = {
  get userData()    { return getUserData() },
  get instances()   { return join(getUserData(), 'instances') },
  get themes()      { return join(getUserData(), 'themes') },
  get plugins()     { return join(getUserData(), 'plugins') },
  get java()        { return join(getUserData(), 'java') },
  get assets()      { return join(getUserData(), 'assets') },
  get libraries()   { return join(getUserData(), 'libraries') },
  get versions()    { return join(getUserData(), 'versions') },
  get cache()       { return join(getUserData(), 'cache') },
  get logs()        { return join(getUserData(), 'logs') },
} as const

export function ensureAppDirs(): void {
  const base = getUserData()
  for (const key of ['instances','themes','plugins','java','assets','libraries','versions','cache','logs'] as const) {
    mkdirSync(join(base, key), { recursive: true })
  }
}
