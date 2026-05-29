import { useMemo, useEffect } from 'react';
import { CanvasTexture, RepeatWrapping, Shape, Path, ExtrudeGeometry, FrontSide } from 'three';
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
    // Add cutout holes
    for (const cut of config.cutouts ?? []) {
      const hx0 = cut.x / 100 - cx, hx1 = (cut.x + cut.w) / 100 - cx;
      const hy0 = -(cut.y / 100 - cy), hy1 = -((cut.y + cut.h) / 100 - cy);
      const hole = new Path();
      hole.moveTo(hx0, hy0);
      hole.lineTo(hx1, hy0);
      hole.lineTo(hx1, hy1);
      hole.lineTo(hx0, hy1);
      hole.closePath();
      shape.holes.push(hole);
    }
    return new ExtrudeGeometry(shape, { depth: t, bevelEnabled: false });
  }, [config.vertices, config.cutouts, t]);

  // Dispose geometry when replaced
  useEffect(() => () => { customGeo?.dispose(); }, [customGeo]);

  const stoneMaterialProps = {
    map: texture,
    roughness: material.roughness,
    metalness: material.metalness,
  };

  // ── Polygon mode rendering ─────────────────────────────────────────────
  if (customGeo) {
    const verts = config.vertices!;
    const xs = verts.map(v => v.x), ys = verts.map(v => v.y);
    const minXm = Math.min(...xs) / 100, maxXm = Math.max(...xs) / 100;
    const minYm = Math.min(...ys) / 100, maxYm = Math.max(...ys) / 100;
    const polyW = maxXm - minXm;
    const polyD = maxYm - minYm;
    const cxm = (minXm + maxXm) / 2;
    const cym = (minYm + maxYm) / 2;

    // Convert polygon vertices to world coords (after rotation-x(-π/2))
    // world_x = v.x/100 - cxm,  world_z = v.y/100 - cym
    const vertsW = verts.map(v => ({ x: v.x / 100 - cxm, z: v.y / 100 - cym }));
    const n = vertsW.length;

    // Build edge descriptors from actual polygon segments (not vertex filtering)
    interface PolyEdge { cx: number; cz: number; len: number; angle: number }
    const polyEdges: PolyEdge[] = vertsW.map((v, i) => {
      const nv = vertsW[(i + 1) % n];
      return {
        cx: (v.x + nv.x) / 2,
        cz: (v.z + nv.z) / 2,
        len: Math.sqrt((nv.x - v.x) ** 2 + (nv.z - v.z) ** 2) || 0.001,
        angle: Math.atan2(nv.z - v.z, nv.x - v.x),
      };
    });

    // Back edge = min center-Z (wall edge), front edge = max center-Z (saia edge)
    const back  = polyEdges.reduce((a, b) => a.cz < b.cz ? a : b);
    const front = polyEdges.reduce((a, b) => a.cz > b.cz ? a : b);
    // Side edges (everything else), left = min center-X, right = max center-X
    const sides = polyEdges.filter(e => e !== back && e !== front);
    const leftE  = sides.length ? sides.reduce((a, b) => a.cx < b.cx ? a : b) : null;
    const rightE = sides.length ? sides.reduce((a, b) => a.cx > b.cx ? a : b) : null;

    // World position of a cutout center (cm coords → meters centered)
    const cutPos = (cut: { x: number; y: number; w: number; h: number }) => ({
      wx: (cut.x + cut.w / 2) / 100 - cxm,
      wz: (cut.y + cut.h / 2) / 100 - cym,
      ww: cut.w / 100,
      wd: cut.h / 100,
    });

    return (
      <group>
        {/* Main slab — exact polygon */}
        <mesh geometry={customGeo} rotation-x={-Math.PI / 2} position={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial {...stoneMaterialProps} side={FrontSide} />
        </mesh>

        {/* Frontão — aresta com menor Z médio (parede de fundo) */}
        {fh > 0 && (
          <mesh position={[back.cx, t + fh / 2, back.cz]} rotation={[0, -back.angle, 0]} castShadow receiveShadow>
            <boxGeometry args={[back.len, fh, t]} />
            <meshStandardMaterial {...stoneMaterialProps} />
          </mesh>
        )}

        {/* Aba lateral esquerda — aresta com menor X médio */}
        {fh > 0 && config.frontaoLeft && leftE && (
          <mesh position={[leftE.cx, t + fh / 2, leftE.cz]} rotation={[0, -leftE.angle, 0]} castShadow receiveShadow>
            <boxGeometry args={[leftE.len, fh, t]} />
            <meshStandardMaterial {...stoneMaterialProps} />
          </mesh>
        )}

        {/* Aba lateral direita — aresta com maior X médio */}
        {fh > 0 && config.frontaoRight && rightE && (
          <mesh position={[rightE.cx, t + fh / 2, rightE.cz]} rotation={[0, -rightE.angle, 0]} castShadow receiveShadow>
            <boxGeometry args={[rightE.len, fh, t]} />
            <meshStandardMaterial {...stoneMaterialProps} />
          </mesh>
        )}

        {/* Saia — aresta com maior Z médio (borda frontal) */}
        {sh > 0 && (
          <mesh position={[front.cx, -sh / 2, front.cz]} rotation={[0, -front.angle, 0]} castShadow receiveShadow>
            <boxGeometry args={[front.len, sh, t]} />
            <meshStandardMaterial {...stoneMaterialProps} />
          </mesh>
        )}

        {/* ── 3D accessories for each cutout ── */}
        {(config.cutouts ?? []).map(cut => {
          const { wx, wz, ww, wd } = cutPos(cut);
          const tipo = cut.tipo ?? 'vao';

          // ── Cuba variants ──────────────────────────────────────────────
          if (tipo.startsWith('cuba')) {
            const inox = { color: '#b5babf', roughness: 0.12, metalness: 0.95 };
            const chrome = { color: '#e0e4e8', roughness: 0.1, metalness: 0.9 };
            const pipe = { color: '#dfdfdf', metalness: 0.9, roughness: 0.1 };

            if (tipo === 'cuba-esculpida') return (
              <group key={cut.id} position={[wx, t, wz]}>
                <mesh position={[0, -0.05, 0]} rotation={[0.25, 0, 0]}>
                  <boxGeometry args={[ww - 0.02, 0.01, wd * 0.75]} />
                  <meshStandardMaterial {...stoneMaterialProps} />
                </mesh>
                <mesh position={[0, -0.11, wd * 0.2]}>
                  <boxGeometry args={[ww - 0.04, 0.015, 0.04]} />
                  <meshStandardMaterial color="#222" roughness={0.9} />
                </mesh>
              </group>
            );

            if (tipo === 'cuba-sobreposta') return (
              <group key={cut.id} position={[wx, t + 0.04, wz]}>
                <mesh position={[0, -0.04, 0]} castShadow>
                  <boxGeometry args={[ww + 0.04, 0.08, wd + 0.04]} />
                  <meshStandardMaterial {...inox} />
                </mesh>
                <mesh position={[0, 0.005, 0]}>
                  <boxGeometry args={[ww + 0.06, 0.003, wd + 0.06]} />
                  <meshStandardMaterial {...chrome} />
                </mesh>
                <mesh position={[0, -0.168, 0]}>
                  <cylinderGeometry args={[0.025, 0.025, 0.005, 16]} />
                  <meshStandardMaterial color="#111" roughness={0.5} />
                </mesh>
              </group>
            );

            if (tipo === 'cuba-dupla') return (
              <group key={cut.id} position={[wx, t, wz]}>
                {/* Two bowls */}
                {[-ww * 0.25, ww * 0.25].map((bx, i) => (
                  <group key={i} position={[bx, 0, 0]}>
                    <mesh position={[0, -0.09, 0]} castShadow>
                      <boxGeometry args={[ww * 0.46, 0.16, wd - 0.01]} />
                      <meshStandardMaterial {...inox} />
                    </mesh>
                    <mesh position={[0, -0.168, 0]}>
                      <cylinderGeometry args={[0.025, 0.025, 0.005, 16]} />
                      <meshStandardMaterial color="#111" roughness={0.5} />
                    </mesh>
                  </group>
                ))}
                {/* Divider */}
                <mesh position={[0, -0.05, 0]}>
                  <boxGeometry args={[0.012, 0.1, wd - 0.02]} />
                  <meshStandardMaterial {...inox} />
                </mesh>
                {/* Shared lip */}
                <mesh position={[0, 0.001, 0]}>
                  <boxGeometry args={[ww + 0.02, 0.002, wd + 0.02]} />
                  <meshStandardMaterial {...chrome} />
                </mesh>
                {/* Faucet center */}
                <group position={[0, 0, -wd / 2 - 0.02]}>
                  <mesh position={[0, 0.09, 0]}><cylinderGeometry args={[0.013, 0.013, 0.18]} /><meshStandardMaterial {...pipe} /></mesh>
                  <mesh position={[0, 0.2, 0.06]} rotation={[1.2, 0, 0]}><cylinderGeometry args={[0.01, 0.01, 0.09]} /><meshStandardMaterial {...pipe} /></mesh>
                </group>
              </group>
            );

            // cuba-simples (default)
            return (
              <group key={cut.id} position={[wx, t, wz]}>
                <mesh position={[0, -0.09, 0]} castShadow>
                  <boxGeometry args={[ww - 0.01, 0.16, wd - 0.01]} />
                  <meshStandardMaterial {...inox} />
                </mesh>
                <mesh position={[0, -0.168, 0]}>
                  <cylinderGeometry args={[0.03, 0.03, 0.005, 16]} />
                  <meshStandardMaterial color="#111" roughness={0.5} />
                </mesh>
                <mesh position={[0, 0.001, 0]}>
                  <boxGeometry args={[ww + 0.02, 0.002, wd + 0.02]} />
                  <meshStandardMaterial {...chrome} />
                </mesh>
                <group position={[0, 0, -wd / 2 - 0.02]}>
                  <mesh position={[0, 0.08, 0]}><cylinderGeometry args={[0.012, 0.012, 0.16]} /><meshStandardMaterial {...pipe} /></mesh>
                  <mesh position={[0, 0.19, 0.06]} rotation={[1.2, 0, 0]}><cylinderGeometry args={[0.01, 0.01, 0.09]} /><meshStandardMaterial {...pipe} /></mesh>
                </group>
              </group>
            );
          }

          // ── Cooktop variants ───────────────────────────────────────────
          if (tipo.startsWith('cooktop') || tipo === 'inducao') {
            const glass = { color: '#0b0c10', roughness: 0.05, metalness: 0.9 };

            if (tipo === 'inducao') return (
              <group key={cut.id} position={[wx, t + 0.002, wz]}>
                <mesh castShadow><boxGeometry args={[ww + 0.015, 0.004, wd + 0.015]} /><meshStandardMaterial {...glass} /></mesh>
                <group position={[0, 0.003, 0]}>
                  {[[-ww*0.24, wd*0.2], [ww*0.24, wd*0.2], [-ww*0.24, -wd*0.2], [ww*0.24, -wd*0.2]].map(([bx, bz], i) => (
                    <mesh key={i} position={[bx, 0, bz]}>
                      <boxGeometry args={[ww * 0.38, 0.0005, wd * 0.3]} />
                      <meshBasicMaterial color="#1a3a6e" opacity={0.8} transparent />
                    </mesh>
                  ))}
                  {/* Power indicator */}
                  <mesh position={[ww*0.42, 0, wd*0.4]}>
                    <circleGeometry args={[0.012, 16]} />
                    <meshBasicMaterial color="#ff3b30" />
                  </mesh>
                </group>
              </group>
            );

            if (tipo === 'cooktop-2b') return (
              <group key={cut.id} position={[wx, t + 0.002, wz]}>
                <mesh castShadow><boxGeometry args={[ww + 0.015, 0.004, wd + 0.015]} /><meshStandardMaterial {...glass} /></mesh>
                <group position={[0, 0.003, 0]}>
                  {[[-ww*0.27, 0, 0.04, 0.048], [ww*0.27, 0, 0.048, 0.056]].map(([bx, bz, r1, r2], i) => (
                    <mesh key={i} position={[bx, 0, bz as number]}>
                      <ringGeometry args={[r1 as number, r2 as number, 32]} />
                      <meshBasicMaterial color="#ffffff" opacity={0.6} transparent />
                    </mesh>
                  ))}
                </group>
              </group>
            );

            if (tipo === 'cooktop-5b') return (
              <group key={cut.id} position={[wx, t + 0.002, wz]}>
                <mesh castShadow><boxGeometry args={[ww + 0.015, 0.004, wd + 0.015]} /><meshStandardMaterial {...glass} /></mesh>
                <group position={[0, 0.003, 0]}>
                  {[[-ww*0.32, wd*0.25, 0.034, 0.04], [ww*0.32, wd*0.25, 0.03, 0.036],
                    [-ww*0.32,-wd*0.25, 0.04, 0.047], [ww*0.32,-wd*0.25, 0.025, 0.03],
                    [0, 0, 0.05, 0.06]].map(([bx, bz, r1, r2], i) => (
                    <mesh key={i} position={[bx as number, 0, bz as number]}>
                      <ringGeometry args={[r1 as number, r2 as number, 32]} />
                      <meshBasicMaterial color="#ffffff" opacity={0.65} transparent />
                    </mesh>
                  ))}
                </group>
              </group>
            );

            // cooktop-4b (default)
            return (
              <group key={cut.id} position={[wx, t + 0.002, wz]}>
                <mesh castShadow><boxGeometry args={[ww + 0.015, 0.004, wd + 0.015]} /><meshStandardMaterial {...glass} /></mesh>
                <group position={[0, 0.003, 0]}>
                  {[[-ww*0.28, wd*0.22, 0.038, 0.043], [ww*0.28, wd*0.22, 0.033, 0.038],
                    [-ww*0.28,-wd*0.22, 0.043, 0.049], [ww*0.28,-wd*0.22, 0.028, 0.033]].map(([bx, bz, r1, r2], i) => (
                    <mesh key={i} position={[bx as number, 0, bz as number]}>
                      <ringGeometry args={[r1 as number, r2 as number, 32]} />
                      <meshBasicMaterial color="#ffffff" opacity={0.6} transparent />
                    </mesh>
                  ))}
                  <mesh position={[ww*0.35, 0, wd*0.38]}><boxGeometry args={[0.04, 0.001, 0.015]} /><meshStandardMaterial color="#ff3b30" emissive="#ff3b30" emissiveIntensity={0.6} /></mesh>
                </group>
              </group>
            );
          }

          // ── Torneira variants ──────────────────────────────────────────
          if (tipo.startsWith('torneira')) {
            const base = { color: '#c8cdd2', metalness: 0.9, roughness: 0.15 };
            const pipe = { color: '#dfdfdf', metalness: 0.9, roughness: 0.1 };

            if (tipo === 'torneira-cascata') return (
              <group key={cut.id} position={[wx, t, wz]}>
                <mesh><cylinderGeometry args={[ww/2, ww/2, 0.008, 24]} /><meshStandardMaterial {...base} /></mesh>
                <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[0.013, 0.013, 0.28]} /><meshStandardMaterial {...pipe} /></mesh>
                {/* Flat waterfall plate */}
                <mesh position={[0, 0.3, 0.05]} rotation={[-0.3, 0, 0]}>
                  <boxGeometry args={[0.055, 0.003, 0.07]} />
                  <meshStandardMaterial color="#e8eaec" metalness={0.85} roughness={0.1} />
                </mesh>
              </group>
            );

            if (tipo === 'torneira-alta') return (
              <group key={cut.id} position={[wx, t, wz]}>
                <mesh><cylinderGeometry args={[ww/2, ww/2, 0.008, 24]} /><meshStandardMaterial {...base} /></mesh>
                {/* Tall post */}
                <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.013, 0.013, 0.42]} /><meshStandardMaterial {...pipe} /></mesh>
                {/* Long gooseneck */}
                <mesh position={[0, 0.44, 0.08]} rotation={[1.1, 0, 0]}><cylinderGeometry args={[0.011, 0.011, 0.13]} /><meshStandardMaterial {...pipe} /></mesh>
                <mesh position={[0, 0.43, 0.16]}><cylinderGeometry args={[0.01, 0.01, 0.05]} /><meshStandardMaterial {...pipe} /></mesh>
                {/* Lever */}
                <mesh position={[0.03, 0.22, 0.01]} rotation={[0, 0, 1.5]}><cylinderGeometry args={[0.005, 0.005, 0.06]} /><meshStandardMaterial color="#c0c4c8" metalness={0.8} roughness={0.2} /></mesh>
              </group>
            );

            if (tipo === 'torneira-industrial') return (
              <group key={cut.id} position={[wx, t, wz]}>
                <mesh><cylinderGeometry args={[ww/2, ww/2, 0.01, 6]} /><meshStandardMaterial color="#444" metalness={0.7} roughness={0.4} /></mesh>
                {/* Pipe post */}
                <mesh position={[0, 0.14, 0]}><cylinderGeometry args={[0.018, 0.018, 0.26]} /><meshStandardMaterial color="#555" metalness={0.6} roughness={0.5} /></mesh>
                {/* 90° elbow horizontal */}
                <mesh position={[0, 0.27, 0]} rotation={[0, 0, Math.PI/2]}><cylinderGeometry args={[0.015, 0.015, 0.12]} /><meshStandardMaterial color="#555" metalness={0.6} roughness={0.5} /></mesh>
                {/* Spout down */}
                <mesh position={[0.06, 0.24, 0]}><cylinderGeometry args={[0.012, 0.012, 0.07]} /><meshStandardMaterial color="#555" metalness={0.6} roughness={0.5} /></mesh>
                {/* Cross handles */}
                {[-0.035, 0.035].map((dx, i) => (
                  <mesh key={i} position={[dx, 0.17, 0]} rotation={[0, 0, 1.5]}>
                    <cylinderGeometry args={[0.005, 0.005, 0.05]} />
                    <meshStandardMaterial color="#666" metalness={0.5} roughness={0.5} />
                  </mesh>
                ))}
              </group>
            );

            // torneira-mono (default)
            return (
              <group key={cut.id} position={[wx, t, wz]}>
                <mesh><cylinderGeometry args={[ww/2, ww/2, 0.008, 24]} /><meshStandardMaterial {...base} /></mesh>
                <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.013, 0.013, 0.22]} /><meshStandardMaterial {...pipe} /></mesh>
                <mesh position={[0, 0.24, 0.04]} rotation={[1.1, 0, 0]}><cylinderGeometry args={[0.01, 0.01, 0.1]} /><meshStandardMaterial {...pipe} /></mesh>
                <mesh position={[0, 0.25, 0.09]}><cylinderGeometry args={[0.009, 0.009, 0.04]} /><meshStandardMaterial {...pipe} /></mesh>
                <mesh position={[0.025, 0.12, 0.01]} rotation={[0, 0, 1.5]}><cylinderGeometry args={[0.005, 0.005, 0.05]} /><meshStandardMaterial color="#c0c4c8" metalness={0.8} roughness={0.2} /></mesh>
              </group>
            );
          }

          // ── Vão: inner walls showing stone thickness ───────────────
          // Shape hole already cuts the geometry — these meshes render the
          // cut faces so the stone thickness is visible from any angle.
          if (tipo === 'vao') {
            const void_mat = { color: '#06070a', roughness: 0.95, metalness: 0 };
            const W = 0.002; // wall thickness (cosmetic only)
            return (
              <group key={cut.id} position={[wx, 0, wz]}>
                <mesh position={[0,        t / 2,  wd / 2]}><boxGeometry args={[ww,     t, W]}   /><meshStandardMaterial {...void_mat} /></mesh>
                <mesh position={[0,        t / 2, -wd / 2]}><boxGeometry args={[ww,     t, W]}   /><meshStandardMaterial {...void_mat} /></mesh>
                <mesh position={[-ww / 2,  t / 2,  0]}     ><boxGeometry args={[W,      t, wd]}  /><meshStandardMaterial {...void_mat} /></mesh>
                <mesh position={[ ww / 2,  t / 2,  0]}     ><boxGeometry args={[W,      t, wd]}  /><meshStandardMaterial {...void_mat} /></mesh>
                <mesh position={[0,        0,       0]}     ><boxGeometry args={[ww,     W, wd]}  /><meshStandardMaterial {...void_mat} /></mesh>
              </group>
            );
          }

          return null; // extras (calha, ralo, duto, nicho) → shape hole only
        })}
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
