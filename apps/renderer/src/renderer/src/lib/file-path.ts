/**
 * Resolve the absolute filesystem path of a File obtained from a drag-drop or
 * an `<input type="file">`.
 *
 * With the renderer sandboxed, Electron no longer populates the legacy
 * `File.path` property, so the path must be resolved through
 * `webUtils.getPathForFile`, which the preload exposes as
 * `window.electron.webUtils`. Falls back to `File.path` for the browser
 * preview build (where `window.electron` is absent).
 */
export function getFilePath(file: File): string | null {
  const webUtils = window.electron?.webUtils
  if (webUtils?.getPathForFile) {
    try {
      const p = webUtils.getPathForFile(file)
      if (p) return p
    } catch { /* fall through to legacy property */ }
  }
  return (file as File & { path?: string }).path ?? null
}
