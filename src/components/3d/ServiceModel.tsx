import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping } from 'three'
import type { CountertopConfig, ProjectType, StoneMaterial } from '../../types'
import { generateStoneTexture } from '../../utils/textureGenerator'

interface Props {
  type: ProjectType
  config: CountertopConfig
  material: StoneMaterial
}

export default function ServiceModel({ type, config, material }: Props) {
  const texture = useMemo(() => {
    const canvas = generateStoneTexture(material)
    const tex = new CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = RepeatWrapping
    tex.repeat.set(1.5, 1.5)
    tex.needsUpdate = true
    return tex
  }, [material])

  const W = config.width / 100
  const D = config.depth / 100
  const T = config.thickness / 100

  /* Polimento / Cristalização: laje com acabamento espelhado */
  const isPolished = type === 'polimento' || type === 'cristalizacao'
  const stone = {
    map: texture,
    roughness: isPolished ? 0.02 : material.roughness,
    metalness: isPolished ? 0.12 : material.metalness,
  }

  /* Mosaico: grade de pequenos mosaicos */
  if (type === 'mosaico') {
    const tileSize = 0.055
    const gap = 0.006
    const cols = Math.min(Math.round(W / (tileSize + gap)), 20)
    const rows = Math.min(Math.round(D / (tileSize + gap)), 8)
    const realTileW = (W - (cols + 1) * gap) / cols
    const realTileD = (D - (rows + 1) * gap) / rows

    return (
      <group position={[0, T / 2, 0]}>
        {/* Base de rejunte */}
        <mesh receiveShadow>
          <boxGeometry args={[W, T, D]} />
          <meshStandardMaterial color="#4a4a50" roughness={0.95} />
        </mesh>
        {Array.from({ length: cols }).map((_, ci) =>
          Array.from({ length: rows }).map((_, ri) => {
            const px = -W / 2 + gap + realTileW / 2 + ci * (realTileW + gap)
            const pz = -D / 2 + gap + realTileD / 2 + ri * (realTileD + gap)
            return (
              <mesh key={`${ci}-${ri}`} position={[px, T * 0.15, pz]} castShadow receiveShadow>
                <boxGeometry args={[realTileW, T, realTileD]} />
                <meshStandardMaterial {...stone} />
              </mesh>
            )
          })
        )}
      </group>
    )
  }

  /* Impermeabilização: laje com cobertura translúcida sobre ela */
  if (type === 'impermeabilizacao') {
    return (
      <group position={[0, T / 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[W, T, D]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Camada protetora translúcida */}
        <mesh position={[0, T / 2 + 0.003, 0]}>
          <boxGeometry args={[W, 0.006, D]} />
          <meshStandardMaterial color="#aaddff" roughness={0.05} metalness={0.1} transparent opacity={0.35} />
        </mesh>
      </group>
    )
  }

  /* Gravação a jato: laje com design gravado */
  if (type === 'gravacao_jato') {
    return (
      <group position={[0, T / 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[W, T, D]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Linhas gravadas */}
        {[-D * 0.25, 0, D * 0.25].map((pz, i) => (
          <mesh key={i} position={[0, T / 2 + 0.001, pz]}>
            <boxGeometry args={[W * 0.55, 0.002, 0.006]} />
            <meshStandardMaterial color="#1a1a20" roughness={0.97} />
          </mesh>
        ))}
        {/* Monograma central */}
        <mesh position={[0, T / 2 + 0.001, 0]}>
          <boxGeometry args={[0.06, 0.002, 0.12]} />
          <meshStandardMaterial color="#1a1a20" roughness={0.97} />
        </mesh>
        <mesh position={[0, T / 2 + 0.001, 0]}>
          <boxGeometry args={[0.12, 0.002, 0.06]} />
          <meshStandardMaterial color="#1a1a20" roughness={0.97} />
        </mesh>
      </group>
    )
  }

  /* Polimento / Cristalização / Default: laje com alto brilho */
  return (
    <group position={[0, T / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[W, T, D]} />
        <meshStandardMaterial {...stone} />
      </mesh>
      {isPolished && (
        /* Reflexo especular brilhante */
        <mesh position={[0, T / 2 + 0.001, 0]}>
          <boxGeometry args={[W * 0.6, 0.001, D * 0.3]} />
          <meshStandardMaterial color="#ffffff" roughness={0.0} metalness={0.0} transparent opacity={0.18} />
        </mesh>
      )}
    </group>
  )
}
