import * as THREE from "three";
import { useMemo } from "react";

interface GridGroundProps {
  onPlaneClick?: (point: THREE.Vector3) => void;
}

function ProceduralGround({ onPlaneClick }: GridGroundProps) {
  const groundMaterial = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#3d5c2d';
    ctx.fillRect(0, 0, 256, 256);
    
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = Math.random() * 3;
      const shade = Math.floor(Math.random() * 30) - 15;
      ctx.fillStyle = `rgb(${60 + shade}, ${90 + shade}, ${40 + shade})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(100, 100);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;
    
    return new THREE.MeshStandardMaterial({ 
      map: texture,
      roughness: 0.95,
      metalness: 0.0,
    });
  }, []);

  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.02, 0]}
      onPointerDown={(e: any) => {
        e.stopPropagation();
        onPlaneClick?.(e.point);
      }}
      receiveShadow
    >
      <planeGeometry args={[1000, 1000]} />
      <primitive object={groundMaterial} attach="material" />
    </mesh>
  );
}

export function GridGround({ onPlaneClick }: GridGroundProps) {
  return (
    <ProceduralGround onPlaneClick={onPlaneClick} />
  );
}
