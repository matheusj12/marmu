import { useMemo } from 'react';
import { CanvasTexture, RepeatWrapping, Shape, ExtrudeGeometry, DoubleSide } from 'three';
import { CountertopConfig, StoneMaterial } from '../types';
import { generateStoneTexture } from '../utils/textureGenerator';

interface BancadaModelProps {
  config: CountertopConfig;
  material: StoneMaterial;
}

export default function BancadaModel({ config, material }: BancadaModelProps) {
  // Generate procedural texture based on material fields
  const texture = useMemo(() => {
    const canvas = generateStoneTexture(material);
    const tex = new CanvasTexture(canvas);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    // Adapt scale so veining / grain looks proportionate
    tex.repeat.set(1.5, 1.5);
    tex.needsUpdate = true;
    return tex;
  }, [material]);

  const w = config.width / 100;         // convert cm to meters
  const d = config.depth / 100;
  const t = config.thickness / 100;
  const sh = config.saiaHeight / 100;
  const fh = config.frontaoHeight / 100;

  // Sink dimensions
  const sw = config.sinkWidth / 100;
  const sd = config.sinkDepth / 100;
  // Cooktop dimensions
  const cw = config.cooktopWidth / 100;
  const cd = config.cooktopDepth / 100;

  // Let's compute positions and dimensions of split slabs to render a real cutout hole!
  // Sinks are standardly centered in depth and have a configurable X offset.
  // X offset bounds calculation to avoid spilling
  const marginSideX = 0.15; // 15cm margin minimum from edges
  const maxOffset = Math.max(0, (w / 2) - (sw / 2) - marginSideX);
  const sinkOffsetX = Math.max(-maxOffset, Math.min(maxOffset, (config.sinkX / 100) * maxOffset));

  const maxCooktopOffset = Math.max(0, (w / 2) - (cw / 2) - marginSideX);
  const cooktopOffsetX = Math.max(-maxCooktopOffset, Math.min(maxCooktopOffset, (config.cooktopX / 100) * maxCooktopOffset));

  // ── Custom polygon geometry ────────────────────────────────────────────
  const customGeo = useMemo(() => {
    const verts = config.vertices;
    if (!verts || verts.length < 3) return null;
    const xs = verts.map(v => v.x), ys = verts.map(v => v.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2 / 100;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2 / 100;
    const shape = new Shape();
    shape.moveTo(verts[0].x / 100 - cx, -(verts[0].y / 100 - cy));
    for (let i = 1; i < verts.length; i++) {
      shape.lineTo(verts[i].x / 100 - cx, -(verts[i].y / 100 - cy));
    }
    shape.closePath();
    return new ExtrudeGeometry(shape, { depth: t, bevelEnabled: false });
  }, [config.vertices, t]);

  const stoneMaterialProps = {
    map: texture,
    roughness: material.roughness,
    metalness: material.metalness,
  };

  // ── Polygon mode rendering ─────────────────────────────────────────────
  if (customGeo) {
    return (
      <group>
        <mesh geometry={customGeo} rotation-x={-Math.PI / 2} position={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial {...stoneMaterialProps} side={DoubleSide} />
        </mesh>
        {/* Sink model repositioned at approximate center */}
        {config.hasSink && (
          <group position={[0, t, 0]}>
            <mesh position={[0, -0.09, 0]} castShadow>
              <boxGeometry args={[sw - 0.01, 0.16, sd - 0.01]} />
              <meshStandardMaterial color="#b5babf" roughness={0.15} metalness={0.95} />
            </mesh>
          </group>
        )}
      </group>
    );
  }

  return (
    <group position={[0, t / 2, 0]}>
      
      {/* 1. PRINCIPAL STONE SLAB (With or without cutouts) */}
      {!config.hasSink && !config.hasCooktop ? (
        // Simple Solid Slab
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, t, d]} />
          <meshStandardMaterial {...stoneMaterialProps} />
        </mesh>
      ) : (
        // Dynamic slab partitions to create exact hollow cutouts in 3D without CSG
        <group>
          {/* We partition the depth 'd' and width 'w' around the cutout boxes to make a real procedural grid of stone plates */}
          {/* For simplicity and speed, let's render the left, right, back and front partitions relative to the cutout elements */}
          {/* Let's construct a comprehensive partition layout depending on configuration */}
          
          {config.hasSink && !config.hasCooktop && (
            <group>
              {/* Left Plate: from left edge to sink left edge */}
              <mesh 
                position={[(-w / 2 + (w / 2 + sinkOffsetX - sw / 2) / 2), 0, 0]} 
                castShadow receiveShadow
              >
                <boxGeometry args={[Math.max(0.01, w / 2 + sinkOffsetX - sw / 2), t, d]} />
                <meshStandardMaterial {...stoneMaterialProps} />
              </mesh>

              {/* Right Plate: from sink right edge to right edge */}
              <mesh 
                position={[(w / 2 - (w / 2 - sinkOffsetX - sw / 2) / 2), 0, 0]} 
                castShadow receiveShadow
              >
                <boxGeometry args={[Math.max(0.01, w / 2 - sinkOffsetX - sw / 2), t, d]} />
                <meshStandardMaterial {...stoneMaterialProps} />
              </mesh>

              {/* Back strip: centered on sink X, behind sink */}
              <mesh 
                position={[sinkOffsetX, 0, -(d / 2) + ((d - sd) / 4)]} 
                castShadow receiveShadow
              >
                <boxGeometry args={[sw, t, Math.max(0.01, (d - sd) / 2)]} />
                <meshStandardMaterial {...stoneMaterialProps} />
              </mesh>

              {/* Front strip: centered on sink X, in front of sink */}
              <mesh 
                position={[sinkOffsetX, 0, (d / 2) - ((d - sd) / 4)]} 
                castShadow receiveShadow
              >
                <boxGeometry args={[sw, t, Math.max(0.01, (d - sd) / 2)]} />
                <meshStandardMaterial {...stoneMaterialProps} />
              </mesh>
            </group>
          )}

          {config.hasCooktop && !config.hasSink && (
            <group>
              {/* Left Plate */}
              <mesh 
                position={[(-w / 2 + (w / 2 + cooktopOffsetX - cw / 2) / 2), 0, 0]} 
                castShadow receiveShadow
              >
                <boxGeometry args={[Math.max(0.01, w / 2 + cooktopOffsetX - cw / 2), t, d]} />
                <meshStandardMaterial {...stoneMaterialProps} />
              </mesh>

              {/* Right Plate */}
              <mesh 
                position={[(w / 2 - (w / 2 - cooktopOffsetX - cw / 2) / 2), 0, 0]} 
                castShadow receiveShadow
              >
                <boxGeometry args={[Math.max(0.01, w / 2 - cooktopOffsetX - cw / 2), t, d]} />
                <meshStandardMaterial {...stoneMaterialProps} />
              </mesh>

              {/* Back strip */}
              <mesh 
                position={[cooktopOffsetX, 0, -(d / 2) + ((d - cd) / 4)]} 
                castShadow receiveShadow
              >
                <boxGeometry args={[cw, t, Math.max(0.01, (d - cd) / 2)]} />
                <meshStandardMaterial {...stoneMaterialProps} />
              </mesh>

              {/* Front strip */}
              <mesh 
                position={[cooktopOffsetX, 0, (d / 2) - ((d - cd) / 4)]} 
                castShadow receiveShadow
              >
                <boxGeometry args={[cw, t, Math.max(0.01, (d - cd) / 2)]} />
                <meshStandardMaterial {...stoneMaterialProps} />
              </mesh>
            </group>
          )}

          {/* Dual Cutout Layout: sink left side, cooktop right side */}
          {config.hasSink && config.hasCooktop && (
            <group>
              {/* If both are active, we place sink and cooktop with distinct offsets. 
                  Let's split the table cleanly into Left (around Sink), Middle (divider), and Right (around Cooktop). */}
              {/* Slab on far-left (extending to sink left) */}
              <mesh 
                position={[(-w / 2 + (w / 2 + sinkOffsetX - sw / 2) / 2), 0, 0]} 
                castShadow receiveShadow
              >
                <boxGeometry args={[Math.max(0.01, w / 2 + sinkOffsetX - sw / 2), t, d]} />
                <meshStandardMaterial {...stoneMaterialProps} />
              </mesh>

              {/* Slab on far-right (extending from cooktop right to end) */}
              <mesh 
                position={[(w / 2 - (w / 2 - cooktopOffsetX - cw / 2) / 2), 0, 0]} 
                castShadow receiveShadow
              >
                <boxGeometry args={[Math.max(0.01, w / 2 - cooktopOffsetX - cw / 2), t, d]} />
                <meshStandardMaterial {...stoneMaterialProps} />
              </mesh>

              {/* Slab between sink and cooktop */}
              <mesh 
                position={[(sinkOffsetX + sw/2 + (cooktopOffsetX - cw/2 - (sinkOffsetX + sw/2))/2), 0, 0]} 
                castShadow receiveShadow
              >
                <boxGeometry args={[Math.max(0.01, cooktopOffsetX - cw/2 - (sinkOffsetX + sw/2)), t, d]} />
                <meshStandardMaterial {...stoneMaterialProps} />
              </mesh>

              {/* Behind Sink strip */}
              <mesh position={[sinkOffsetX, 0, -(d/2) + ((d - sd)/4)]} castShadow receiveShadow>
                <boxGeometry args={[sw, t, Math.max(0.01, (d-sd)/2)]} />
                <meshStandardMaterial {...stoneMaterialProps} />
              </mesh>

              {/* In front of Sink strip */}
              <mesh position={[sinkOffsetX, 0, (d/2) - ((d - sd)/4)]} castShadow receiveShadow>
                <boxGeometry args={[sw, t, Math.max(0.01, (d-sd)/2)]} />
                <meshStandardMaterial {...stoneMaterialProps} />
              </mesh>

              {/* Behind Cooktop strip */}
              <mesh position={[cooktopOffsetX, 0, -(d/2) + ((d - cd)/4)]} castShadow receiveShadow>
                <boxGeometry args={[cw, t, Math.max(0.01, (d-cd)/2)]} />
                <meshStandardMaterial {...stoneMaterialProps} />
              </mesh>

              {/* In front of Cooktop strip */}
              <mesh position={[cooktopOffsetX, 0, (d/2) - ((d - cd)/4)]} castShadow receiveShadow>
                <boxGeometry args={[cw, t, Math.max(0.01, (d-cd)/2)]} />
                <meshStandardMaterial {...stoneMaterialProps} />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* 2. BACKSPLASH (Frontão Traseiro) */}
      {fh > 0 && (
        <mesh position={[0, fh / 2 + t / 2, -d / 2 + t / 2]} castShadow receiveShadow>
          <boxGeometry args={[w, fh, t]} />
          <meshStandardMaterial {...stoneMaterialProps} />
        </mesh>
      )}

      {/* 3. LATERAL BACKSPLASHES (Frontão Lateral) */}
      {fh > 0 && config.frontaoLeft && (
        <mesh position={[-w / 2 + t / 2, fh / 2 + t / 2, t / 2]} castShadow receiveShadow>
          <boxGeometry args={[t, fh, d - t]} />
          <meshStandardMaterial {...stoneMaterialProps} />
        </mesh>
      )}

      {fh > 0 && config.frontaoRight && (
        <mesh position={[w / 2 - t / 2, fh / 2 + t / 2, t / 2]} castShadow receiveShadow>
          <boxGeometry args={[t, fh, d - t]} />
          <meshStandardMaterial {...stoneMaterialProps} />
        </mesh>
      )}

      {/* 4. APRON FRONT (Saia Frontal) */}
      {sh > 0 && (
        <mesh position={[0, -sh / 2 + t / 2, d / 2 - t / 2]} castShadow receiveShadow>
          <boxGeometry args={[w, sh, t]} />
          <meshStandardMaterial {...stoneMaterialProps} />
        </mesh>
      )}

      {/* 5. APRON SIDES (Saia Lateral - typically only visible at non-touching free side walls) */}
      {sh > 0 && (
        <group>
          <mesh position={[-w / 2 + t / 2, -sh / 2 + t / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[t, sh, d - t]} />
            <meshStandardMaterial {...stoneMaterialProps} />
          </mesh>
          <mesh position={[w / 2 - t / 2, -sh / 2 + t / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[t, sh, d - t]} />
            <meshStandardMaterial {...stoneMaterialProps} />
          </mesh>
        </group>
      )}

      {/* 6. PHYSICAL SINK MODEL (Cuba Acoplada Inox / Esculpida) */}
      {config.hasSink && (
        <group position={[sinkOffsetX, -0.01, 0]}>
          {config.sinkType === 'esculpida' ? (
            // Elegant stone-sculpted sink (Pia esculpida/rampa na própria pedra!)
            <group>
              {/* Back ramp */}
              <mesh position={[0, -0.06, -0.04]} rotation={[0.4, 0, 0]}>
                <boxGeometry args={[sw - 0.02, 0.01, sd * 0.7]} />
                <meshStandardMaterial {...stoneMaterialProps} />
              </mesh>
              {/* Slit outlet plate */}
              <mesh position={[0, -0.11, sd / 3]}>
                <boxGeometry args={[sw - 0.04, 0.015, 0.04]} />
                <meshStandardMaterial {...stoneMaterialProps} roughness={0.3} />
              </mesh>
              {/* Flat stone frame bottoms */}
              <mesh position={[0, -0.14, 0]}>
                <boxGeometry args={[sw - 0.01, t, sd - 0.01]} />
                <meshStandardMaterial color="#222" roughness={0.9} />
              </mesh>
            </group>
          ) : (
            // Realistic stainless steel double/single bowl sink (Cuba de Inox)
            <group>
              {/* Metal Bowl */}
              <mesh position={[0, -0.09, 0]} castShadow>
                <boxGeometry args={[sw - 0.01, 0.16, sd - 0.01]} />
                <meshStandardMaterial 
                  color="#b5babf" 
                  roughness={0.15} 
                  metalness={0.95} 
                  flatShading={false}
                />
              </mesh>
              {/* Drainage hole */}
              <mesh position={[0, -0.168, 0]}>
                <cylinderGeometry args={[0.035, 0.035, 0.005, 16]} />
                <meshStandardMaterial color="#111" roughness={0.5} />
              </mesh>
              {/* Shiny lip ring */}
              <mesh position={[0, t/2 + 0.001, 0]}>
                <boxGeometry args={[sw + 0.02, 0.002, sd + 0.02]} />
                <meshStandardMaterial color="#e0e4e8" roughness={0.1} metalness={0.9} />
              </mesh>
              {/* Faucet/Torneira metal model */}
              <group position={[0, 0, -sd / 2 - 0.02]}>
                {/* Vertical support */}
                <mesh position={[0, 0.08, 0]}>
                  <cylinderGeometry args={[0.012, 0.012, 0.16]} />
                  <meshStandardMaterial color="#dfdfdf" metalness={0.9} roughness={0.1} />
                </mesh>
                {/* Curved neck */}
                <mesh position={[0, 0.18, 0.03]} rotation={[1.2, 0, 0]}>
                  <cylinderGeometry args={[0.01, 0.01, 0.08]} />
                  <meshStandardMaterial color="#dfdfdf" metalness={0.9} roughness={0.1} />
                </mesh>
                <mesh position={[0, 0.19, 0.07]} rotation={[0, 0, 0]}>
                  <cylinderGeometry args={[0.009, 0.009, 0.04]} />
                  <meshStandardMaterial color="#dfdfdf" metalness={0.9} roughness={0.1} />
                </mesh>
                {/* Handle lever */}
                <mesh position={[0.02, 0.08, 0.01]} rotation={[0, 0, 1.5]}>
                  <cylinderGeometry args={[0.005, 0.005, 0.04]} />
                  <meshStandardMaterial color="#dfdfdf" metalness={0.9} roughness={0.1} />
                </mesh>
              </group>
            </group>
          )}
        </group>
      )}

      {/* 7. DETAILED COOKTOP ACCESSORY */}
      {config.hasCooktop && (
        <group position={[cooktopOffsetX, t / 2 + 0.0015, 0]}>
          {/* Black Glass Base */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[cw + 0.015, 0.004, cd + 0.015]} />
            <meshStandardMaterial color="#0b0c10" roughness={0.05} metalness={0.9} />
          </mesh>
          {/* Interactive touch controls illustration */}
          <mesh position={[cw / 3, 0.0025, cd / 3]}>
            <boxGeometry args={[0.04, 0.001, 0.015]} />
            <meshStandardMaterial color="#ff3b30" emissive="#ff3b30" emissiveIntensity={0.5} />
          </mesh>
          {/* Flame burner positions / Induction rings */}
          <group position={[0, 0.0021, 0]}>
            {/* Front Left */}
            <mesh position={[-cw / 4, 0, cd / 4]}>
              <ringGeometry args={[0.035, 0.04, 32]} />
              <meshBasicMaterial color="#ffffff" opacity={0.6} transparent />
            </mesh>
            {/* Back Left */}
            <mesh position={[-cw / 4, 0, -cd / 4]}>
              <ringGeometry args={[0.04, 0.045, 32]} />
              <meshBasicMaterial color="#ffffff" opacity={0.6} transparent />
            </mesh>
            {/* Front Right */}
            <mesh position={[cw / 4, 0, cd / 4]}>
              <ringGeometry args={[0.03, 0.035, 32]} />
              <meshBasicMaterial color="#ffffff" opacity={0.6} transparent />
            </mesh>
            {/* Back Right */}
            <mesh position={[cw / 4, 0, -cd / 4]}>
              <ringGeometry args={[0.045, 0.05, 32]} />
              <meshBasicMaterial color="#ffffff" opacity={0.6} transparent />
            </mesh>
          </group>
        </group>
      )}

    </group>
  );
}
