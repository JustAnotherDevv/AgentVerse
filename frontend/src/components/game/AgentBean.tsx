import { useState, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface AgentBeanProps {
  id: string;
  name: string;
  position: { x: number; y: number };
  avatar: { color: string; emoji: string; shape: 'circle' | 'square' | 'bean' | 'star'; };
  personality?: { mood: string; };
  stats?: { reputation: number; totalEarnings: number; tasksCompleted: number; };
  skills?: { name: string; level: number; }[];
  onClick: () => void;
  isSelected?: boolean;
}

export function AgentBean({ name, position, avatar, onClick, isSelected }: AgentBeanProps) {
  const [hovered, setHovered] = useState(false);
  const scale = (hovered ? 1.1 : isSelected ? 1.05 : 1) * 2.5;
  
  const currentPosRef = useRef(new THREE.Vector3(position.x, 0, position.y));
  const targetPosRef = useRef(new THREE.Vector3(position.x, 0, position.y));
  const speedRef = useRef(3 + Math.random() * 2);
  const rotationRef = useRef(Math.random() * Math.PI * 2);
  
  const [renderPosition, setRenderPosition] = useState<[number, number, number]>([position.x, 0, position.y]);
  const [renderRotation, setRenderRotation] = useState(0);

  useEffect(() => {
    targetPosRef.current.set(position.x, 0, position.y);
  }, [position]);

  useFrame((_, delta) => {
    const current = currentPosRef.current;
    const target = targetPosRef.current;
    
    const dx = target.x - current.x;
    const dz = target.z - current.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist > 0.1) {
      const speed = speedRef.current;
      const moveX = (dx / dist) * speed * delta;
      const moveZ = (dz / dist) * speed * delta;
      
      current.x += moveX;
      current.z += moveZ;
      
      rotationRef.current = Math.atan2(dx, dz);
      
      setRenderPosition([current.x, current.y, current.z]);
      setRenderRotation(rotationRef.current);
    }
  });

  return (
    <group 
      position={renderPosition}
      rotation={[0, renderRotation, 0]}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={scale}
    >
      <mesh rotation={[0, 0, 0.2]} castShadow>
        <capsuleGeometry args={[0.4, 0.8, 8, 16]} />
        <meshStandardMaterial color={avatar.color} roughness={0.4} metalness={0.3} />
      </mesh>
      
      <mesh position={[0, 0.85, 0]} rotation={[0, 0, 0.2]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color={avatar.color} roughness={0.4} metalness={0.3} />
      </mesh>
      
      <Html position={[0, 2.2, 0]} center style={{ zIndex: 1 }}>
        <div style={{
          background: isSelected ? 'rgba(251, 191, 36, 0.9)' : 'rgba(212, 168, 87, 0.9)',
          color: "white",
          padding: "4px 12px",
          borderRadius: "12px",
          fontSize: "12px",
          fontFamily: "Arial, sans-serif",
          whiteSpace: "nowrap",
          fontWeight: "bold",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          border: isSelected ? "2px solid white" : "none",
        }}>
          {avatar.emoji} {name}
        </div>
      </Html>

      {hovered && !isSelected && (
        <Html position={[0, 3.2, 0]} center style={{ zIndex: 1 }}>
          <div style={{
            background: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "10px",
            fontFamily: "Arial, sans-serif",
          }}>
            Click to chat
          </div>
        </Html>
      )}
    </group>
  );
}
