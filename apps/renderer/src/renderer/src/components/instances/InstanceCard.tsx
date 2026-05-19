import { Box, Play, MoreVertical, Trash2, Edit } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import type { Instance } from '@refract/core'

interface Props {
  instance: Instance
  onLaunch: (instance: Instance) => void
  onEdit: (instance: Instance) => void
  onDelete: (id: string) => void
}

export function InstanceCard({ instance, onLaunch, onEdit, onDelete }: Props) {
  const lastPlayedLabel = instance.lastPlayed
    ? new Date(instance.lastPlayed).toLocaleDateString()
    : 'Never played'

  const loaderLabel = instance.modLoader
    ? `${instance.modLoader}${instance.modLoaderVersion ? ` ${instance.modLoaderVersion}` : ''}`
    : null

  return (
    <div className="flex flex-col bg-bg-surface border border-border rounded-xl p-4 gap-3 hover:border-accent/40 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-bg-overlay flex items-center justify-center text-text-muted">
        <Box size={24} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-primary truncate">{instance.name}</p>
        <p className="text-xs text-text-secondary mt-0.5">
          {instance.minecraftVersion}
          {loaderLabel && <span className="text-text-muted"> · {loaderLabel}</span>}
        </p>
        <p className="text-xs text-text-muted mt-1">{lastPlayedLabel}</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onLaunch(instance)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-accent text-accent-fg text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          <Play size={13} />
          Launch
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="p-1.5 rounded-lg text-text-muted hover:bg-bg-hover hover:text-text-secondary transition-colors">
              <MoreVertical size={15} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[140px] bg-bg-overlay border border-border rounded-lg p-1 shadow-xl z-50"
              sideOffset={4}
              align="end"
            >
              <DropdownMenu.Item
                onSelect={() => onEdit(instance)}
                className="flex items-center gap-2 px-2 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-md cursor-pointer outline-none"
              >
                <Edit size={13} />
                Edit
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                onSelect={() => onDelete(instance.id)}
                className="flex items-center gap-2 px-2 py-1.5 text-sm text-error hover:bg-error/10 rounded-md cursor-pointer outline-none"
              >
                <Trash2 size={13} />
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  )
}
