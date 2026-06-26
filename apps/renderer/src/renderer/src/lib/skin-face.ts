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