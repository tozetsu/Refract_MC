import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import type { Instance } from '@refract/core'
import { PixelScene, loaderToScene } from '@/components/ui/PixelScene'
import { ChevLeftIcon, ChevRightIcon } from '@/components/ui/BlockIcons'
import { CreateInstanceDialog } from '@/components/instances/CreateInstanceDialog'
import { EditInstanceDialog } from '@/components/instances/EditInstanceDialog'
import { useInstances, useCreateInstance, useUpdateInstance, useDeleteInstance } from '@/hooks/use-instances'

export const Route = createFileRoute('/')({
  component: Library,
})

const WHATS_NEW = [
  { version: '0.3.1', note: 'Instance grid, create/edit dialogs, launch toast' },
  { version: '0.3.0', note: 'Theme engine with Minecraft palette + Zustand store' },
  { version: '0.2.0', note: 'App shell, sidebar, TitleBar with traffic lights' },
]

const ACTIVITY = [
  { label: 'Launched Vanilla 1.20.4', time: '2 min ago' },
  { label: 'Edited "Fabric Dev"', time: '1 hr ago' },
  { label: 'Installed Sodium 0.5.8', time: 'Yesterday' },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'Still up,'
  if (h < 12) return 'Good morning,'
  if (h < 18) return 'Good afternoon,'
  if (h < 22) return 'Good evening,'
  return 'Welcome back,'
}

function useClock() {
  const [t, setT] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return t
}

function PlayButton({ onClick }: { onClick?: () => void }) {
  const [down, setDown] = useState(false)
  return (
    <button
      onMouseDown={() => setDown(true)}
      onMouseUp={() => { setDown(false); onClick?.() }}
      onMouseLeave={() => setDown(false)}
      style={{
        fontFamily: "'VT323',monospace",
        fontSize: 20,
        letterSpacing: '.12em',
        color: '#fff',
        padding: '0 28px',
        height: 40,
        background: 'var(--accent)',
        border: 'none',
        cursor: 'pointer',
        userSelect: 'none',
        outline: 'none',
        position: 'relative',
        top: down ? 2 : 0,
        boxShadow: down
          ? 'inset 0 2px 0 var(--accent-lo), inset 0 -2px 0 var(--accent-hi)'
          : 'inset 0 -4px 0 var(--accent-lo), inset 0 4px 0 var(--accent-hi), 0 4px 0 rgba(0,0,0,.5)',
        transition: 'box-shadow 60ms, top 60ms',
      }}
    >
      PLAY
    </button>
  )
}

function HeroCard({ instance, onLaunch, onEdit }: { instance: Instance; onLaunch: () => void; onEdit: () => void }) {
  return (
    <div style={{
      flex: '0 0 340px',
      background: 'var(--surface)',
      border: '1px solid var(--border-r)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ height: 160, position: 'relative', overflow: 'hidden' }}>
        <PixelScene name={loaderToScene(instance.modLoader)} style={{ width: '100%', height: '100%' }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,.6))',
          height: 60,
        }} />
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: 'rgba(0,0,0,.55)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 3,
          padding: '2px 7px',
          fontFamily: "'VT323',monospace",
          fontSize: 13,
          color: 'var(--ink-3)',
          letterSpacing: '.06em',
        }}>
          {instance.modLoader?.toUpperCase() ?? 'VANILLA'}
        </div>
      </div>

      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.2 }}>{instance.name}</div>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 14, color: 'var(--ink-4)', letterSpacing: '.04em' }}>
          MC {instance.mcVersion}
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', gap: 8, paddingTop: 10 }}>
          <PlayButton onClick={onLaunch} />
          <button
            onClick={onEdit}
            style={{
              fontSize: 12, fontWeight: 500,
              color: 'var(--ink-3)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border-r)',
              borderRadius: 3,
              padding: '0 14px',
              height: 40,
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}

function PreviewCard({ instance, onLaunch, onEdit }: { instance: Instance; onLaunch: () => void; onEdit: () => void }) {
  return (
    <div style={{
      flex: '0 0 180px',
      background: 'var(--surface)',
      border: '1px solid var(--border-r)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      cursor: 'pointer',
      opacity: 0.85,
    }}
    onClick={onEdit}
    >
      <div style={{ height: 90, position: 'relative', overflow: 'hidden' }}>
        <PixelScene name={loaderToScene(instance.modLoader)} style={{ width: '100%', height: '100%' }} />
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{instance.name}</div>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 12, color: 'var(--ink-4)', letterSpacing: '.04em', marginTop: 2 }}>MC {instance.mcVersion}</div>
        <button
          onClick={(e) => { e.stopPropagation(); onLaunch() }}
          style={{
            marginTop: 8,
            width: '100%',
            fontFamily: "'VT323',monospace",
            fontSize: 15,
            letterSpacing: '.1em',
            color: '#fff',
            height: 28,
            background: 'var(--accent)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: 'inset 0 -3px 0 var(--accent-lo), inset 0 3px 0 var(--accent-hi)',
          }}
        >
          PLAY
        </button>
      </div>
    </div>
  )
}

