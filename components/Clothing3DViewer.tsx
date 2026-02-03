import React, { Suspense, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF, Stage, OrbitControls, useProgress, Html } from '@react-three/drei';
import { Camera, RotateCw, Loader2 } from 'lucide-react';
import * as THREE from 'three';

interface Clothing3DViewerProps {
  url: string;
  onCapture: (base64Image: string) => void;
}

// Custom Loader Component for Progressive Loading UX
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6 rounded-lg border border-slate-700 shadow-2xl min-w-[120px]">
        <Loader2 className="w-8 h-8 animate-spin text-white mb-3" strokeWidth={1.5} />
        <span className="text-xs font-bold text-white tracking-widest">{progress.toFixed(0)}%</span>
        <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Optimizing Assets</span>
      </div>
    </Html>
  );
}

// Internal component to handle scene logic and capture
const SceneContent = ({ url, captureTrigger, onCapture }: { url: string, captureTrigger: number, onCapture: (data: string) => void }) => {
  const { gl, scene, camera } = useThree();
  const { scene: modelScene } = useGLTF(url);
  const controlsRef = useRef<any>(null);

  // Enhance Materials for Realistic Fabric Look
  useLayoutEffect(() => {
    modelScene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;

        // Enhance texture quality and fabric logic
        if (obj.material) {
           const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
           materials.forEach((mat) => {
             if (mat instanceof THREE.MeshStandardMaterial) {
               // Render both sides so clothing doesn't look like thin paper
               mat.side = THREE.DoubleSide;
               
               // Increase texture sharpness at oblique angles
               if (mat.map) mat.map.anisotropy = gl.capabilities.getMaxAnisotropy();
               if (mat.normalMap) mat.normalMap.anisotropy = gl.capabilities.getMaxAnisotropy();
               if (mat.roughnessMap) mat.roughnessMap.anisotropy = gl.capabilities.getMaxAnisotropy();

               // Balance reflection to look like fabric, not plastic
               mat.envMapIntensity = 0.8;
               
               // Ensure there is some roughness so it isn't too glossy (unless specifically defined)
               // If the model comes with roughness 1 (default), we might want to keep it, 
               // but often unconfigured models are too smooth (0.5).
               // We trust the model's map if it exists, otherwise bias towards fabric.
               if (!mat.roughnessMap && mat.roughness < 0.3) {
                  mat.roughness = 0.6; 
               }
             }
           });
        }
      }
    });
  }, [modelScene, gl]);

  // Handle Capture Request
  useEffect(() => {
    if (captureTrigger > 0) {
      // Force a render to ensure the frame is ready
      gl.render(scene, camera);
      const dataUrl = gl.domElement.toDataURL('image/png');
      onCapture(dataUrl);
    }
  }, [captureTrigger, gl, scene, camera, onCapture]);

  // Cleanup/Cache Management: Clear cache when url changes to manage memory
  useEffect(() => {
    return () => {
      useGLTF.clear(url);
    };
  }, [url]);

  // Configure controls via ref to avoid prop type issues
  useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      controls.minDistance = 0.5;
      controls.maxDistance = 10;
      controls.zoomSpeed = 0.8;
      controls.rotateSpeed = 0.6;
      controls.minPolarAngle = 0;
      controls.maxPolarAngle = Math.PI / 1.9;
      controls.enableZoom = true;
      controls.enablePan = true;
    }
  }, []);

  return (
    <>
      <Stage 
        environment="city" 
        intensity={0.7} 
        adjustCamera={1.2}
        preset="rembrandt" // More dramatic, studio-like lighting
        shadows={{ type: 'contact', opacity: 0.6, blur: 2.5 }} // Soft contact shadows
      >
        {/* @ts-ignore */}
        <primitive object={modelScene} />
      </Stage>
      <OrbitControls 
        ref={controlsRef}
        makeDefault 
      />
    </>
  );
};

export const Clothing3DViewer: React.FC<Clothing3DViewerProps> = ({ url, onCapture }) => {
  const [captureTrigger, setCaptureTrigger] = useState(0);

  const handleCapture = (e: React.MouseEvent) => {
    e.preventDefault();
    setCaptureTrigger(prev => prev + 1);
  };

  return (
    <div className="w-full h-full relative group bg-gradient-to-b from-slate-900 to-black border border-slate-800 overflow-hidden">
       {/* Header Label */}
       <div className="absolute top-3 left-3 z-10 bg-black/60 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm backdrop-blur-sm flex items-center gap-2 border border-white/10">
         <RotateCw size={10} />
         <span>High Fidelity 3D</span>
       </div>

       <Canvas 
         gl={{ 
           preserveDrawingBuffer: true, 
           antialias: true,
           toneMapping: THREE.ACESFilmicToneMapping,
           toneMappingExposure: 1.1
         }} 
         shadows 
         dpr={[1, 2]} // Handle high-DPI screens
         camera={{ fov: 45 }} // Slightly more cinematic FOV
         className="w-full h-full cursor-move"
       >
         <Suspense fallback={<Loader />}>
            <SceneContent url={url} captureTrigger={captureTrigger} onCapture={onCapture} />
         </Suspense>
       </Canvas>
       
       {/* Capture Button */}
       <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10 pointer-events-none">
         <button
           onClick={handleCapture}
           className="pointer-events-auto bg-white hover:bg-slate-200 text-black px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-white/20 font-bold text-xs uppercase tracking-widest"
         >
           <Camera size={14} />
           Capture View
         </button>
       </div>
       
       {/* Instructions Overlay */}
       <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
         <div className="bg-black/90 p-3 rounded-sm border border-slate-700 shadow-xl text-[10px] text-slate-300 w-40 backdrop-blur-md">
           <p className="flex justify-between mb-1"><span>Rotate</span> <span className="text-slate-500">Drag</span></p>
           <p className="flex justify-between mb-1"><span>Zoom</span> <span className="text-slate-500">Scroll / Pinch</span></p>
           <p className="flex justify-between"><span>Pan</span> <span className="text-slate-500">Right Click</span></p>
         </div>
       </div>
    </div>
  );
};