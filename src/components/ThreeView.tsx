import { useRef, useEffect, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { ProjectType, CountertopConfig, StaircaseConfig, StoneMaterial } from '../types';
import BancadaModel from './BancadaModel';
import EscadaModel from './EscadaModel';

interface ThreeViewProps {
  type: ProjectType;
  countertop: CountertopConfig;
  staircase: StaircaseConfig;
  material: StoneMaterial;
  autoRotate: boolean;
  readOnly?: boolean;
}

// ── Computes model bounding box from vertices or width/depth ──────────────
function modelBounds(type: ProjectType, ct: CountertopConfig, sc: StaircaseConfig) {
  if (type === 'pia') {
    let w = ct.width / 100, d = ct.depth / 100;
    if (ct.vertices && ct.vertices.length >= 3) {
      const xs = ct.vertices.map(v => v.x), ys = ct.vertices.map(v => v.y);
      w = (Math.max(...xs) - Math.min(...xs)) / 100;
      d = (Math.max(...ys) - Math.min(...ys)) / 100;
    }
    return { w, d, h: ct.thickness / 100, diag: Math.sqrt(w * w + d * d) };
  } else {
    const w = sc.stepWidth / 100;
    const l = sc.stepsCount * sc.stepDepth / 100;
    const h = sc.stepsCount * sc.stepHeight / 100;
    return { w, d: l, h, diag: Math.sqrt(w * w + l * l + h * h) };
  }
}

// ── Smooth camera controller that resets to optimal view ─────────────────
interface CameraControllerProps {
  diag: number;
  type: ProjectType;
  onReady: (reset: () => void) => void;
}

function CameraController({ diag, type, onReady }: CameraControllerProps) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const targetPos = useRef(new THREE.Vector3());
  const isResetting = useRef(false);
  const resetAlpha = useRef(0);

  const getIdealCamera = useCallback(() => {
    const dist = Math.max(diag * 1.8, 2.0);
    return {
      pos: new THREE.Vector3(dist * 0.65, dist * 0.55, dist * 0.85),
      target: new THREE.Vector3(0, 0.05, 0),
    };
  }, [diag]);

  // Set initial camera on mount
  useEffect(() => {
    const ideal = getIdealCamera();
    camera.position.copy(ideal.pos);
    if (controlsRef.current) {
      controlsRef.current.target.copy(ideal.target);
      controlsRef.current.update();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // Expose reset function to parent
  useEffect(() => {
    const reset = () => {
      const ideal = getIdealCamera();
      targetPos.current.copy(ideal.pos);
      isResetting.current = true;
      resetAlpha.current = 0;
    };
    onReady(reset);
  }, [getIdealCamera, onReady]);

  // Smooth animation frame
  useFrame((_, delta) => {
    if (!isResetting.current || !controlsRef.current) return;
    resetAlpha.current = Math.min(1, resetAlpha.current + delta * 3);
    camera.position.lerp(targetPos.current, 0.12);
    const ideal = getIdealCamera();
    controlsRef.current.target.lerp(ideal.target, 0.12);
    controlsRef.current.update();
    if (resetAlpha.current >= 1) isResetting.current = false;
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      autoRotate={false}
      autoRotateSpeed={1.5}
      enableDamping
      dampingFactor={0.06}
      minDistance={0.4}
      maxDistance={Math.max(diag * 5, 12)}
      minPolarAngle={0.05}
      maxPolarAngle={Math.PI / 2 + 0.1}
      target={[0, 0.05, 0]}
    />
  );
}

// ── Main ThreeView ────────────────────────────────────────────────────────
export default function ThreeView({
  type, countertop, staircase, material, autoRotate, readOnly = false,
}: ThreeViewProps) {
  const bounds = modelBounds(type, countertop, staircase);
  const resetRef = useRef<() => void>(() => {});
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;

  return (
    <div className="w-full h-full relative bg-[#090a0f] rounded-2xl overflow-hidden border border-white/5 shadow-inner">

      <Canvas
        shadows
        camera={{ position: [3, 2.5, 3.5], fov: 50 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <color attach="background" args={['#08090d']} />
        <Environment preset="city" />
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[6, 14, 5]} intensity={1.3}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
          shadow-camera-near={0.1}
          shadow-camera-far={50}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
        />
        <pointLight position={[-8, 6, -8]} intensity={0.5} />
        <pointLight position={[ 8, 4,  8]} intensity={0.3} color="#b8c8ff" />

        <group position={[0, type === 'pia' ? 0 : -0.2, 0]}>
          {type === 'pia'
            ? <BancadaModel config={countertop} material={material} />
            : <EscadaModel  config={staircase}  material={material} />
          }
          <Grid
            renderOrder={-1}
            position={[0, -0.01, 0]}
            args={[20, 20]}
            cellSize={0.2}
            cellThickness={0.4}
            cellColor="#1a2540"
            sectionSize={1.0}
            sectionThickness={0.8}
            sectionColor="#263450"
            fadeDistance={12}
            infiniteGrid
          />
        </group>

        <ContactShadows
          position={[0, -0.01, 0]}
          opacity={0.55}
          scale={Math.max(bounds.diag * 4, 10)}
          blur={2.2}
          far={2}
          color="#000000"
        />

        <CameraController
          diag={bounds.diag}
          type={type}
          onReady={(fn) => { resetRef.current = fn; }}
        />
      </Canvas>

      {/* Top-left info strip */}
      <div className="absolute top-3 left-3 flex gap-1.5 pointer-events-none select-none">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg text-[9px] text-zinc-400 font-mono">
          Girar: arrastar  ·  Zoom: scroll  ·  Pan: shift+arrastar
        </div>
      </div>

      {/* Reset camera button */}
      {!readOnly && (
        <button
          onClick={() => resetRef.current?.()}
          title="Resetar câmera"
          className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/30 transition-all cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
        </button>
      )}

      {/* Scale badge */}
      <div className="absolute bottom-3 left-3 bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-semibold text-emerald-400 flex items-center gap-1.5 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Escala Real · 3D Ativo
      </div>

      {/* Model dimensions badge */}
      <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-[9px] font-mono text-zinc-400 pointer-events-none">
        {type === 'pia'
          ? `${countertop.width} × ${countertop.depth} × ${countertop.thickness} cm`
          : `${staircase.stepsCount} degraus · ${staircase.stepWidth}cm`
        }
      </div>

    </div>
  );
}
