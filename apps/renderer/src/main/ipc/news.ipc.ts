import { shell } from 'electron'
import { handleIpc } from './handle'

const DISCORD_INVITE_URL = 'https://discord.gg/SUPuuTjMGU'

function validateMinecraftArticleUrl(value: string): string {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.hostname !== 'www.minecraft.net' || !url.pathname.startsWith('/en-us/article')) {
    throw new Error('Only official Minecraft article URLs can be opened.')
  }
  return url.toString()
}

export function registerNewsIpc(): void {
  handleIpc('news.open', async (_event, value) => {
    await shell.openExternal(validateMinecraftArticleUrl(String(value)))
  })

  handleIpc('discord.openInvite', async () => {
    await shell.openExternal(DISCORD_INVITE_URL)
  })
}
