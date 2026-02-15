import { useLoader } from "@react-three/fiber";
import { OBJLoader } from "three-stdlib";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const MODELS = [
  "BirchTree_1", "BirchTree_2", "BirchTree_3", "BirchTree_4", "BirchTree_5",
  "MapleTree_1", "MapleTree_2", "MapleTree_3", "MapleTree_4", "MapleTree_5",
  "NormalTree_1", "NormalTree_2", "NormalTree_3", "NormalTree_4", "NormalTree_5",
  "PalmTree_1", "PalmTree_2", "PalmTree_3", "PalmTree_4", "PalmTree_5",
  "PineTree_1", "PineTree_2", "PineTree_3", "PineTree_4", "PineTree_5",
  "DeadTree_1", "DeadTree_2", "DeadTree_3", "DeadTree_4", "DeadTree_5",
  "DeadTree_6", "DeadTree_7", "DeadTree_8", "DeadTree_9", "DeadTree_10",
  "Bush", "Bush_Large", "Bush_Small", "Bush_Flowers", "Bush_Large_Flowers", "Bush_Small_Flowers",
  "Grass_Large", "Grass_Large_Extruded", "Grass_Small",
  "Flower_1", "Flower_1_Clump", "Flower_2", "Flower_2_Clump", "Flower_3_Clump", "Flower_4_Clump", "Flower_5_Clump",
  "Plant_1", "Plant_2", "Plant_Flowers",
  "Petals_1", "Petals_2", "Petals_3", "Petals_4",
  "Rock_1", "Rock_2", "Rock_3", "Rock_4", "Rock_5",
];

const GREEN_MATERIAL = new THREE.MeshStandardMaterial({ 
  color: "#2d5a27",
  roughness: 0.9,
  metalness: 0.0,
  side: THREE.DoubleSide,
});

const STONE_MATERIAL = new THREE.MeshStandardMaterial({ 
  color: "#5a5a5a",
  roughness: 0.95,
  metalness: 0.1,
});

function LoadedModel({ name, position, scale = 1, rotation = 0 }: { name: string; position: [number, number, number]; scale?: number; rotation?: number }) {
  const obj = useLoader(OBJLoader, `/OBJ/${name}.obj`);
  
  useMemo(() => {
    obj.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material = GREEN_MATERIAL;
      }
    });
  }, [obj]);

  return (
    <primitive object={obj} position={position} scale={scale} rotation={[0, rotation, 0]} />
  );
}

function BigModels({ count = 400, worldSize = 120 }: { count?: number; worldSize?: number }) {
  const items = useMemo(() => {
    const result: { name: string; position: [number, number, number]; scale: number; rotation: number }[] = [];
    const safeZone = 18;

    for (let i = 0; i < count; i++) {
      let x: number, z: number;
      let attempts = 0;
      
      do {
        x = (Math.random() - 0.5) * worldSize * 2;
        z = (Math.random() - 0.5) * worldSize * 2;
        attempts++;
      } while (Math.abs(x) < safeZone && Math.abs(z) < safeZone && attempts < 25);

      if (attempts >= 25) continue;

      const modelName = MODELS[Math.floor(Math.random() * MODELS.length)];
      const scale = 1.2 + Math.random() * 1.0;
      const rotation = Math.random() * Math.PI * 2;

      result.push({
        name: modelName,
        position: [x, 0, z],
        scale,
        rotation,
      });
    }

    return result;
  }, [count, worldSize]);

  return (
    <group>
      {items.map((item, index) => (
        <LoadedModel key={index} {...item} />
      ))}
    </group>
  );
}

function Stones({ count = 400, worldSize = 120 }: { count?: number; worldSize?: number }) {
  const data = useMemo(() => {
    const positions: { x: number; z: number; scale: number }[] = [];
    const safeZone = 18;

    for (let i = 0; i < count; i++) {
      let x: number, z: number;
      let attempts = 0;
      
      do {
        x = (Math.random() - 0.5) * worldSize * 2;
        z = (Math.random() - 0.5) * worldSize * 2;
        attempts++;
      } while (Math.abs(x) < safeZone && Math.abs(z) < safeZone && attempts < 15);

      if (attempts >= 15) continue;

      const stoneScale = 0.6 + Math.random() * 1.2;
      positions.push({ x, z, scale: stoneScale });
    }
    return positions;
  }, [count, worldSize]);

  const meshRef = useRef<THREE.InstancedMesh>(null);

  useMemo(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    
    data.forEach((d, i) => {
      dummy.position.set(d.x, d.scale * 0.3, d.z);
      dummy.rotation.set(Math.random() * 0.5, Math.random() * Math.PI * 2, Math.random() * 0.5);
      dummy.scale.setScalar(d.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [data]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, data.length]} castShadow receiveShadow material={STONE_MATERIAL}>
      <dodecahedronGeometry args={[1, 0]} />
    </instancedMesh>
  );
}

function GrassPatches({ patchCount = 200, worldSize = 120 }: { patchCount?: number; worldSize?: number }) {
  const data = useMemo(() => {
    const positions: { x: number; z: number; scale: number }[] = [];
    const safeZone = 18;

    for (let i = 0; i < patchCount; i++) {
      let cx: number, cz: number;
      let attempts = 0;
      
      do {
        cx = (Math.random() - 0.5) * worldSize * 2;
        cz = (Math.random() - 0.5) * worldSize * 2;
        attempts++;
      } while (Math.abs(cx) < safeZone && Math.abs(cz) < safeZone && attempts < 20);

      if (attempts >= 20) continue;

      const bladeCount = 8 + Math.floor(Math.random() * 12);
      
      for (let j = 0; j < bladeCount; j++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.6;
        const x = cx + Math.cos(angle) * radius;
        const z = cz + Math.sin(angle) * radius;
        const scale = 0.15 + Math.random() * 0.2;
        positions.push({ x, z, scale });
      }
    }
    return positions;
  }, [patchCount, worldSize]);

  const meshRef = useRef<THREE.InstancedMesh>(null);

  useMemo(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    
    data.forEach((d, i) => {
      dummy.position.set(d.x, d.scale * 0.5, d.z);
      dummy.rotation.set(
        (Math.random() - 0.5) * 0.3,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.3
      );
      dummy.scale.set(d.scale, d.scale * 1.5, d.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [data]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, data.length]} material={GREEN_MATERIAL}>
      <coneGeometry args={[0.5, 1.5, 3]} />
    </instancedMesh>
  );
}

interface EnvironmentProps {
  worldSize?: number;
}

export function Environment({ worldSize = 120 }: EnvironmentProps) {
  return (
    <group>
      <BigModels count={400} worldSize={worldSize} />
      <Stones count={400} worldSize={worldSize} />
      <GrassPatches patchCount={200} worldSize={worldSize} />
    </group>
  );
}
