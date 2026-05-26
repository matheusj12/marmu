import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping } from 'three'
import type { CountertopConfig, ProjectType, StoneMaterial } from '../../types'
import { generateStoneTexture } from '../../utils/textureGenerator'

interface Props {
  type: ProjectType
  config: CountertopConfig
  material: StoneMaterial
}

export default function WallPanelModel({ type, config, material }: Props) {
  const texture = useMemo(() => {
    const canvas = generateStoneTexture(material)
    const tex = new CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = RepeatWrapping
    tex.repeat.set(2, 2)
    tex.needsUpdate = true
    return tex
  }, [material])

  const W = config.width / 100
  const H = Math.max((config.depth / 100) * 3.5, 1.4)  // profundidade vira altura
  const T = config.thickness / 100

  const stone = { map: texture, roughness: material.roughness, metalness: material.metalness }
  const isRebaixo = type === 'rebaixo_italiano' || type === 'rebaixo_americano'
  const isRevestimento = type === 'revestimento_parede'

  /* Painel com rebaixo: moldura de pedra ao redor de fundo escuro */
  if (isRebaixo) {
    const bW = W * 0.12   // largura da moldura horizontal
    const bH = H * 0.1    // altura da moldura vertical
    const innerW = W - bW * 2
    const innerH = H - bH * 2
    const recessD = 0.025  // profundidade do rebaixo

    return (
      <group position={[0, H / 2, 0]}>
        {/* Painel de fundo */}
        <mesh castShadow receiveShadow position={[0, 0, -T / 2]}>
          <boxGeometry args={[W, H, 0.01]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Borda superior */}
        <mesh castShadow receiveShadow position={[0, H / 2 - bH / 2, 0]}>
          <boxGeometry args={[W, bH, T]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Borda inferior */}
        <mesh castShadow receiveShadow position={[0, -H / 2 + bH / 2, 0]}>
          <boxGeometry args={[W, bH, T]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Borda esquerda */}
        <mesh castShadow receiveShadow position={[-W / 2 + bW / 2, 0, 0]}>
          <boxGeometry args={[bW, innerH, T]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Borda direita */}
        <mesh castShadow receiveShadow position={[W / 2 - bW / 2, 0, 0]}>
          <boxGeometry args={[bW, innerH, T]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Fundo recuado (interior escuro) */}
        <mesh castShadow receiveShadow position={[0, 0, -(T / 2 + recessD / 2 + 0.002)]}>
          <boxGeometry args={[innerW, innerH, recessD]} />
          <meshStandardMaterial color="#12121a" roughness={0.95} />
        </mesh>
      </group>
    )
  }

  /* Revestimento de parede: painel com juntas horizontais e verticais */
  if (isRevestimento) {
    const tileW = 0.6
    const tileH = 0.3
    const joint = 0.008
    const cols = Math.min(Math.round(W / tileW), 5)
    const rows = Math.min(Math.round(H / tileH), 6)
    const realTileW = (W - (cols + 1) * joint) / cols
    const realTileH = (H - (rows + 1) * joint) / rows

    return (
      <group position={[0, H / 2, 0]}>
        {/* Base de rejunte */}
        <mesh receiveShadow position={[0, 0, -T / 2]}>
          <boxGeometry args={[W, H, T]} />
          <meshStandardMaterial color="#888" roughness={0.9} />
        </mesh>
        {Array.from({ length: cols }).map((_, ci) =>
          Array.from({ length: rows }).map((_, ri) => {
            const px = -W / 2 + joint + realTileW / 2 + ci * (realTileW + joint)
            const py = -H / 2 + joint + realTileH / 2 + ri * (realTileH + joint)
            return (
              <mesh key={`${ci}-${ri}`} castShadow receiveShadow position={[px, py, 0]}>
                <boxGeometry args={[realTileW, realTileH, T + 0.004]} />
                <meshStandardMaterial {...stone} />
              </mesh>
            )
          })
        )}
      </group>
    )
  }

  /* Fachada / painel simples */
  return (
    <group position={[0, H / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[W, H, T]} />
        <meshStandardMaterial {...stone} />
      </mesh>
      {/* Linha de junta decorativa central */}
      <mesh position={[0, 0, T / 2 + 0.001]}>
        <boxGeometry args={[W, 0.006, 0.003]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>
    </group>
  )
}
