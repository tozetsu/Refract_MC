import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/modpacks/')({
  component: Modpacks,
})

function Modpacks() {
  return (
    <div style={{ padding:'60px 40px',background:'var(--surface)',border:'1px solid var(--border-r)',borderRadius:'var(--radius)',color:'var(--ink-3)',textAlign:'center',margin:'0' }}>
      <h2 style={{ fontWeight:700,fontSize:24,color:'var(--ink)',margin:'0 0 6px' }}>Modpacks</h2>
      <p style={{ fontSize:13,maxWidth:420,margin:'0 auto' }}>Curated bundles ready to launch — full toolchain, world preloads, and resource packs in one click.</p>
    </div>
  )
}
