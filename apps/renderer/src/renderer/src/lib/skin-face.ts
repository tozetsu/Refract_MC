const CACHE_PREFIX = 'refract.skin-face.v1.'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const REFRESH_EVENT = 'refract:skin-face-refresh'
const DEFAULT_CACHE_SIZES = [42, 64]

type CacheEntry = {
  dataUrl: string
  updatedAt: number
}

type SkinFetch = (uuid: string) => Promise<string | null>
type RefreshDetail = { uuid?: string }

const memoryCache = new Map<string, CacheEntry>()
const inFlight = new Map<string, Promise<string | null>>()

function normalizedUuid(uuid: string): string {
  return uuid.replace(/-/g, '').toLowerCase()
}

function cacheKey(uuid: string, size: number): string {
  return `${CACHE_PREFIX}${normalizedUuid(uuid)}.${size}`
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readCache(key: string, allowStale = false): string | null {
  const now = Date.now()
  const memory = memoryCache.get(key)
  if (memory && (allowStale || now - memory.updatedAt < CACHE_TTL_MS)) return memory.dataUrl

  if (!canUseStorage()) return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry
    if (!parsed.dataUrl || typeof parsed.updatedAt !== 'number') return null
    memoryCache.set(key, parsed)
    if (allowStale || now - parsed.updatedAt < CACHE_TTL_MS) return parsed.dataUrl
  } catch {
    window.localStorage.removeItem(key)
  }
  return null
}

function writeCache(key: string, dataUrl: string): void {
  const entry = { dataUrl, updatedAt: Date.now() }
  memoryCache.set(key, entry)
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // Keep the in-memory cache even if persistent storage is full or unavailable.
  }
}

export function clearSkinFaceCache(uuid?: string): void {
  const uuidPart = uuid ? normalizedUuid(uuid) : null
  for (const key of Array.from(memoryCache.keys())) {
    if (key.startsWith(CACHE_PREFIX) && (!uuidPart || key.includes(`.${uuidPart}.`))) memoryCache.delete(key)
  }

  if (!canUseStorage()) return
  try {
    const keys: string[] = []
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (key?.startsWith(CACHE_PREFIX) && (!uuidPart || key.includes(`.${uuidPart}.`))) keys.push(key)
    }
    keys.forEach(key => window.localStorage.removeItem(key))
  } catch {
    // Ignore storage enumeration failures.
  }
}

export function notifySkinFaceRefresh(uuid?: string): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<RefreshDetail>(REFRESH_EVENT, { detail: { uuid } }))
}

export function invalidateSkinFaceCache(uuid?: string): void {
  clearSkinFaceCache(uuid)
  notifySkinFaceRefresh(uuid)
}

export function subscribeSkinFaceRefresh(cb: (detail: RefreshDetail) => void): () => void {
  if (typeof window === 'undefined') return () => undefined
  const handler = (event: Event) => cb((event as CustomEvent<RefreshDetail>).detail ?? {})
  window.addEventListener(REFRESH_EVENT, handler)
  return () => window.removeEventListener(REFRESH_EVENT, handler)
}

export async function skinFaceDataUrl(skinUrl: string, size = 64): Promise<string | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }

        ctx.imageSmoothingEnabled = false
        ctx.clearRect(0, 0, size, size)
        ctx.drawImage(image, 8, 8, 8, 8, 0, 0, size, size)
        if (image.width >= 48) {
          ctx.drawImage(image, 40, 8, 8, 8, 0, 0, size, size)
        }
        resolve(canvas.toDataURL('image/png'))
      } catch {
        resolve(null)
      }
    }
    image.onerror = () => resolve(null)
    image.src = skinUrl
  })
}

export async function loadSkinFaceDataUrl(uuid: string, size: number, fetchSkinTextureUrl: SkinFetch): Promise<string | null> {
  const key = cacheKey(uuid, size)
  const cached = readCache(key)
  if (cached) return cached

  const existing = inFlight.get(key)
  if (existing) return existing

  const request = (async () => {
    try {
      const skinUrl = await fetchSkinTextureUrl(uuid)
      if (!skinUrl) return readCache(key, true)
      const face = await skinFaceDataUrl(skinUrl, size)
      if (!face) return readCache(key, true)
      writeCache(key, face)
      return face
    } catch {
      return readCache(key, true)
    } finally {
      inFlight.delete(key)
    }
  })()

  inFlight.set(key, request)
  return request
}

export async function primeSkinFaceCacheFromSkinUrl(uuid: string, skinUrl: string, sizes = DEFAULT_CACHE_SIZES): Promise<void> {
  await Promise.all(sizes.map(async (size) => {
    const face = await skinFaceDataUrl(skinUrl, size)
    if (face) writeCache(cacheKey(uuid, size), face)
  }))
  notifySkinFaceRefresh(uuid)
}
