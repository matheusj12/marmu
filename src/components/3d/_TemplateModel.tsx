/**
 * Template para novos modelos 3D.
 * Copie este arquivo, renomeie (ex: MeuModel.tsx) e implemente o modelo.
 * Remova este comentário e os comentários de instrução após implementar.
 *
 * Passos para adicionar um novo modelo:
 * 1. Copie este arquivo para `src/components/3d/NomeModel.tsx`
 * 2. Implemente a geometria no componente abaixo
 * 3. Importe em `ThreeView.tsx` e adicione ao switch de renderização
 * 4. Adicione o novo tipo em `Model3DType` em `src/types.ts` se necessário
 * 5. Atualize `get3DModel()` em `src/types.ts` para mapear ProjectTypes ao novo modelo
 */

import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping, MeshStandardMaterial } from 'three'
import { generateStoneTexture } from '../../utils/textureGenerator'
import type { CountertopConfig, StoneMaterial } from '../../types'

interface TemplateModelProps {
  config: CountertopConfig   // troque por StaircaseConfig se for modelo de escada
  material: StoneMaterial
}

export default function TemplateModel({ config, material }: TemplateModelProps) {
  // Converte cm → metros (escala Three.js)
  const W = config.width / 100
  const D = config.depth / 100
  const T = config.thickness / 100

  // Textura procedural de pedra
  const texture = useMemo(() => {
    const canvas = generateStoneTexture(material)
    const tex = new CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = RepeatWrapping
    tex.repeat.set(W * 2, D * 2)
    return tex
  }, [material, W, D])

  // Material Three.js
  const mat = useMemo(
    () =>
      new MeshStandardMaterial({
        map: texture,
        roughness: material.roughness,
        metalness: material.metalness,
        envMapIntensity: 1.0,
      }),
    [texture, material],
  )

  return (
    <group>
      {/* Exemplo: caixa simples — substitua pela geometria real */}
      <mesh castShadow receiveShadow material={mat}>
        <boxGeometry args={[W, T, D]} />
      </mesh>
    </group>
  )
}
