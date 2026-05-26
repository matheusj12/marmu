import { useMemo } from 'react';
import { CanvasTexture, RepeatWrapping } from 'three';
import { StaircaseConfig, StoneMaterial } from '../../types';
import { generateStoneTexture } from '../../utils/textureGenerator';

interface EscadaModelProps {
  config: StaircaseConfig;
  material: StoneMaterial;
}

export default function EscadaModel({ config, material }: EscadaModelProps) {
  // Generate procedural texture based on material fields
  const texture = useMemo(() => {
    const canvas = generateStoneTexture(material);
    const tex = new CanvasTexture(canvas);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.repeat.set(1.5, 1.5);
    tex.needsUpdate = true;
    return tex;
  }, [material]);

  const sw = config.stepWidth / 100;    // convert cm to meters
  const sd = config.stepDepth / 100;
  const sh = config.stepHeight / 100;
  const t = config.thickness / 100;
  const steps = config.stepsCount;

  const stoneMaterialProps = {
    map: texture,
    roughness: material.roughness,
    metalness: material.metalness,
  };

  // Compute total depth and height
  const totalDepth = steps * sd;
  const totalHeight = steps * sh;

  return (
    // Center the staircase in the 3D grid world
    <group position={[0, t / 2, -(totalDepth) / 3]}>
      
      {/* RENDER STEPS IN LOOP */}
      {Array.from({ length: steps }).map((_, i) => {
        // Position variables for each individual step
        const stepY = i * sh;
        const stepZ = i * sd;

        return (
          <group key={i} position={[0, stepY, stepZ]}>
            
            {/* 1. STEP TREAD (Piso/Degrau) */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[sw, t, sd]} />
              <meshStandardMaterial {...stoneMaterialProps} />
            </mesh>

            {/* 2. STEP RISER (Espelho) */}
            {config.style !== 'flutuante' && (
              <mesh 
                // Positioned below the current tread, at the front of the step (or back in coordinate system)
                position={[0, -sh / 2 + t / 2, sd / 2 - t / 2]} 
                castShadow receiveShadow
              >
                <boxGeometry args={[sw, sh - t, t]} />
                <meshStandardMaterial {...stoneMaterialProps} />
              </mesh>
            )}

            {/* 2b. FLOATING WALL PIN (If floating, draw chrome support rods on the side) */}
            {config.style === 'flutuante' && (
              <group>
                {/* Left side wall mounting bracket pin */}
                <mesh position={[-sw / 2 - 0.05, -0.02, 0]} rotation={[0, 0, 1.57]}>
                  <cylinderGeometry args={[0.012, 0.012, 0.1, 12]} />
                  <meshStandardMaterial color="#888" metalness={0.9} roughness={0.1} />
                </mesh>
                {/* Right side wall mounting bracket pin */}
                <mesh position={[sw / 2 + 0.05, -0.02, 0]} rotation={[0, 0, 1.57]}>
                  <cylinderGeometry args={[0.012, 0.012, 0.1, 12]} />
                  <meshStandardMaterial color="#888" metalness={0.9} roughness={0.1} />
                </mesh>
              </group>
            )}

            {/* 3. LATURAL SKIRTING TRIM / RODAPÉ JACARÉ (If toggled on) */}
            {config.hasSkirting && (
              <group>
                {/* Left skirting profile */}
                <mesh position={[-sw / 2 + t / 4, 0.08 + t/2, 0]} castShadow>
                  <boxGeometry args={[t / 2, 0.16, sd]} />
                  <meshStandardMaterial {...stoneMaterialProps} />
                </mesh>
                
                {config.style !== 'flutuante' && (
                  <mesh position={[-sw / 2 + t / 4, 0.08 + t/2 - sh/2, sd/2 - t/2]} castShadow>
                    <boxGeometry args={[t / 2, sh, t]} />
                    <meshStandardMaterial {...stoneMaterialProps} />
                  </mesh>
                )}

                {/* Right skirting profile */}
                <mesh position={[sw / 2 - t / 4, 0.08 + t/2, 0]} castShadow>
                  <boxGeometry args={[t / 2, 0.16, sd]} />
                  <meshStandardMaterial {...stoneMaterialProps} />
                </mesh>
                
                {config.style !== 'flutuante' && (
                  <mesh position={[sw / 2 - t / 4, 0.08 + t/2 - sh/2, sd/2 - t/2]} castShadow>
                    <boxGeometry args={[t / 2, sh, t]} />
                    <meshStandardMaterial {...stoneMaterialProps} />
                  </mesh>
                )}
              </group>
            )}

          </group>
        );
      })}

      {/* 4. SOLID REINFORCEMENT BACKING (Under-stairs support) */}
      {config.style === 'cascata' && steps > 1 && (
        <mesh 
          position={[0, totalHeight / 2 - sh/2 - 0.05, totalDepth / 2 - sd/2]} 
          rotation={[-Math.atan(sh / sd), 0, 0]} 
          receiveShadow
        >
          {/* A thick diagnostic support plate running straight from top to bottom steps */}
          <boxGeometry args={[sw - 0.01, 0.05, Math.sqrt(totalHeight * totalHeight + totalDepth * totalDepth)]} />
          <meshStandardMaterial color="#222" roughness={0.8} />
        </mesh>
      )}

      {/* Mock mounting columns to frame the staircase and anchor OrbitControls */}
      {config.style === 'flutuante' && (
        <group>
          {/* Left wall surface */}
          <mesh position={[-sw / 2 - 0.11, totalHeight/2 - sh/2, totalDepth/2 - sd/2]} receiveShadow>
            <boxGeometry args={[0.02, totalHeight + 0.3, totalDepth + sd]} />
            <meshStandardMaterial color="#1a1a1e" roughness={0.9} />
          </mesh>
          {/* Right wall surface */}
          <mesh position={[sw / 2 + 0.11, totalHeight/2 - sh/2, totalDepth/2 - sd/2]} receiveShadow>
            <boxGeometry args={[0.02, totalHeight + 0.3, totalDepth + sd]} />
            <meshStandardMaterial color="#1a1a1e" roughness={0.9} />
          </mesh>
        </group>
      )}

    </group>
  );
}
