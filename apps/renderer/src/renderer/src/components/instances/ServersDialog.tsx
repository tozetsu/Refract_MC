import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { Instance } from '@refract/core'
import { Button } from '@/components/ui/Button'
import { RowsSkeleton } from '@/components/ui/Skeleton'

type Server = { name: string; ip: string; icon?: string }

interface Props {
  instance: Instance | null
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function ServersDialog({ instance, open, onOpenChange }: Props) {
  const [servers, setServers]   = useState<Server[]>([])
  const [loading, setLoading]   = useState(false)
  const [copied, setCopied]     = useState<string | null>(null)

  useEffect(() => {
    if (!open || !instance) return
    setServers([])
    setLoading(true)
    api.mc.servers(instance.id)
      .then(setServers)
      .catch(() => setServers([]))
      .finally(() => setLoading(false))
  }, [open, instance])

  if (!open || !instance) return null

  function copyIp(ip: string) {
    navigator.clipboard.writeText(ip).catch(() => {})
    setCopied(ip)
    setTimeout(() => setCopied(null), 1600)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={() => onOpenChange(false)}
    >
      <div
        style={{ width: 500, maxHeight: '70vh', background: 'var(--surface)', border: '1px solid var(--border-r)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-r)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', letterSpacing: '.04em' }}>SERVERS — {instance.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>Saved in servers.dat · click to copy address</div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} style={{ color: 'var(--ink-4)', fontSize: 18, lineHeight: 1 }}>✕</Button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <RowsSkeleton rows={4} />
          ) : servers.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-4)', letterSpacing: '.10em', marginBottom: 8 }}>NO SAVED SERVERS</div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)', lineHeight: 1.5 }}>
                Servers you add inside Minecraft appear here.<br />
                Launch the instance and add servers in the multiplayer menu.
              </div>
            </div>
          ) : servers.map((s, i) => (
            <ServerRow key={i} server={s} copied={copied === s.ip} onCopy={() => copyIp(s.ip)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ServerRow({ server, copied, onCopy }: { server: Server; copied: boolean; onCopy: () => void }) {
  const [hover, setHover] = useState(false)

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--line)', cursor: 'pointer', background: hover ? 'var(--surface-2)' : 'transparent', transition: 'background 120ms' }}
      onClick={onCopy}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Server icon */}
      <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--surface-3)', border: '1px solid var(--border-r)', imageRendering: 'pixelated' }}>
        {server.icon ? (
          <img
            src={server.icon.startsWith('data:') ? server.icon : `data:image/png;base64,${server.icon}`}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🌐</div>
        )}
      </div>

      {/* Name + IP */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{server.name}</div>
        <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>{server.ip}</div>
      </div>

      {/* Copy button */}
      <div style={{
        fontSize: 11, fontWeight: 700, padding: '3px 10px',
        background: copied ? 'var(--grass)' : hover ? 'var(--surface-3)' : 'transparent',
        color: copied ? '#fff' : 'var(--ink-3)',
        border: `1px solid ${copied ? 'var(--grass)' : hover ? 'var(--border-r)' : 'transparent'}`,
        borderRadius: 'var(--radius-sm)', flexShrink: 0, transition: 'all 120ms',
      }}>
        {copied ? 'Copied!' : 'Copy IP'}
      </div>
    </div>
  )
}
