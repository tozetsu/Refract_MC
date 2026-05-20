import { Link, useMatchRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState, type ComponentType } from 'react'
import { LibraryIcon, ModsIcon, ModpacksIcon, AccountIcon, CogIcon, SignOutIcon } from '../ui/BlockIcons'
import { useAvatarStore } from '@/stores/avatar'
import { compressImage } from '@/lib/image'
import { api, type SafeAccount } from '@/lib/api'

const NAV: Array<{ to: string; label: string; Icon: ComponentType; exact: boolean }> = [
  { to: '/',          label: 'Instance Library', Icon: LibraryIcon,  exact: true  },
  { to: '/browse/',   label: 'Browse Mods',      Icon: ModsIcon,     exact: false },
  { to: '/modpacks/', label: 'Modpacks',          Icon: ModpacksIcon, exact: false },
  { to: '/account/',  label: 'Account',           Icon: AccountIcon,  exact: false },
]

const FRIENDS = [
  { name: 'alex_woodland', activity: 'Playing 1.20.2', online: true,  color: '#d4a26a' },
  { name: 'milly.craft',   activity: 'Idle on Hub',    online: true,  color: '#f0c0d4' },
  { name: 'joren',         activity: 'Last seen 2h',   online: false, color: '#a08fd8' },
]

function NavItem({ to, label, Icon, exact }: typeof NAV[number]) {
  const matchRoute = useMatchRoute()
  const active = !!matchRoute({ to: to as '/', fuzzy: !exact })

  return (
    <Link
      to={to as '/'}
      style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 4,
        color: active ? 'var(--ink)' : 'var(--ink-2)',
        fontSize: 13, fontWeight: 500, textDecoration: 'none',
        background: active ? 'var(--accent-tint)' : 'transparent',
        border: `1px solid ${active ? 'var(--accent)' : 'transparent'}`,
        userSelect: 'none',
      }}
    >
      {active && <div style={{ position:'absolute', left:-13, top:6, bottom:6, width:3, background:'var(--accent)' }} />}
      <div style={{ width:18, height:18, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon />
      </div>
      <span>{label}</span>
    </Link>
  )
}

function AvatarBlock() {
  const [account, setAccount] = useState<SafeAccount | null>(null)
  const [hover, setHover] = useState(false)
  const avatars = useAvatarStore((s) => s.avatars)
  const setAvatar = useAvatarStore((s) => s.setAvatar)
  const removeAvatar = useAvatarStore((s) => s.removeAvatar)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.auth.active().then(setAccount).catch(() => setAccount(null))
    const id = window.setInterval(() => {
      api.auth.active().then(setAccount).catch(() => setAccount(null))
    }, 5000)
    return () => window.clearInterval(id)
  }, [])

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !account) return
    try {
      const dataUrl = await compressImage(file, 200)
      setAvatar(account.uuid, dataUrl)
    } catch { /* ignore */ }
    e.target.value = ''
  }

  async function signOut() {
    if (!account) return
    try {
      await api.auth.logout(account.uuid)
      removeAvatar(account.uuid)
      setAccount(null)
    } catch { /* ignore */ }
  }

  const avatar = account ? avatars[account.uuid] : undefined
  const initial = account?.username[0]?.toUpperCase() ?? '?'

  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'4px 6px 14px', borderBottom:'1px solid var(--sb-line)', marginBottom:10 }}>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImagePick} />

      {/* Avatar */}
      <div
        onClick={() => account && fileInputRef.current?.click()}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width:38, height:38, flexShrink:0,
          border:`1px solid ${hover && account ? 'var(--accent)' : '#000'}`,
          position:'relative', overflow:'hidden',
          background:'#1a1f2e', cursor: account ? 'pointer' : 'default',
          transition:'border-color .14s',
        }}
      >
        {avatar ? (
          <img src={avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        ) : (
          <div style={{
            width:'100%', height:'100%',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:"'VT323',monospace", fontSize:20, color:'var(--ink-3)',
          }}>
            {initial}
          </div>
        )}
        {hover && account && (
          <div style={{
            position:'absolute', inset:0, background:'rgba(0,0,0,.55)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:"'VT323',monospace", fontSize:11, letterSpacing:'.06em', color:'#fff',
          }}>
            ✎
          </div>
        )}
      </div>

      {/* Name + status */}
      <div style={{ minWidth:0, flex:1 }}>
        <div style={{ fontFamily:"'VT323',monospace", fontSize:18, letterSpacing:'.10em', color:'var(--ink)', lineHeight:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {account ? account.username.toUpperCase() : 'GUEST'}
        </div>
        <div style={{ fontFamily:"'VT323',monospace", fontSize:12, color: account?.canPlayMinecraft ? 'var(--grass)' : 'var(--gold)', letterSpacing:'.04em', lineHeight:1.4 }}>
          {account ? (account.canPlayMinecraft ? 'PLAY ENABLED' : 'CONTENT ONLY') : 'NOT SIGNED IN'}
        </div>
      </div>

      {/* Sign out icon */}
      {account && (
        <button
          onClick={signOut}
          title="Sign out"
          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-4)', padding:4, display:'flex', opacity:.7 }}
        >
          <SignOutIcon />
        </button>
      )}
    </div>
  )
}

export function Sidebar() {
  return (
    <aside style={{
      gridRow:'2/3', gridColumn:'1/2',
      background:'var(--sb)', borderRight:'1px solid var(--line)',
      display:'flex', flexDirection:'column',
      padding:'14px 12px 12px', minHeight:0, overflowY:'auto',
    }}>
      <AvatarBlock />

      {/* Nav */}
      <div style={{ fontSize:10, fontWeight:600, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--ink-4)', padding:'10px 8px 6px' }}>Navigate</div>
      <nav style={{ display:'flex', flexDirection:'column', gap:2 }}>
        {NAV.map(n => <NavItem key={n.to} {...n} />)}
      </nav>

      {/* Friends */}
      <div style={{ margin:'8px 0 0', padding:'10px 4px 4px', borderTop:'1px solid var(--sb-line)' }}>
        <h5 style={{ margin:'0 0 8px 6px', fontSize:10, fontWeight:600, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--ink-4)' }}>
          Friends · 2 online
        </h5>
        {FRIENDS.map((f, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'5px 6px', borderRadius:4 }}>
            <div style={{ width:20, height:20, background:f.color, border:'1px solid #000', position:'relative', flexShrink:0, imageRendering:'pixelated' }}>
              <div style={{ position:'absolute', right:-3, bottom:-3, width:7, height:7, background:f.online?'var(--grass)':'var(--ink-4)', border:'1px solid #000' }} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', lineHeight:1.1, minWidth:0, flex:1 }}>
              <span style={{ fontWeight:500, color:'var(--ink)', fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.name}</span>
              <span style={{ fontSize:10.5, color:'var(--ink-4)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.activity}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:2, paddingTop:10, borderTop:'1px solid var(--sb-line)' }}>
        <Link to="/settings" style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:4, color:'var(--ink-2)', fontSize:13, fontWeight:500, textDecoration:'none', border:'1px solid transparent' }}>
          <div style={{ width:18, height:18, display:'flex', alignItems:'center', justifyContent:'center' }}><CogIcon /></div>
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  )
}
