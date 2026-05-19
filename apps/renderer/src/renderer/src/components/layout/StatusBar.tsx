import { useState, useEffect } from 'react'

export function StatusBar() {
  const [fps, setFps] = useState(60)
  const [ping, setPing] = useState(18)

  useEffect(() => {
    const id = setInterval(() => {
      setFps(58 + Math.floor(Math.random() * 5))
      setPing(14 + Math.floor(Math.random() * 12))
    }, 1400)
    return () => clearInterval(id)
  }, [])

  const mem = typeof performance !== 'undefined' && (performance as any).memory
    ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
    : 128

  return (
    <footer style={{
      height: 'var(--statusbar-height)',
      background: 'var(--sb)',
      borderTop: '1px solid var(--sb-line)',
      display: 'flex', alignItems: 'center',
      padding: '0 14px',
      gap: 18,
      fontFamily: "'VT323',monospace",
      fontSize: 15,
      color: 'var(--ink-4)',
      letterSpacing: '.04em',
      userSelect: 'none',
      flexShrink: 0,
    }}>
      <Dot color="var(--grass)" />
      <span style={{ color: 'var(--ink-3)' }}>{fps} FPS</span>

      <Dot color="var(--grass)" />
      <span style={{ color: 'var(--ink-3)' }}>{ping} MS</span>

      <Dot color="#e8c84a" />
      <span style={{ color: 'var(--ink-3)' }}>{mem} MB</span>

      <span style={{ color: 'var(--ink-4)' }}>JAVA 21</span>

      <div style={{ flex: 1 }} />

      <span style={{ color: 'var(--ink-4)', fontSize: 13 }}>Refract v0.3.1-beta</span>
    </footer>
  )
}

function Dot({ color }: { color: string }) {
  return (
    <div style={{ width: 6, height: 6, background: color, flexShrink: 0 }} />
  )
}
