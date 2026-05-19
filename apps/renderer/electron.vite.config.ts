import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

const workspaceAlias = {
  '@refract/core':       resolve('../../packages/core/src/index.ts'),
  '@refract/plugin-api': resolve('../../packages/plugin-api/src/index.ts'),
}

const workspaceExclude = ['@refract/core', '@refract/plugin-api']

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: workspaceExclude })],
    resolve: { alias: workspaceAlias },
  },
  preload: {
    plugins: [externalizeDepsPlugin({ exclude: workspaceExclude })],
    resolve: { alias: workspaceAlias },
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        ...workspaceAlias,
      },
    },
    plugins: [tailwindcss(), react(), TanStackRouterVite()],
  },
})
