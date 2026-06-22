const { app, BrowserWindow, ipcMain } = require('electron')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { pipeline } = require('node:stream/promises')
const { Readable } = require('node:stream')

const DEFAULT_MANIFEST_URL = 'https://github.com/RefractMC/Refract_MC/releases/latest/download/latest.json'
const MANIFEST_URL = process.env.REFRACT_TAURI_MANIFEST_URL || DEFAULT_MANIFEST_URL
const INSTALLER_ARGS = process.env.REFRACT_TAURI_INSTALLER_ARGS
  ? process.env.REFRACT_TAURI_INSTALLER_ARGS.split(' ').filter(Boolean)
  : ['/S']

let mainWindow
let started = false

function sendStatus(message, progress) {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents.send('bridge:status', { message, progress })
}

function sendError(error) {
  if (!mainWindow || mainWindow.isDestroyed()) return
  const message = error instanceof Error ? error.message : String(error)
  mainWindow.webContents.send('bridge:error', message)
}

function platformKey() {
  if (process.platform === 'win32' && process.arch === 'x64') return 'windows-x86_64'
  if (process.platform === 'darwin' && process.arch === 'arm64') return 'darwin-aarch64'
  if (process.platform === 'darwin' && process.arch === 'x64') return 'darwin-x86_64'
  if (process.platform === 'linux' && process.arch === 'x64') return 'linux-x86_64'
  return null
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'accept': 'application/json',
      'user-agent': `Refract-Electron-Bridge/${app.getVersion()}`
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch update manifest: HTTP ${response.status}`)
  }

  return response.json()
}

async function downloadFile(url, destination) {
  const response = await fetch(url, {
    headers: {
      'user-agent': `Refract-Electron-Bridge/${app.getVersion()}`
    }
  })

  if (!response.ok || !response.body) {
    throw new Error(`Failed to download installer: HTTP ${response.status}`)
  }

  const total = Number(response.headers.get('content-length') || 0)
  let downloaded = 0
  const body = Readable.fromWeb(response.body)
  const progressStream = new Readable({
    read() {}
  })

  body.on('data', (chunk) => {
    downloaded += chunk.length
    if (total > 0) {
      const pct = 20 + Math.floor((downloaded / total) * 65)
      sendStatus(`Downloading installer ${Math.min(100, Math.round((downloaded / total) * 100))}%`, pct)
    } else {
      sendStatus(`Downloading installer ${Math.round(downloaded / 1024 / 1024)} MB`, 45)
    }
    progressStream.push(chunk)
  })

  body.on('end', () => progressStream.push(null))
  body.on('error', (error) => progressStream.destroy(error))

  await pipeline(progressStream, fs.createWriteStream(destination))
}

function installerName(url) {
  const fallback = 'Refract_Tauri_Setup.exe'
  try {
    const parsed = new URL(url)
    const name = path.basename(decodeURIComponent(parsed.pathname))
    return name || fallback
  } catch {
    return fallback
  }
}

async function runBridge() {
  if (started) return
  started = true

  if (process.platform !== 'win32') {
    throw new Error('The Electron-to-Tauri migration bridge is only packaged for Windows.')
  }

  const key = platformKey()
  if (!key) {
    throw new Error(`Unsupported platform for Tauri update: ${process.platform}/${process.arch}`)
  }

  sendStatus('Checking for the new Refract installer...', 10)
  const manifest = await fetchJson(MANIFEST_URL)
  const platform = manifest.platforms && manifest.platforms[key]

  if (!platform || !platform.url) {
    throw new Error(`Update manifest does not contain a ${key} installer.`)
  }

  sendStatus(`Preparing Refract ${manifest.version || 'update'}...`, 20)
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'refract-tauri-'))
  const destination = path.join(tempDir, installerName(platform.url))

  await downloadFile(platform.url, destination)

  sendStatus('Starting installer...', 92)
  const child = spawn(destination, INSTALLER_ARGS, {
    detached: true,
    stdio: 'ignore',
    windowsHide: false
  })
  child.unref()

  sendStatus('Installer started. Refract will reopen after the update.', 100)
  setTimeout(() => app.quit(), 1500)
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 340,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    title: 'Refract Update',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.loadFile(path.join(__dirname, 'index.html'))
  mainWindow.webContents.once('did-finish-load', () => {
    runBridge().catch((error) => {
      sendError(error)
    })
  })
}

ipcMain.handle('bridge:retry', async () => {
  started = false
  return runBridge().catch((error) => {
    sendError(error)
  })
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  app.quit()
})
