import { useState } from "react";
import { Html } from "@react-three/drei";

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
  const scale = hovered ? 1.1 : isSelected ? 1.05 : 1;

  return (
    <group 
      position={[position.x, 0, position.y]}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={scale}
    >
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={avatar.color} roughness={0.3} metalness={0.4} />
      </mesh>
      
      <Html position={[0, 1.5, 0]} center>
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
        <Html position={[0, 2.5, 0]} center>
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
