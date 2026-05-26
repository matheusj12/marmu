import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping } from 'three'
import type { CountertopConfig, ProjectType, StoneMaterial } from '../../types'
import { generateStoneTexture } from '../../utils/textureGenerator'

interface Props {
  type: ProjectType
  config: CountertopConfig
  material: StoneMaterial
}

function getDims(type: ProjectType, config: CountertopConfig) {
  const w = config.width / 100
  const d = config.depth / 100
  const t = config.thickness / 100
  switch (type) {
    case 'rodape':         return { w, h: t * 4, thick: 0.025, vertical: true }
    case 'friso':          return { w, h: t * 2, thick: 0.02,  vertical: true }
    case 'guarda':         return { w: 0.12, h: 0.9, thick: t,  vertical: true }
    case 'espelho_escada': return { w, h: 0.19, thick: 0.025, vertical: true }
    case 'soleira':        return { w, h: d,   thick: t,    vertical: false }
    case 'peitoril':       return { w, h: d,   thick: t,    vertical: false }
    case 'soleira_portao': return { w, h: d,   thick: t,    vertical: false }
    case 'chanfro_borda':  return { w, h: d,   thick: t,    vertical: false }
    case 'furo_recorte':   return { w, h: d,   thick: t,    vertical: false }
    default:               return { w, h: d,   thick: t,    vertical: false }
  }
}

export default function SlabModel({ type, config, material }: Props) {
  const texture = useMemo(() => {
    const canvas = generateStoneTexture(material)
    const tex = new CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = RepeatWrapping
    tex.repeat.set(1.5, 1.5)
    tex.needsUpdate = true
    return tex
  }, [material])

  const { w, h, thick, vertical } = getDims(type, config)
  const stone = { map: texture, roughness: material.roughness, metalness: material.metalness }

  if (vertical) {
    /* Peça vertical: rodapé, friso, guarda, espelho */
    return (
      <group position={[0, h / 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[w, h, thick]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Chanfro superior decorativo */}
        <mesh position={[0, h / 2 + 0.005, 0]} rotation={[Math.PI / 8, 0, 0]}>
          <boxGeometry args={[w, 0.01, thick * 1.2]} />
          <meshStandardMaterial {...stone} roughness={0.15} />
        </mesh>
      </group>
    )
  }

  /* Peça horizontal: soleira, peitoril, etc. */
  if (type === 'furo_recorte') {
    /* Mostra a placa com um furo de torneira */
    return (
      <group position={[0, thick / 2, 0]}>
        <mesh castShadow receiveShadow position={[-(w * 0.25), 0, 0]}>
          <boxGeometry args={[w / 2 - 0.04, thick, h]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        <mesh castShadow receiveShadow position={[w * 0.25, 0, 0]}>
          <boxGeometry args={[w / 2 - 0.04, thick, h]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Furo visual */}
        <mesh position={[0, thick / 2 + 0.001, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, thick + 0.005, 32]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      </group>
    )
  }

  if (type === 'chanfro_borda') {
    return (
      <group position={[0, thick / 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[w, thick, h]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Chanfro na aresta frontal */}
        <mesh position={[0, thick / 2, h / 2 - 0.012]} rotation={[-Math.PI / 5, 0, 0]}>
          <boxGeometry args={[w, 0.018, 0.022]} />
          <meshStandardMaterial {...stone} roughness={0.1} metalness={0.05} />
        </mesh>
      </group>
    )
  }

  return (
    <group position={[0, thick / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, thick, h]} />
        <meshStandardMaterial {...stone} />
      </mesh>
    </group>
  )
}
