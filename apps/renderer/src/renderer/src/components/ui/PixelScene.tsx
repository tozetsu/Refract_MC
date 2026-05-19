import { memo } from 'react'
import type React from 'react'

const SCENES = {
  'deep-dark': {
    sky: '#0a1f23',
    palette: { B:'#06181b',d:'#0a2024',t:'#143b3e',T:'#1d4d50',g:'#39d4cf',G:'#5feae5',s:'#3a2e22',S:'#2a221a',m:'#5a4838',M:'#3d2f22' },
    grid: [
      '                                    ',
      '                                    ',
      '                  M  MMM            ',
      '         M MM    MMM MMMMM    M     ',
      '       MMMMMMM  MMMMMMMMMM   MMM    ',
      '    MMMMMMMMMMMMMMMMMMMMMMM MMMMM   ',
      '                                    ',
      '         g                          ',
      '                  g                 ',
      '                                    ',
      'ttTttTtTtTtTtTtTtTtTtTtTtTtTtTtTtTtT',
      'dttdttgttdttdttdttdttgttdttdttdttdtt',
      'BdBdBdBdBdBdBdBdBdBdBdBdBdBdBdBdBdBd',
      'ddBddBddgddBddBddBddBddBddBdgBddBddB',
      'BdBdBdBdBdBdBdBdBdBdBdBdBdBdBdBdBdBd',
      'ddBddBddBddBddBddgBddBddBddBddBddBdd',
      'BdBdBdBdBdBdBdBdBdBdBdBdBdBdBdBdBdBd',
      'ddBddgddBddBddBddBddBddBddBddBddgddB',
    ],
  },
  'forest': {
    sky: '#7ab9e8',
    palette: { c:'#ffffff',C:'#dde7f0',s:'#ffd66b',S:'#ffaa2b',l:'#5b9c3a',L:'#3f7128',x:'#2a4f1a',w:'#5e3e1d',W:'#3d2811',g:'#5b9c3a',G:'#7cc24f',d:'#8b5a2b',D:'#6b4226',B:'#3d2811' },
    grid: [
      '                                    ',
      '  ccc                          SSS  ',
      ' ccccc      ccc                SsS  ',
      '  ccc       ccccc              SSS  ',
      '                                    ',
      '        lL                          ',
      '       lllL          lLL            ',
      '      llllLL        llllL    lLL    ',
      '      llllLL       llllllL  llllL   ',
      '       ww          lllllllL llllL   ',
      '       ww            wwww    wwww   ',
      '       ww            wwww    wwww   ',
      'GgGgGgGgGgGgGgGgGgGgGgGgGgGgGgGgGgGg',
      'ddDddDddDddDddDddDddDddDddDddDddDddD',
      'DdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDd',
      'ddDddDddDddDddDddDddDddDddDddDddDddD',
      'DdDdDBdDdDdDdDdDdDdDdDBdDdDdDdDdDdDd',
      'ddDddDddDddDddBddDddDddDddDddDddDddD',
    ],
  },
  'twilight': {
    sky: '#2b1c44',
    palette: { m:'#f0e3ff',M:'#cbb4e8',p:'#3a2854',P:'#251636',x:'#170a26',f:'#5b4a78',F:'#3d3055',g:'#1a0e22',G:'#2a1d3a',d:'#0a0518',D:'#160a2a' },
    grid: [
      '                                    ',
      '                          mm        ',
      '                          mM        ',
      '                                    ',
      '                                    ',
      '          P                         ',
      '         PPP        x              x',
      '        PPpPP      xxx     P      xx',
      '       PPpppPP    xxpxx   PpP    xxx',
      '      PPpppppPP  xxpppxx PpppP  xxxx',
      '    fFPPpppppPPFfxxpppxxFppppPfxxxxx',
      'ffFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFf',
      'GgGgGgGgGgGgGgGgGgGgGgGgGgGgGgGgGgGg',
      'dDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdD',
      'DdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDd',
      'dDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdD',
      'DdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDd',
      'dDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdD',
    ],
  },
} as const

export type SceneName = keyof typeof SCENES

function PixelSun({ yellow }: { yellow?: boolean }) {
  const cells = ['  X  ',' XYX ','XYZYX',' XYX ','  X  ']
  const map: Record<string,string> = { X:'#ffd16a', Y: yellow?'#ffaa2b':'#ff8c2a', Z: yellow?'#e07a1b':'#c8520f' }
  return (
    <div style={{ position:'absolute',top:'10%',right:'6%',width:'14%',aspectRatio:'1',display:'grid',gridTemplateColumns:'repeat(5,1fr)',gridTemplateRows:'repeat(5,1fr)' }}>
      {cells.flatMap((row,r)=>[...row].map((ch,c)=> ch===' ' ? null :
        <div key={`${r}-${c}`} style={{ background:map[ch],gridColumn:c+1,gridRow:r+1 }} />
      ))}
    </div>
  )
}

function PixelMoon() {
  const cells = [' XXX ','XXYYX','XYYYX','XYYXX',' XXX ']
  return (
    <div style={{ position:'absolute',top:'8%',right:'8%',width:'12%',aspectRatio:'1',display:'grid',gridTemplateColumns:'repeat(5,1fr)',gridTemplateRows:'repeat(5,1fr)' }}>
      {cells.flatMap((row,r)=>[...row].map((ch,c)=> ch===' ' ? null :
        <div key={`${r}-${c}`} style={{ background:ch==='X'?'#f0e3ff':'#cbb4e8',gridColumn:c+1,gridRow:r+1 }} />
      ))}
    </div>
  )
}

export function loaderToScene(loader?: string | null): SceneName {
  if (!loader) return 'deep-dark'
  if (loader === 'fabric' || loader === 'quilt') return 'forest'
  return 'twilight'
}

interface Props { name: SceneName; style?: React.CSSProperties }

export const PixelScene = memo(function PixelScene({ name, style }: Props) {
  const scene = SCENES[name]
  if (!scene) return null
  const rows = scene.grid.length
  const cols = scene.grid[0].length
  return (
    <div style={{ position:'relative', overflow:'hidden', ...style }}>
      <div style={{ position:'absolute',inset:0,background:scene.sky,display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gridTemplateRows:`repeat(${rows},1fr)`,imageRendering:'pixelated' }}>
        {scene.grid.flatMap((row,r)=>[...row].map((ch,c)=>{
          if (ch===' ') return null
          const color = (scene.palette as Record<string,string>)[ch]
          if (!color) return null
          return <div key={`${r}-${c}`} style={{ background:color,gridColumn:c+1,gridRow:r+1 }} />
        }))}
        {name!=='twilight' && <PixelSun yellow={name==='forest'} />}
        {name==='twilight' && <PixelMoon />}
      </div>
    </div>
  )
})
