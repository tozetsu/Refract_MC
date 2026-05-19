import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/account/')({
  component: Account,
})

function Account() {
  return (
    <div style={{ padding:'60px 40px',background:'var(--surface)',border:'1px solid var(--border-r)',borderRadius:'var(--radius)',color:'var(--ink-3)',textAlign:'center' }}>
      <h2 style={{ fontWeight:700,fontSize:24,color:'var(--ink)',margin:'0 0 6px' }}>Account</h2>
      <p style={{ fontSize:13,maxWidth:420,margin:'0 auto' }}>Manage your Microsoft account, link Discord and Modrinth tokens, and review session devices.</p>
    </div>
  )
}
