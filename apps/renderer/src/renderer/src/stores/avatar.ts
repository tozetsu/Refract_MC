import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AvatarStore {
  avatars: Record<string, string>
  setAvatar: (uuid: string, dataUrl: string) => void
  removeAvatar: (uuid: string) => void
}

export const useAvatarStore = create<AvatarStore>()(
  persist(
    (set) => ({
      avatars: {},
      setAvatar: (uuid, dataUrl) => set((s) => ({ avatars: { ...s.avatars, [uuid]: dataUrl } })),
      removeAvatar: (uuid) => set((s) => {
        const next = { ...s.avatars }
        delete next[uuid]
        return { avatars: next }
      }),
    }),
    { name: 'refract-avatars' }
  )
)
