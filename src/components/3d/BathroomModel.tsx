import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping } from 'three'
import type { CountertopConfig, ProjectType, StoneMaterial } from '../../types'
import { generateStoneTexture } from '../../utils/textureGenerator'

interface Props {
  type: ProjectType
  config: CountertopConfig
  material: StoneMaterial
}

export default function BathroomModel({ type, config, material }: Props) {
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
  const stone = { map: texture, roughness: material.roughness, metalness: material.metalness }

  /* Cuba esculpida: monolito de pedra com bacia escavada */
  if (type === 'cuba_esculpida') {
    const H = Math.max(D * 0.8, 0.18)
    return (
      <group position={[0, H / 2, 0]}>
        {/* Corpo do monolito */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[W, H, D]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Bacia escavada — subtração visual com caixa escura no topo */}
        <mesh position={[0, H / 2 - 0.005, 0]}>
          <boxGeometry args={[W * 0.75, H * 0.65, D * 0.72]} />
          <meshStandardMaterial color="#0d0d12" roughness={0.97} />
        </mesh>
        {/* Borda/rim de pedra em volta */}
        <mesh castShadow receiveShadow position={[0, H / 2 + 0.008, 0]}>
          <boxGeometry args={[W + 0.02, 0.016, D + 0.02]} />
          <meshStandardMaterial {...stone} roughness={0.1} metalness={0.05} />
        </mesh>
        {/* Ralo */}
        <mesh position={[0, H / 2 - H * 0.65 + 0.001, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.005, 16]} />
          <meshStandardMaterial color="#333" roughness={0.4} metalness={0.6} />
        </mesh>
      </group>
    )
  }

  /* Nicho: caixa aberta embutida na parede */
  if (type === 'nicho') {
    const nH = Math.max(D * 2.5, 0.35)
    const nDepth = 0.13
    return (
      <group position={[0, nH / 2, 0]}>
        <mesh castShadow receiveShadow position={[0, 0, -nDepth / 2]}>
          <boxGeometry args={[W, nH, T]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, nH / 2 - T / 2, 0]}>
          <boxGeometry args={[W, T, nDepth]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, -nH / 2 + T / 2, 0]}>
          <boxGeometry args={[W, T, nDepth]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        <mesh castShadow receiveShadow position={[-W / 2 + T / 2, 0, 0]}>
          <boxGeometry args={[T, nH - T * 2, nDepth]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        <mesh castShadow receiveShadow position={[W / 2 - T / 2, 0, 0]}>
          <boxGeometry args={[T, nH - T * 2, nDepth]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Fundo do nicho */}
        <mesh receiveShadow position={[0, 0, -nDepth + T / 2]}>
          <boxGeometry args={[W - T * 2, nH - T * 2, T]} />
          <meshStandardMaterial color="#1a1a20" roughness={0.97} />
        </mesh>
      </group>
    )
  }

  /* Prateleira: laje com suportes laterais */
  if (type === 'prateleira') {
    return (
      <group position={[0, T / 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[W, T, D]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Suporte esquerdo */}
        <mesh castShadow receiveShadow position={[-W / 2 + 0.04, -0.06, 0]}>
          <boxGeometry args={[0.045, 0.1, D * 0.8]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Suporte direito */}
        <mesh castShadow receiveShadow position={[W / 2 - 0.04, -0.06, 0]}>
          <boxGeometry args={[0.045, 0.1, D * 0.8]} />
          <meshStandardMaterial {...stone} />
        </mesh>
      </group>
    )
  }

  /* Banco de box: assento com estrutura fechada */
  if (type === 'banco_box') {
    const bH = 0.45
    return (
      <group position={[0, bH / 2, 0]}>
        {/* Tampa / assento */}
        <mesh castShadow receiveShadow position={[0, bH / 2 - T / 2, 0]}>
          <boxGeometry args={[W, T, D]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Painel frontal */}
        <mesh castShadow receiveShadow position={[0, 0, D / 2 - T / 2]}>
          <boxGeometry args={[W, bH - T, T]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Lateral esquerda */}
        <mesh castShadow receiveShadow position={[-W / 2 + T / 2, 0, 0]}>
          <boxGeometry args={[T, bH - T, D]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Lateral direita */}
        <mesh castShadow receiveShadow position={[W / 2 - T / 2, 0, 0]}>
          <boxGeometry args={[T, bH - T, D]} />
          <meshStandardMaterial {...stone} />
        </mesh>
      </group>
    )
  }

  /* Fallback: laje genérica */
  return (
    <group position={[0, T / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[W, T, D]} />
        <meshStandardMaterial {...stone} />
      </mesh>
    </group>
  )
}