function EmptyState({ onOpen }: { onOpen: () => void }) {
  return (
    <div style={{
      padding: '60px 40px',
      background: 'var(--surface)',
      border: '1px solid var(--border-r)',
      borderRadius: 'var(--radius)',
      textAlign: 'center',
    }}>
      <div style={{
        width: 48, height: 48, margin: '0 auto 16px',
        background: 'var(--surface-2)',
        border: '1px solid var(--border-r)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 20, height: 20, background: 'var(--accent)', opacity: .5 }} />
      </div>
      <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', margin: '0 0 6px' }}>No instances yet</p>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 20px', maxWidth: 320, marginInline: 'auto' }}>
        Create your first Minecraft instance to get started
      </p>
      <button
        onClick={onOpen}
        style={{
          fontFamily: "'VT323',monospace",
          fontSize: 18, letterSpacing: '.1em', color: '#fff',
          padding: '0 24px', height: 38,
          background: 'var(--accent)', border: 'none', cursor: 'pointer',
          boxShadow: 'inset 0 -3px 0 var(--accent-lo), inset 0 3px 0 var(--accent-hi)',
        }}
      >
        NEW INSTANCE
      </button>
    </div>
  )
}

function Library() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Instance | null>(null)
  const [launchToast, setLaunchToast] = useState<string | null>(null)
  const [carouselTab, setCarouselTab] = useState<'recent' | 'pinned' | 'all'>('recent')
  const [carouselPage, setCarouselPage] = useState(0)

  const { data: instances = [], isLoading } = useInstances()
  const createInstance = useCreateInstance()
  const updateInstance = useUpdateInstance()
  const deleteInstance = useDeleteInstance()

  const clock = useClock()
  const timeStr = clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

  function handleLaunch(instance: Instance) {
    setLaunchToast(`${instance.name} — launch engine coming soon!`)
    setTimeout(() => setLaunchToast(null), 3000)
  }

  const visibleInstances = instances.slice(carouselPage * 3, carouselPage * 3 + 3)
  const heroInstance = visibleInstances[0] ?? null
  const previewInstances = visibleInstances.slice(1, 3)
  const totalPages = Math.max(1, Math.ceil(instances.length / 3))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Greeting + clock */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 2 }}>{greeting()}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>
            <span style={{ color: 'var(--accent)' }}>Steve</span>
          </div>
        </div>
        <div style={{ fontFamily: "'VT323',monospace", fontSize: 22, color: 'var(--ink-4)', letterSpacing: '.08em', lineHeight: 1 }}>
          {timeStr}
        </div>
      </div>

      {/* Instance carousel */}
      <div>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Your Instances</span>
            {(['recent', 'pinned', 'all'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setCarouselTab(tab); setCarouselPage(0) }}
                style={{
                  marginLeft: 6,
                  fontSize: 11, fontWeight: 500,
                  color: carouselTab === tab ? 'var(--ink)' : 'var(--ink-4)',
                  background: carouselTab === tab ? 'var(--accent-tint)' : 'transparent',
                  border: `1px solid ${carouselTab === tab ? 'var(--accent)' : 'transparent'}`,
                  borderRadius: 3,
                  padding: '2px 8px',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {instances.length > 0 && (
            <div style={{ display: 'flex', gap: 4 }}>
              <NavBtn disabled={carouselPage === 0} onClick={() => setCarouselPage(p => Math.max(0, p - 1))}>
                <ChevLeftIcon />
              </NavBtn>
              <NavBtn disabled={carouselPage >= totalPages - 1} onClick={() => setCarouselPage(p => Math.min(totalPages - 1, p + 1))}>
                <ChevRightIcon />
              </NavBtn>
              <button
                onClick={() => setCreateOpen(true)}
                style={{
                  marginLeft: 4,
                  fontSize: 11, fontWeight: 600,
                  color: 'var(--ink-2)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border-r)',
                  borderRadius: 3,
                  padding: '3px 10px',
                  cursor: 'pointer',
                }}
              >
                + New
              </button>
            </div>
          )}
        </div>

        {/* Cards */}
        {isLoading ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)', fontSize: 13 }}>
            Loading…
          </div>
        ) : instances.length === 0 ? (
          <EmptyState onOpen={() => setCreateOpen(true)} />
        ) : (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {heroInstance && (
              <HeroCard
                instance={heroInstance}
                onLaunch={() => handleLaunch(heroInstance)}
                onEdit={() => setEditTarget(heroInstance)}
              />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {previewInstances.map(inst => (
                <PreviewCard
                  key={inst.id}
                  instance={inst}
                  onLaunch={() => handleLaunch(inst)}
                  onEdit={() => setEditTarget(inst)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom panels */}
      {instances.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* What's New */}
          <Panel title="What's New">
            {WHATS_NEW.map(item => (
              <div key={item.version} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ fontFamily: "'VT323',monospace", fontSize: 13, color: 'var(--accent)', letterSpacing: '.06em', flexShrink: 0 }}>v{item.version}</span>
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{item.note}</span>
              </div>
            ))}
          </Panel>

          {/* Activity */}
          <Panel title="Activity">
            {ACTIVITY.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{item.label}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-4)', flexShrink: 0 }}>{item.time}</span>
              </div>
            ))}
          </Panel>
        </div>
      )}

      {/* Launch toast */}
      {launchToast && (
        <div style={{
          position: 'fixed', bottom: 44, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 18px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border-r)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 24px rgba(0,0,0,.5)',
          fontSize: 13, color: 'var(--ink)',
          zIndex: 50,
        }}>
          <div style={{ width: 8, height: 8, background: 'var(--accent)', flexShrink: 0 }} />
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border-r)',
      borderRadius: 'var(--radius)',
      padding: '12px 14px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 6 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function NavBtn({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 24, height: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface)',
        border: '1px solid var(--border-r)',
        borderRadius: 3,
        color: disabled ? 'var(--ink-4)' : 'var(--ink-2)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  )
}
