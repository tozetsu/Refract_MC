type QueueProgress = (position: number) => void

let tail: Promise<void> = Promise.resolve()
let active = false
let waiting = 0

export function enqueueDownload<T>(
  onQueued: QueueProgress | undefined,
  run: () => Promise<T>
): Promise<T> {
  const position = waiting + (active ? 1 : 0)
  waiting += 1
  onQueued?.(position)

  const job = tail
    .catch(() => undefined)
    .then(async () => {
      waiting -= 1
      active = true
      try {
        return await run()
      } finally {
        active = false
      }
    })

  tail = job.then(() => undefined, () => undefined)
  return job
}
