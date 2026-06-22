const statusEl = document.getElementById('status')
const errorEl = document.getElementById('error')
const barEl = document.getElementById('bar')

window.bridge.onStatus(({ message, progress }) => {
  statusEl.textContent = message
  errorEl.hidden = true
  if (typeof progress === 'number') {
    barEl.style.width = `${Math.max(8, Math.min(100, progress))}%`
  }
})

window.bridge.onError((message) => {
  statusEl.textContent = 'Update could not continue.'
  errorEl.hidden = false
  errorEl.textContent = `${message}\n\nClose this window and download the latest installer from refractlauncher.com.`
  barEl.style.width = '100%'
})
