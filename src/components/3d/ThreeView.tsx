import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Grid } from '@react-three/drei';
import { PCFShadowMap } from 'three';
import { ProjectType, CountertopConfig, StaircaseConfig, StoneMaterial, get3DModel } from '../../types';
import BancadaModel from './BancadaModel';
import BancadaLModel from './BancadaLModel';
import BancadaUModel from './BancadaUModel';
import EscadaModel from './EscadaModel';
import SlabModel from './SlabModel';
import WallPanelModel from './WallPanelModel';
import FloorModel from './FloorModel';
import BathroomModel from './BathroomModel';
import CommercialModel from './CommercialModel';
import ServiceModel from './ServiceModel';

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
  const model3D = get3DModel(type)

  const objectPositionY =
    model3D === 'escada'     ? -0.2
    : model3D === 'wall'     ? -0.35
    : model3D === 'commercial' ? -0.55
    : model3D === 'bathroom'   ? -0.1
    : 0.2

  return (
    <div className="absolute inset-0 bg-[#090a0f] rounded-2xl overflow-hidden border border-white/5 shadow-inner">

      <Canvas
        shadows={{ type: PCFShadowMap }}
        camera={{ position: [2.5, 2.5, 2.5], fov: 45 }}
        gl={{ preserveDrawingBuffer: true, antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#08090d']} />
        <Environment preset="city" />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 12, 4]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0001}
        />
        <pointLight position={[-10, 5, -10]} intensity={0.6} />

        <group position={[0, objectPositionY, 0]}>
          {model3D === 'bancada'    && <BancadaModel config={countertop} material={material} />}
          {model3D === 'bancada_l'  && <BancadaLModel config={countertop} material={material} />}
          {model3D === 'bancada_u'  && <BancadaUModel config={countertop} material={material} />}
          {model3D === 'escada'     && <EscadaModel config={staircase} material={material} />}
          {model3D === 'slab'       && <SlabModel type={type} config={countertop} material={material} />}
          {model3D === 'wall'       && <WallPanelModel type={type} config={countertop} material={material} />}
          {model3D === 'floor'      && <FloorModel config={countertop} material={material} />}
          {model3D === 'bathroom'   && <BathroomModel type={type} config={countertop} material={material} />}
          {model3D === 'commercial' && <CommercialModel type={type} config={countertop} material={material} />}
          {model3D === 'service'    && <ServiceModel type={type} config={countertop} material={material} />}

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

        <ContactShadows
          position={[0, -0.8, 0]}
          opacity={0.65}
          scale={8}
          blur={1.8}
          far={3.5}
          color="#000000"
        />

        <OrbitControls
          makeDefault
          autoRotate={autoRotate}
          autoRotateSpeed={1.5}
          minDistance={1.2}
          maxDistance={8.0}
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI / 2 + 0.05}
        />
      </Canvas>

      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-[10px] text-gray-400 font-mono flex gap-3 pointer-events-none select-none">
        <span>🖱️ Click+Arrastar: Girar</span>
        <span>•</span>
        <span>📜 Scroll: Zoom</span>
        <span>•</span>
        <span>🛠️ Shift+Arraste: Pan</span>
      </div>

      <div className="absolute bottom-4 left-4 bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-semibold text-emerald-400 flex items-center gap-1.5 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Previsão em Escala Real e 3D Ativo
      </div>
    </div>
  );
}
