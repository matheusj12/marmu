import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping } from 'three'
import type { CountertopConfig, ProjectType, StoneMaterial } from '../../types'
import { generateStoneTexture } from '../../utils/textureGenerator'

interface Props {
  type: ProjectType
  config: CountertopConfig
  material: StoneMaterial
}

export default function CommercialModel({ type, config, material }: Props) {
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

  /* Balcão comercial: tampo + frente + laterais */
  if (type === 'balcao') {
    const H = 0.92
    return (
      <group>
        {/* Tampo */}
        <mesh castShadow receiveShadow position={[0, H + T / 2, 0]}>
          <boxGeometry args={[W, T, D]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Painel frontal */}
        <mesh castShadow receiveShadow position={[0, H / 2, D / 2 - T / 2]}>
          <boxGeometry args={[W, H, T]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Lateral esquerda */}
        <mesh castShadow receiveShadow position={[-W / 2 + T / 2, H / 2, 0]}>
          <boxGeometry args={[T, H, D]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Lateral direita */}
        <mesh castShadow receiveShadow position={[W / 2 - T / 2, H / 2, 0]}>
          <boxGeometry args={[T, H, D]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Rodapé frontal em pedra */}
        <mesh castShadow receiveShadow position={[0, 0.04, D / 2 - T / 2 - 0.04]}>
          <boxGeometry args={[W - T * 2, 0.08, T]} />
          <meshStandardMaterial {...stone} roughness={0.15} />
        </mesh>
      </group>
    )
  }

  /* Piscina: borda/coroamento + sugestão de água */
  if (type === 'piscina') {
    const copH = T * 2
    const copD = 0.38
    const lipH = 0.1
    return (
      <group position={[0, copH / 2, 0]}>
        {/* Borda horizontal */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[W, copH, copD]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Lábio vertical (pendura sobre a piscina) */}
        <mesh castShadow receiveShadow position={[0, -lipH / 2 - copH / 2, -copD / 2 + T / 2]}>
          <boxGeometry args={[W, lipH, T]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Sugestão de água */}
        <mesh receiveShadow position={[0, -copH / 2 - 0.06, copD / 2 + 0.35]}>
          <boxGeometry args={[W, 0.025, 1.1]} />
          <meshStandardMaterial color="#0077bb" roughness={0.04} metalness={0.25} transparent opacity={0.82} />
        </mesh>
      </group>
    )
  }

  /* Churrasqueira externa: bancada + painel + sugestão de grelha */
  if (type === 'churrasqueira_ext') {
    const H = 0.88
    return (
      <group>
        {/* Tampo */}
        <mesh castShadow receiveShadow position={[0, H + T / 2, 0]}>
          <boxGeometry args={[W, T, D]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Painel frontal */}
        <mesh castShadow receiveShadow position={[0, H / 2, D / 2 - T / 2]}>
          <boxGeometry args={[W, H, T]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Lateral esquerda */}
        <mesh castShadow receiveShadow position={[-W / 2 + T / 2, H / 2, 0]}>
          <boxGeometry args={[T, H, D]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Lateral direita */}
        <mesh castShadow receiveShadow position={[W / 2 - T / 2, H / 2, 0]}>
          <boxGeometry args={[T, H, D]} />
          <meshStandardMaterial {...stone} />
        </mesh>
        {/* Grelha metálica sobre o tampo */}
        <mesh receiveShadow position={[0, H + T + 0.012, 0]}>
          <boxGeometry args={[W * 0.55, 0.015, D * 0.65]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.25} metalness={0.9} />
        </mesh>
        {/* Grades da grelha (longilíneas) */}
        {[-0.08, 0, 0.08].map((x) => (
          <mesh key={x} receiveShadow position={[x, H + T + 0.02, 0]}>
            <boxGeometry args={[0.006, 0.005, D * 0.65]} />
            <meshStandardMaterial color="#444" roughness={0.2} metalness={0.95} />
          </mesh>
        ))}
      </group>
    )
  }

  /* Fallback */
  return (
    <group position={[0, T / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[W, T, D]} />
        <meshStandardMaterial {...stone} />
      </mesh>
    </group>
  )
}
