import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Grid } from '@react-three/drei';
import { ProjectType, CountertopConfig, StaircaseConfig, StoneMaterial } from '../types';
import BancadaModel from './BancadaModel';
import EscadaModel from './EscadaModel';

interface ThreeViewProps {
  type: ProjectType;
  countertop: CountertopConfig;
  staircase: StaircaseConfig;
  material: StoneMaterial;
  autoRotate: boolean;
}

export default function ThreeView({
  type,
  countertop,
  staircase,
  material,
  autoRotate,
}: ThreeViewProps) {
  // Center heights depending on object types
  const objectPositionY = type === 'pia' ? 0.2 : -0.2;

  return (
    <div className="w-full h-full relative bg-[#090a0f] rounded-2xl overflow-hidden border border-white/5 shadow-inner">
      
      {/* Three.js Rendering Canvas */}
      <Canvas
        shadows
        camera={{ position: [2.5, 2.5, 2.5], fov: 45 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }} // preserveDrawingBuffer enables canvas screenshot exports!
      >
        {/* Soft background tone resembling premium studio lighting */}
        <color attach="background" args={['#08090d']} />
        
        {/* Realism Environment Probes (City reflections look gorgeous on polished marble) */}
        <Environment preset="city" />

        {/* Ambient surrounding illumination */}
        <ambientLight intensity={0.5} />
        
        {/* Direct specular key light with shadow support */}
        <directionalLight
          position={[5, 12, 4]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0001}
        />
        
        {/* Rim back light for visual separation */}
        <pointLight position={[-10, 5, -10]} intensity={0.6} />

        {/* Selected Project 3D Model Group */}
        <group position={[0, objectPositionY, 0]}>
          {type === 'pia' ? (
            <BancadaModel config={countertop} material={material} />
          ) : (
            <EscadaModel config={staircase} material={material} />
          )}

          {/* Precision floor grid helper to ground the stone in spatial context */}
          <Grid
            renderOrder={-1}
            position={[0, -0.805, 0]}
            args={[15, 15]}
            cellSize={0.2}
            cellThickness={0.5}
            cellColor="#1e293b"
            sectionSize={1.0}
            sectionThickness={1.0}
            sectionColor="#334155"
            fadeDistance={10}
            infiniteGrid
          />
        </group>

        {/* Soft Contact ground ambient shadows */}
        <ContactShadows
          position={[0, -0.8, 0]}
          opacity={0.65}
          scale={8}
          blur={1.8}
          far={3.5}
          color="#000000"
        />

        {/* High performance touch & scroll navigation */}
        <OrbitControls
          makeDefault
          autoRotate={autoRotate}
          autoRotateSpeed={1.5}
          minDistance={1.2}
          maxDistance={8.0}
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI / 2 + 0.05} // prevents camera from going underground
        />
      </Canvas>

      {/* Control hints overlay */}
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-[10px] text-gray-400 font-mono flex gap-3 pointer-events-none select-none">
        <span>🖱️ Click+Arrastar: Girar</span>
        <span>•</span>
        <span>📜 Scroll: Zoom</span>
        <span>•</span>
        <span>🛠️ Shift+Arraste: Pan</span>
      </div>

      {/* Real scale flag */}
      <div className="absolute bottom-4 left-4 bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-semibold text-emerald-400 flex items-center gap-1.5 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Previsão em Escala Real e 3D Ativo
      </div>

    </div>
  );
}
