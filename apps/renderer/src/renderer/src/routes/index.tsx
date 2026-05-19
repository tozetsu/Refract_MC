import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Plus, Layers, Rocket } from 'lucide-react'
import type { Instance } from '@refract/core'
import { InstanceCard } from '@/components/instances/InstanceCard'
import { CreateInstanceDialog } from '@/components/instances/CreateInstanceDialog'
import { EditInstanceDialog } from '@/components/instances/EditInstanceDialog'
import { useInstances, useCreateInstance, useUpdateInstance, useDeleteInstance } from '@/hooks/use-instances'

export const Route = createFileRoute('/')({
  component: Instances,
})

function Instances() {
  const [createOpen, setCreateOpen]       = useState(false)
  const [editTarget, setEditTarget]       = useState<Instance | null>(null)
  const [launchToast, setLaunchToast]     = useState<string | null>(null)

  const { data: instances = [], isLoading } = useInstances()
  const createInstance  = useCreateInstance()
  const updateInstance  = useUpdateInstance()
  const deleteInstance  = useDeleteInstance()

  function handleLaunch(instance: Instance) {
    setLaunchToast(`Launch engine coming soon — hang tight!`)
    setTimeout(() => setLaunchToast(null), 3000)
  }

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Instances</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {instances.length > 0
              ? `${instances.length} instance${instances.length !== 1 ? 's' : ''}`
              : 'No instances yet'}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-fg text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          <Plus size={15} />
          New Instance
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
          Loading…
        </div>
      ) : instances.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-bg-surface border border-border flex items-center justify-center text-text-muted">
            <Layers size={28} />
          </div>
          <div>
            <p className="text-text-primary font-semibold">No instances yet</p>
            <p className="text-sm text-text-secondary mt-1">Create your first Minecraft instance to get started</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-fg text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            <Plus size={15} />
            Create Instance
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 content-start">
          {instances.map((instance) => (
            <InstanceCard
              key={instance.id}
              instance={instance}
              onLaunch={handleLaunch}
              onEdit={setEditTarget}
              onDelete={(id) => deleteInstance.mutate({ id, deleteFiles: true })}
            />
          ))}
        </div>
      )}

      {/* Launch toast */}
      {launchToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 bg-bg-overlay border border-border rounded-xl shadow-xl text-sm text-text-primary z-50">
          <Rocket size={14} className="text-accent shrink-0" />
          {launchToast}
        </div>
      )}

      <CreateInstanceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={async (input) => { await createInstance.mutateAsync(input) }}
      />

      <EditInstanceDialog
        instance={editTarget}
        open={editTarget !== null}
        onOpenChange={(v) => { if (!v) setEditTarget(null) }}
        onSave={async (id, patch) => { await updateInstance.mutateAsync({ id, patch }) }}
      />
    </div>
  )
}
