import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { SearchIcon } from '@/components/ui/BlockIcons'

export const Route = createFileRoute('/browse/')({
  component: Browse,
})

const CATEGORIES = ['All', 'Performance', 'Utility', 'Magic', 'Technology', 'Adventure', 'Decoration']

const MODS = [
  { id: 1, name: 'Sodium',         author: 'jellysquid3',    desc: 'Modern rendering engine — huge FPS gains.',         downloads: '28.4M', category: 'Performance', loader: 'fabric' },
  { id: 2, name: 'Lithium',        author: 'jellysquid3',    desc: 'General-purpose optimisation for game logic.',      downloads: '14.1M', category: 'Performance', loader: 'fabric' },
  { id: 3, name: 'Iris Shaders',   author: 'coderbot',       desc: 'Shader pack support for Fabric.',                   downloads: '19.8M', category: 'Performance', loader: 'fabric' },
  { id: 4, name: 'Create',         author: 'simibubi',       desc: 'Automation and aesthetics with rotating contraptions.', downloads: '32.0M', category: 'Technology', loader: 'forge'  },
  { id: 5, name: 'Waystones',      author: 'BlayTheNinth',   desc: 'Teleport waypoints you can craft and place.',       downloads: '55.2M', category: 'Utility',    loader: 'forge'  },
  { id: 6, name: 'Botania',        author: 'Vazkii',         desc: 'Magic mod powered by flowers and mana.',            downloads: '41.7M', category: 'Magic',      loader: 'forge'  },
  { id: 7, name: 'Biomes O Plenty','author': 'Glitchfiend',  desc: '80+ new biomes with unique trees and plants.',      downloads: '71.3M', category: 'Adventure',  loader: 'forge'  },
  { id: 8, name: 'Chisel & Bits',  author: 'AlgorithmX2',    desc: 'Carve detailed shapes out of any solid block.',     downloads: '18.9M', category: 'Decoration', loader: 'forge'  },
  { id: 9, name: 'Mod Menu',       author: 'TerraformersMC', desc: 'Browse and configure installed mods in-game.',      downloads: '23.6M', category: 'Utility',    loader: 'fabric' },
]

const LOADER_COLOR: Record<string, string> = {
  fabric: '#b8a892',
  forge:  '#4b8fc4',
  quilt:  '#b070b0',
}

function Browse() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')

  const filtered = MODS.filter(m => {
    const matchCat = category === 'All' || m.category === category
    const q = query.toLowerCase()
    const matchQ = !q || m.name.toLowerCase().includes(q) || m.author.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q)
    return matchCat && matchQ
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: '0 0 3px' }}>Browse Mods</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>Discover and install mods from Modrinth</p>
      </div>

      {/* Search bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--surface)',
        border: '1px solid var(--border-r)',
        borderRadius: 'var(--radius)',
        padding: '0 12px',
        height: 38,
      }}>
        <div style={{ color: 'var(--ink-4)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <SearchIcon />
        </div>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search mods, authors…"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 13,
            color: 'var(--ink)',
          }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>✕</button>
        )}
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              fontSize: 11, fontWeight: 500,
              color: category === cat ? 'var(--ink)' : 'var(--ink-4)',
              background: category === cat ? 'var(--accent-tint)' : 'var(--surface)',
              border: `1px solid ${category === cat ? 'var(--accent)' : 'var(--border-r)'}`,
              borderRadius: 3,
              padding: '3px 10px',
              cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '.04em' }}>
        {filtered.length} mod{filtered.length !== 1 ? 's' : ''} found
      </div>

      {/* Mod grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
        {filtered.map(mod => (
          <ModTile key={mod.id} mod={mod} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>
          No mods match your search.
        </div>
      )}
    </div>
  )
}

function ModTile({ mod }: { mod: typeof MODS[number] }) {
  const loaderColor = LOADER_COLOR[mod.loader] ?? 'var(--ink-4)'

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border-r)',
      borderRadius: 'var(--radius)',
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      cursor: 'default',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Placeholder icon */}
        <div style={{
          width: 36, height: 36, flexShrink: 0,
          background: 'var(--surface-2)',
          border: '1px solid var(--border-r)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
        }}>
          {mod.name[0]}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {mod.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>by {mod.author}</div>
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0, lineHeight: 1.5 }}>{mod.desc}</p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <Tag color={loaderColor}>{mod.loader}</Tag>
          <Tag color="var(--ink-4)">{mod.category}</Tag>
        </div>
        <span style={{ fontFamily: "'VT323',monospace", fontSize: 13, color: 'var(--ink-4)', letterSpacing: '.04em' }}>
          ↓ {mod.downloads}
        </span>
      </div>

      <button style={{
        marginTop: 4,
        width: '100%', height: 30,
        fontFamily: "'VT323',monospace", fontSize: 16, letterSpacing: '.1em', color: '#fff',
        background: 'var(--accent)', border: 'none', cursor: 'pointer',
        boxShadow: 'inset 0 -3px 0 var(--accent-lo), inset 0 3px 0 var(--accent-hi)',
      }}>
        INSTALL
      </button>
    </div>
  )
}

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 500,
      color,
      border: `1px solid ${color}`,
      borderRadius: 2,
      padding: '1px 5px',
      opacity: 0.85,
    }}>
      {children}
    </span>
  )
}
