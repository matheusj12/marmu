import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping } from 'three'
import type { CountertopConfig, StoneMaterial } from '../../types'
import { generateStoneTexture } from '../../utils/textureGenerator'

interface Props {
  config: CountertopConfig
  material: StoneMaterial
}

export default function FloorModel({ config, material }: Props) {
  const texture = useMemo(() => {
    const canvas = generateStoneTexture(material)
    const tex = new CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = RepeatWrapping
    tex.repeat.set(1, 1)
    tex.needsUpdate = true
    return tex
  }, [material])

  const W = config.width / 100
  const D = config.depth / 100
  const tileThick = 0.02
  const joint = 0.007

  /* Número de ladrilhos adaptado ao espaço, máx 5×4 */
  const cols = Math.min(Math.max(Math.round(W / 0.45), 2), 5)
  const rows = Math.min(Math.max(Math.round(D / 0.45), 2), 4)
  const tileW = (W - (cols + 1) * joint) / cols
  const tileD = (D - (rows + 1) * joint) / rows

  const stone = { map: texture, roughness: material.roughness, metalness: material.metalness }

  return (
    <group position={[0, tileThick / 2, 0]}>
      {/* Base de rejunte */}
      <mesh receiveShadow>
        <boxGeometry args={[W, tileThick * 0.6, D]} />
        <meshStandardMaterial color="#6b6b6b" roughness={0.95} />
      </mesh>

      {Array.from({ length: cols }).map((_, ci) =>
        Array.from({ length: rows }).map((_, ri) => {
          const px = -W / 2 + joint + tileW / 2 + ci * (tileW + joint)
          const pz = -D / 2 + joint + tileD / 2 + ri * (tileD + joint)
          return (
            <mesh key={`${ci}-${ri}`} position={[px, tileThick * 0.2, pz]} castShadow receiveShadow>
              <boxGeometry args={[tileW, tileThick, tileD]} />
              <meshStandardMaterial {...stone} />
            </mesh>
          )
        })
      )}
    </group>
  )
}
