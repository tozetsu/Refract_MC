import type { ReactNode } from 'react'
import { useLocation } from '@tanstack/react-router'
import { TitleBar } from './TitleBar'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return (
    <div className="launcher-root" style={{
      height: '100dvh',
      display: 'grid',
      gridTemplateColumns: 'var(--sidebar-width) 1fr',
      gridTemplateRows: 'var(--titlebar-height) 1fr',
      overflow: 'hidden',
      transition: 'grid-template-columns 220ms cubic-bezier(.4,0,.2,1)',
      background: 'transparent',
      position: 'relative',
      zIndex: 1,
    }}>
      <TitleBar />
      <Sidebar />
      <div style={{ gridRow:'2/3', gridColumn:'2/3', display:'flex', flexDirection:'column', minHeight:0, minWidth:0, overflow:'hidden', background:'transparent', position:'relative' }}>
        <div
          key={pathname}
          className="app-scroll"
          // `backwards` (not `both`): the entrance animation must NOT persist a
          // transform — a lingering transform makes this the containing block for
          // position:fixed modals, so they'd center on the scroller (off-screen,
          // scrollable) instead of the viewport.
          style={{ flex:1, minHeight:0, overflowY:'auto', overflowX:'hidden', padding:'24px 28px 28px', position:'relative', zIndex:1, animation:'page-enter 160ms ease-out backwards' }}
        >
          {children}
        </div>
        <StatusBar />
      </div>
    </div>
  )
}
