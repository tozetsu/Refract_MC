import { _electron as electron } from 'playwright-core'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const electronBin = 'C:\\Users\\rshev\\Projects\\mc-launcher\\node_modules\\.pnpm\\electron@31.7.7\\node_modules\\electron\\dist\\electron.exe'
const appDir = 'C:\\Users\\rshev\\Projects\\mc-launcher\\apps\\renderer'

async function wait(ms) { return new Promise(r => setTimeout(r, ms)) }

console.log('Launching Electron…')

// Try with --inspect so playwright can attach
const app = await electron.launch({
  executablePath: electronBin,
  args: ['.'],
  cwd: appDir,
  env: {
    ...process.env,
    NODE_ENV: 'production',
    ELECTRON_DISABLE_SECURITY_WARNINGS: '1',
  },
  timeout: 30000,
})

console.log('App launched. Waiting for window…')
const page = await app.firstWindow()
await page.waitForLoadState('domcontentloaded')
await wait(3000)

const shotDir = __dirname

// Screenshot 1: Home / Library
await page.screenshot({ path: path.join(shotDir, 'shot-01-library.png') })
console.log('✓ shot-01-library.png')

// Open create dialog — find the New Instance / + New button
const btn = await page.evaluate(() => {
  const all = [...document.querySelectorAll('button')]
  const found = all.find(b => /new instance|new/i.test(b.textContent ?? ''))
  if (found) { found.click(); return found.textContent?.trim() }
  return null
})
console.log('Clicked:', btn)
await wait(600)

await page.screenshot({ path: path.join(shotDir, 'shot-02-create-dialog.png') })
console.log('✓ shot-02-create-dialog.png')

// Type a name
const nameInput = page.locator('input[type="text"]').first()
await nameInput.fill('Survival World')
await wait(300)

// Click Fabric
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')]
  const b = btns.find(b => b.textContent?.trim() === 'Fabric')
  b?.click()
})
await wait(400)

await page.screenshot({ path: path.join(shotDir, 'shot-03-dialog-fabric.png') })
console.log('✓ shot-03-dialog-fabric.png')

await app.close()
console.log('Done.')
