import { useState, useRef, useEffect } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface AgentBeanProps {
  id: string;
  name: string;
  position: { x: number; y: number };
  avatar: {
    color: string;
    emoji: string;
    shape: 'circle' | 'square' | 'bean' | 'star';
  };
  personality: {
    mood: string;
  };
  onClick: () => void;
  chatMessage?: string;
  isSelected?: boolean;
}

export function AgentBean({ name, position, avatar, personality, onClick, chatMessage, isSelected }: AgentBeanProps) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3(position.x, 1, position.y));
  const prevPos = useRef(`${position.x},${position.y}`);

  useEffect(() => {
    const key = `${position.x},${position.y}`;
    if (prevPos.current !== key) {
      console.log(`🚶 ${name} moving to:`, position.x, position.y);
      prevPos.current = key;
    }
    targetPos.current.set(position.x, 1, position.y);
  }, [position.x, position.y, name]);

  useFrame(() => {
    if (groupRef.current) {
      const dist = groupRef.current.position.distanceTo(targetPos.current);
      if (dist > 0.01) {
        groupRef.current.position.lerp(targetPos.current, 0.1);
      }
    }
  });

  const getColor = () => {
    if (hovered) return avatar.color;
    if (isSelected) return '#fbbf24'; // gold when selected
    return avatar.color;
  };

  const getScale = () => {
    if (hovered) return 1.2;
    if (isSelected) return 1.1;
    return 1;
  };

  return (
    <group 
      ref={groupRef}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={getScale()}
    >
      {/* Body based on shape */}
      {avatar.shape === 'bean' && (
        <mesh scale={[0.8, 1.2, 0.6]}>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshStandardMaterial 
            color={getColor()} 
            roughness={0.3} 
            metalness={0.4}
            emissive={getColor()}
            emissiveIntensity={hovered ? 0.3 : 0.15}
          />
        </mesh>
      )}
      
      {(avatar.shape === 'circle' || avatar.shape === 'star') && (
        <mesh>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshStandardMaterial 
            color={getColor()} 
            roughness={0.3} 
            metalness={0.4}
            emissive={getColor()}
            emissiveIntensity={hovered ? 0.3 : 0.15}
          />
        </mesh>
      )}

      {avatar.shape === 'square' && (
        <mesh>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial 
            color={getColor()} 
            roughness={0.3} 
            metalness={0.4}
            emissive={getColor()}
            emissiveIntensity={hovered ? 0.3 : 0.15}
          />
        </mesh>
      )}
      
      {/* Highlight */}
      <mesh position={[0.2, 0.4, 0.3]} scale={[0.15, 0.1, 0.1]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} metalness={0.5} opacity={0.5} transparent />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.2, 0.2, 0.55]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0.2, 0.2, 0.55]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Eye highlights */}
      <mesh position={[-0.17, 0.23, 0.65]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0.23, 0.23, 0.65]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Smile */}
      <mesh position={[0, -0.1, 0.5]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.15, 0.03, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#4c1d95" />
      </mesh>

      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
        <circleGeometry args={[0.7, 32]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.3} />
      </mesh>

      {/* Status indicator */}
      <mesh position={[0.5, 0.8, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial 
          color={personality.mood === 'happy' ? '#22c55e' : personality.mood === 'thinking' ? '#3b82f6' : '#f59e0b'} 
          emissive={personality.mood === 'happy' ? '#22c55e' : personality.mood === 'thinking' ? '#3b82f6' : '#f59e0b'}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Name tag */}
      <Html position={[0, 1.8, 0]} center>
        <div style={{
          background: isSelected ? 'rgba(251, 191, 36, 0.9)' : 'rgba(139, 92, 246, 0.9)',
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

      {/* Hover indicator */}
      {hovered && (
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.8} />
        </mesh>
      )}

      {/* Chat bubble */}
      <AgentChatBubble visible={!!chatMessage} message={chatMessage} />

      {/* Click prompt */}
      {hovered && !isSelected && (
        <Html position={[0, 2.3, 0]} center>
          <div style={{
            background: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "10px",
            fontFamily: "Arial, sans-serif",
            whiteSpace: "nowrap",
          }}>
            Click to chat
          </div>
        </Html>
      )}
    </group>
  );
}

function AgentChatBubble({ visible, message }: { visible: boolean; message?: string }) {
  if (!visible || !message) return null;

  return (
    <Html position={[0, 1.8, 0]} center>
      <div style={{
        background: "white",
        padding: "10px 14px",
        borderRadius: "14px",
        border: "2px solid #8b5cf6",
        fontSize: "14px",
        fontFamily: "Arial, sans-serif",
        boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
        position: "relative",
        maxWidth: "300px",
        minWidth: "80px",
        width: "auto",
        maxHeight: "120px",
        overflowY: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        animation: "fadeIn 0.2s ease-out",
      }}>
        {message}
        <div style={{
          position: "absolute",
          bottom: "-10px",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderTop: "10px solid #8b5cf6",
        }} />
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Html>
  );
}
