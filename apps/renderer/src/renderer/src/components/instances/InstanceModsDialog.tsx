import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import type { Instance } from '@refract/core'

type ContentType = 'mod' | 'resourcepack' | 'shader' | 'datapack'
type ContentEntry = {
  filename: string
  displayName: string
  type: ContentType
  enabled: boolean
  sizeKb: number
  iconDataUrl?: string
}

type TabFilter = 'all' | ContentType

const TABS: Array<{ id: TabFilter; label: string }> = [
  { id: 'all',          label: 'All'            },
  { id: 'mod',          label: 'Mods'           },
  { id: 'resourcepack', label: 'Resource Packs' },
  { id: 'shader',       label: 'Shaders'        },
  { id: 'datapack',     label: 'Datapacks'      },
]

const TYPE_COLOR: Record<ContentType, string> = {
  mod:          'var(--accent)',
  resourcepack: '#6aab9c',
  shader:       '#c9a227',
  datapack:     '#9c6aab',
}

const EMPTY_MSG: Record<TabFilter, string> = {
  all:          'NO CONTENT INSTALLED',
  mod:          'NO MODS INSTALLED',
  resourcepack: 'NO RESOURCE PACKS',
  shader:       'NO SHADERS',
  datapack:     'NO DATAPACKS',
}

interface Props {
  instance: Instance | null
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function InstanceModsDialog({ instance, open, onOpenChange }: Props) {
  const [items, setItems]     = useState<ContentEntry[]>([])
  const [tab, setTab]         = useState<TabFilter>('all')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy]       = useState<Set<string>>(new Set())
  const [error, setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!instance) return
    setLoading(true)
    setError(null)
    try {
      const list = await api.mods.list(instance.id)
      setItems(list as ContentEntry[])
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [instance])

  useEffect(() => {
    if (open) { setItems([]); setTab('all'); load() }
  }, [open, load])

  if (!open || !instance) return null

  const visible = tab === 'all' ? items : items.filter(it => it.type === tab)

  const counts: Record<TabFilter, number> = {
    all:          items.length,
    mod:          items.filter(i => i.type === 'mod').length,
    resourcepack: items.filter(i => i.type === 'resourcepack').length,
    shader:       items.filter(i => i.type === 'shader').length,
    datapack:     items.filter(i => i.type === 'datapack').length,
  }

  async function handleToggle(entry: ContentEntry) {
    if (!instance) return
    setBusy(prev => new Set([...prev, entry.filename]))
    try {
      await api.mods.toggle(instance.id, entry.filename, entry.type)
      await load()
    } catch { /* ignore */ } finally {
      setBusy(prev => { const n = new Set(prev); n.delete(entry.filename); return n })
    }
  }

