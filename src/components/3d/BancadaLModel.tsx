import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping } from 'three'
import type { CountertopConfig, StoneMaterial } from '../../types'
import { generateStoneTexture } from '../../utils/textureGenerator'

interface Props {
  config: CountertopConfig
  material: StoneMaterial
}

export default function BancadaLModel({ config, material }: Props) {
  const texture = useMemo(() => {
    const canvas = generateStoneTexture(material)
    const tex = new CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = RepeatWrapping
    tex.repeat.set(1.5, 1.5)
    tex.needsUpdate = true
    return tex
  }, [material])

  const W  = config.width / 100
  const D  = config.depth / 100
  const T  = config.thickness / 100
  const sh = config.saiaHeight / 100
  const fh = config.frontaoHeight / 100
  const SL = W * 0.65  // comprimento do braço lateral

  const stone = { map: texture, roughness: material.roughness, metalness: material.metalness }

  return (
    <group position={[0, T / 2, 0]}>
      {/* Braço principal — eixo X */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[W, T, D]} />
        <meshStandardMaterial {...stone} />
      </mesh>

      {/* Braço perpendicular — eixo -Z, partindo da extremidade esquerda */}
      <mesh castShadow receiveShadow position={[-W / 2 + D / 2, 0, -D / 2 - SL / 2]}>
        <boxGeometry args={[D, T, SL]} />
        <meshStandardMaterial {...stone} />
      </mesh>

      {/* Frontão traseiro — braço principal */}
      {fh > 0 && (
        <mesh castShadow receiveShadow position={[0, fh / 2 + T / 2, -D / 2 + T / 2]}>
          <boxGeometry args={[W, fh, T]} />
          <meshStandardMaterial {...stone} />
        </mesh>
      )}

      {/* Frontão lateral — braço perpendicular */}
      {fh > 0 && (
        <mesh castShadow receiveShadow position={[-W / 2 + T / 2, fh / 2 + T / 2, -D / 2 - SL / 2]}>
          <boxGeometry args={[T, fh, SL]} />
          <meshStandardMaterial {...stone} />
        </mesh>
      )}

      {/* Saia frontal — braço principal */}
      {sh > 0 && (
        <mesh castShadow receiveShadow position={[0, -sh / 2 + T / 2, D / 2 - T / 2]}>
          <boxGeometry args={[W, sh, T]} />
          <meshStandardMaterial {...stone} />
        </mesh>
      )}

      {/* Saia lateral direita — braço perpendicular */}
      {sh > 0 && (
        <mesh castShadow receiveShadow position={[-W / 2 + D - T / 2, -sh / 2 + T / 2, -D / 2 - SL / 2]}>
          <boxGeometry args={[T, sh, SL]} />
          <meshStandardMaterial {...stone} />
        </mesh>
      )}

      {/* Saia fundo — braço perpendicular */}
      {sh > 0 && (
        <mesh castShadow receiveShadow position={[-W / 2 + D / 2, -sh / 2 + T / 2, -D / 2 - SL + T / 2]}>
          <boxGeometry args={[D, sh, T]} />
          <meshStandardMaterial {...stone} />
        </mesh>
      )}
    </group>
  )
}
