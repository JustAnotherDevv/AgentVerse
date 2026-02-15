import { useMemo } from "react";

const MODELS = [
  "BirchTree", "MapleTree", "NormalTree", "PalmTree", "PineTree", "DeadTree",
  "Bush", "Bush_Large", "Bush_Small", "Bush_Flowers",
];

function TreeModel({ type, position, scale, rotation }: { type: string; position: [number, number, number]; scale: number; rotation: number }) {
  const isPalm = type.includes("Palm");
  const isPine = type.includes("Pine");
  const isDead = type.includes("Dead");
  const isBush = type.includes("Bush");

  const trunkColor = isDead ? "#3d2817" : "#5c4033";
  const leafColor = isDead ? "#4a3728" : 
                    isPalm ? "#228b22" : 
                    isBush ? "#2d5a27" : "#2d5a27";

  const s = scale * 3;

  if (isBush) {
    return (
      <group position={position} rotation={[0, rotation, 0]} scale={s}>
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.6, 6, 5]} />
          <meshStandardMaterial color={leafColor} roughness={0.9} />
        </mesh>
        <mesh position={[0.3, 0.25, 0.2]} castShadow receiveShadow>
          <sphereGeometry args={[0.4, 5, 4]} />
          <meshStandardMaterial color={leafColor} roughness={0.9} />
        </mesh>
        <mesh position={[-0.25, 0.2, -0.2]} castShadow receiveShadow>
          <sphereGeometry args={[0.35, 5, 4]} />
          <meshStandardMaterial color={leafColor} roughness={0.9} />
        </mesh>
      </group>
    );
  }

  if (isPalm) {
    return (
      <group position={position} rotation={[0, rotation, 0]} scale={s}>
        <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.08, 0.12, 1.6, 6]} />
          <meshStandardMaterial color={trunkColor} roughness={0.9} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh 
            key={i} 
            position={[
              Math.cos(i * Math.PI / 3) * 0.3, 
              1.5, 
              Math.sin(i * Math.PI / 3) * 0.3
            ]} 
            rotation={[0.4, i * Math.PI / 3, 0]}
            castShadow
          >
            <boxGeometry args={[0.08, 1.2, 0.02]} />
            <meshStandardMaterial color={leafColor} roughness={0.8} />
          </mesh>
        ))}
      </group>
    );
  }

  if (isPine) {
    return (
      <group position={position} rotation={[0, rotation, 0]} scale={s}>
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.1, 0.15, 1, 6]} />
          <meshStandardMaterial color={trunkColor} roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <coneGeometry args={[0.7, 1.2, 6]} />
          <meshStandardMaterial color={leafColor} roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
          <coneGeometry args={[0.5, 1, 6]} />
          <meshStandardMaterial color={leafColor} roughness={0.8} />
        </mesh>
        <mesh position={[0, 2.3, 0]} castShadow receiveShadow>
          <coneGeometry args={[0.3, 0.8, 6]} />
          <meshStandardMaterial color={leafColor} roughness={0.8} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={s}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.12, 1.2, 6]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial color={leafColor} roughness={0.8} />
      </mesh>
      <mesh position={[0.3, 1.2, 0.2]} rotation={[0.2, 0.5, 0.1]} castShadow>
        <dodecahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial color={leafColor} roughness={0.8} />
      </mesh>
      <mesh position={[-0.25, 1.3, -0.15]} rotation={[-0.1, -0.3, 0.1]} castShadow>
        <dodecahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color={leafColor} roughness={0.8} />
      </mesh>
    </group>
  );
}

function TreesAndBushes({ count = 600, worldSize = 120 }: { count?: number; worldSize?: number }) {
  const items = useMemo(() => {
    const result: { type: string; x: number; z: number; scale: number; ry: number }[] = [];
    const safeZone = 20;

    for (let i = 0; i < count; i++) {
      let x = 0, z = 0;
      let attempts = 0;
      
      while (attempts < 20) {
        x = (Math.random() - 0.5) * worldSize * 2;
        z = (Math.random() - 0.5) * worldSize * 2;
        if (!(Math.abs(x) < safeZone && Math.abs(z) < safeZone)) break;
        attempts++;
      }

      if (attempts >= 20) continue;

      const type = MODELS[Math.floor(Math.random() * MODELS.length)];
      const scale = 0.6 + Math.random() * 0.8;

      result.push({ 
        type,
        x, 
        z, 
        scale,
        ry: Math.random() * Math.PI * 2
      });
    }
    return result;
  }, [count, worldSize]);

  return (
    <group>
      {items.map((item, i) => (
        <TreeModel key={i} type={item.type} position={[item.x, 0, item.z]} scale={item.scale} rotation={item.ry} />
      ))}
    </group>
  );
}

function StonesSimple({ count = 500, worldSize = 120 }: { count?: number; worldSize?: number }) {
  const stones = useMemo(() => {
    const result: { x: number; z: number; scale: number; rx: number; ry: number; rz: number }[] = [];
    const safeZone = 20;

    for (let i = 0; i < count; i++) {
      let x = 0, z = 0;
      let attempts = 0;
      
      while (attempts < 15) {
        x = (Math.random() - 0.5) * worldSize * 2;
        z = (Math.random() - 0.5) * worldSize * 2;
        if (!(Math.abs(x) < safeZone && Math.abs(z) < safeZone)) break;
        attempts++;
      }

      const stoneScale = (0.3 + Math.random() * 0.6) * 2;
      result.push({ 
        x, 
        z, 
        scale: stoneScale,
        rx: Math.random() * 0.4,
        ry: Math.random() * Math.PI * 2,
        rz: Math.random() * 0.4
      });
    }
    return result;
  }, [count, worldSize]);

  return (
    <group>
      {stones.map((stone, i) => (
        <mesh 
          key={i} 
          position={[stone.x, stone.scale * 0.3, stone.z]} 
          rotation={[stone.rx, stone.ry, stone.rz]}
          scale={stone.scale}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#5a5a5a" roughness={0.95} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

function GrassSimple({ count = 1000, worldSize = 100 }: { count?: number; worldSize?: number }) {
  const grass = useMemo(() => {
    const result: { x: number; z: number; scale: number; ry: number }[] = [];
    const safeZone = 18;

    for (let i = 0; i < count; i++) {
      let x = 0, z = 0;
      let attempts = 0;
      
      while (attempts < 10) {
        x = (Math.random() - 0.5) * worldSize * 2;
        z = (Math.random() - 0.5) * worldSize * 2;
        if (!(Math.abs(x) < safeZone && Math.abs(z) < safeZone)) break;
        attempts++;
      }

      const scale = 0.05 + Math.random() * 0.1;
      result.push({ 
        x, 
        z, 
        scale,
        ry: Math.random() * Math.PI * 2
      });
    }
    return result;
  }, [count, worldSize]);

  return (
    <group>
      {grass.map((blade, i) => (
        <mesh 
          key={i} 
          position={[blade.x, blade.scale * 0.5, blade.z]} 
          rotation={[0, blade.ry, 0]}
          scale={[blade.scale, blade.scale * 1.5, blade.scale]}
        >
          <coneGeometry args={[0.4, 1.2, 4]} />
          <meshStandardMaterial color="#3d7a2d" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export function EnvironmentSimple({ worldSize = 120 }: { worldSize?: number }) {
  return (
    <group>
      <TreesAndBushes count={600} worldSize={worldSize} />
      <StonesSimple count={500} worldSize={worldSize} />
      <GrassSimple count={800} worldSize={worldSize} />
    </group>
  );
}