  async function handleDelete(entry: ContentEntry) {
    if (!instance) return
    setBusy(prev => new Set([...prev, entry.filename]))
    try {
      await api.mods.delete(instance.id, entry.filename, entry.type)
      setItems(prev => prev.filter(m => m.filename !== entry.filename))
    } catch { /* ignore */ } finally {
      setBusy(prev => { const n = new Set(prev); n.delete(entry.filename); return n })
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 150,
        background: 'rgba(0,0,0,.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={() => onOpenChange(false)}
    >
      <div
        style={{
          width: 580, maxHeight: '80vh',
          background: 'var(--surface)',
          border: '1px solid var(--border-r)',
          borderRadius: 'var(--radius)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-r)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: "'VT323',monospace", fontSize: 17, color: 'var(--ink)', letterSpacing: '.08em' }}>
              CONTENT — {instance.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>
              MC {instance.minecraftVersion} · {instance.modLoader?.toUpperCase() ?? 'VANILLA'} · {items.length} item{items.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={load}
              style={{
                fontSize: 11, color: 'var(--ink-3)',
                background: 'var(--surface-2)', border: '1px solid var(--border-r)',
                borderRadius: 3, padding: '3px 10px', cursor: 'pointer',
              }}
            >
              Refresh
            </button>
            <button
              onClick={() => onOpenChange(false)}
              style={{ background: 'none', border: 'none', color: 'var(--ink-4)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 2, padding: '8px 12px',
          borderBottom: '1px solid var(--border-r)',
          flexShrink: 0,
          background: 'var(--surface-2)',
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '4px 10px', borderRadius: 3,
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                border: tab === t.id ? '1px solid var(--accent)' : '1px solid transparent',
                background: tab === t.id ? 'var(--accent-tint)' : 'transparent',
                color: tab === t.id ? 'var(--ink)' : 'var(--ink-4)',
                display: 'flex', gap: 5, alignItems: 'center',
              }}
            >
              {t.label}
              {counts[t.id] > 0 && (
                <span style={{
                  fontSize: 10, lineHeight: 1,
                  background: tab === t.id ? 'var(--accent)' : 'var(--surface-3)',
                  color: tab === t.id ? '#fff' : 'var(--ink-4)',
                  borderRadius: 8, padding: '1px 5px',
                }}>
                  {counts[t.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {loading ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>
              Loading…
            </div>
          ) : error ? (
            <div style={{ padding: '20px 16px', color: 'var(--lava)', fontSize: 12 }}>{error}</div>
          ) : visible.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'VT323',monospace", fontSize: 16, color: 'var(--ink-4)', letterSpacing: '.08em', marginBottom: 6 }}>
                {EMPTY_MSG[tab]}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>
                Install content from the Content Browser.
              </div>
            </div>
          ) : visible.map(entry => (
            <ContentRow
              key={entry.filename}
              entry={entry}
              isBusy={busy.has(entry.filename)}
              onToggle={() => handleToggle(entry)}
              onDelete={() => handleDelete(entry)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ContentRow({ entry, isBusy, onToggle, onDelete }: {
  entry: ContentEntry
  isBusy: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const color = TYPE_COLOR[entry.type]
  const isFolder = !entry.filename.includes('.')

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '7px 14px',
      borderBottom: '1px solid var(--line)',
      opacity: isBusy ? 0.5 : 1,
      transition: 'opacity 150ms',
    }}>
      {/* Icon */}
      <div style={{
        width: 34, height: 34, flexShrink: 0, borderRadius: 4, overflow: 'hidden',
        background: entry.enabled ? 'color-mix(in srgb, ' + color + ' 18%, var(--surface-2))' : 'var(--surface-2)',
        border: `1px solid ${entry.enabled ? color : 'var(--border-r)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        imageRendering: 'pixelated',
      }}>
        {entry.iconDataUrl ? (
          <img
            src={entry.iconDataUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }}
          />
        ) : (
          <TypeIcon type={entry.type} color={entry.enabled ? color : 'var(--ink-4)'} />
        )}
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 500,
          color: entry.enabled ? 'var(--ink)' : 'var(--ink-4)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {entry.displayName}
        </div>
        <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 1, display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ color, fontWeight: 600, textTransform: 'uppercase', fontSize: 9, letterSpacing: '.04em' }}>
            {entry.type === 'resourcepack' ? 'Resource Pack' : entry.type === 'datapack' ? 'Datapack' : entry.type === 'shader' ? 'Shader' : 'Mod'}
          </span>
          {entry.sizeKb > 0 && (
            <span>{entry.sizeKb >= 1024 ? `${(entry.sizeKb / 1024).toFixed(1)} MB` : `${entry.sizeKb} KB`}</span>
          )}
          {!entry.enabled && <span style={{ color: 'var(--gold)' }}>disabled</span>}
        </div>
      </div>

      {/* Toggle (only for non-folder file entries) */}
      {!isFolder ? (
        <button
          onClick={onToggle}
          disabled={isBusy}
          title={entry.enabled ? 'Disable' : 'Enable'}
          style={{
            width: 36, height: 20, flexShrink: 0,
            background: entry.enabled ? color : 'var(--surface-3)',
            border: `1px solid ${entry.enabled ? color : 'var(--border-r)'}`,
            borderRadius: 10,
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 150ms',
          }}
        >
          <div style={{
            position: 'absolute',
            top: 2, left: entry.enabled ? 18 : 2,
            width: 14, height: 14,
            background: '#fff',
            borderRadius: '50%',
            transition: 'left 150ms',
            boxShadow: '0 1px 3px rgba(0,0,0,.3)',
          }} />
        </button>
      ) : (
        <div style={{ width: 36, flexShrink: 0 }} />
      )}

      {/* Delete */}
      {confirmDelete ? (
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => { setConfirmDelete(false); onDelete() }}
            disabled={isBusy}
            style={{
              fontSize: 11, color: '#fff',
              background: 'var(--lava)', border: 'none',
              borderRadius: 3, padding: '2px 8px', cursor: 'pointer',
            }}
          >
            Delete
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            style={{
              fontSize: 11, color: 'var(--ink-3)',
              background: 'var(--surface-2)', border: '1px solid var(--border-r)',
              borderRadius: 3, padding: '2px 8px', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          disabled={isBusy}
          title="Delete"
          style={{
            width: 24, height: 24, flexShrink: 0,
            background: 'none', border: '1px solid transparent',
            borderRadius: 3, cursor: 'pointer',
            color: 'var(--ink-4)',
            fontSize: 14, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={e => {
            const btn = (e.target as HTMLElement).closest('button')!
            btn.style.borderColor = 'var(--lava)'
            btn.style.color = 'var(--lava)'
          }}
          onMouseLeave={e => {
            const btn = (e.target as HTMLElement).closest('button')!
            btn.style.borderColor = 'transparent'
            btn.style.color = 'var(--ink-4)'
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}

function TypeIcon({ type, color }: { type: ContentType; color: string }) {
  if (type === 'mod') {
    return <div style={{ width: 14, height: 14, background: color, borderRadius: 2 }} />
  }
  if (type === 'resourcepack') {
    // Simple image/texture icon
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="1" stroke={color} strokeWidth="1.5" fill="none" />
        <circle cx="5.5" cy="5.5" r="1.5" fill={color} />
        <path d="M2 11 L5 8 L8 10 L11 7 L14 11" stroke={color} strokeWidth="1.5" fill="none" />
      </svg>
    )
  }
  if (type === 'shader') {
    // Sun/light icon
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="3" fill={color} />
        <line x1="8" y1="1" x2="8" y2="3" stroke={color} strokeWidth="1.5" />
        <line x1="8" y1="13" x2="8" y2="15" stroke={color} strokeWidth="1.5" />
        <line x1="1" y1="8" x2="3" y2="8" stroke={color} strokeWidth="1.5" />
        <line x1="13" y1="8" x2="15" y2="8" stroke={color} strokeWidth="1.5" />
        <line x1="3.05" y1="3.05" x2="4.46" y2="4.46" stroke={color} strokeWidth="1.5" />
        <line x1="11.54" y1="11.54" x2="12.95" y2="12.95" stroke={color} strokeWidth="1.5" />
        <line x1="12.95" y1="3.05" x2="11.54" y2="4.46" stroke={color} strokeWidth="1.5" />
        <line x1="4.46" y1="11.54" x2="3.05" y2="12.95" stroke={color} strokeWidth="1.5" />
      </svg>
    )
  }
  // datapack — book icon
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="2" width="10" height="12" rx="1" stroke={color} strokeWidth="1.5" fill="none" />
      <line x1="6" y1="5" x2="10" y2="5" stroke={color} strokeWidth="1.2" />
      <line x1="6" y1="8" x2="10" y2="8" stroke={color} strokeWidth="1.2" />
      <line x1="6" y1="11" x2="9" y2="11" stroke={color} strokeWidth="1.2" />
    </svg>
  )
}
