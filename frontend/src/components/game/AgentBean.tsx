import { useState } from "react";
import { Html } from "@react-three/drei";

interface AgentBeanProps {
  position: [number, number, number];
  onClick: () => void;
  chatMessage?: string;
}

export function AgentBean({ position, onClick, chatMessage }: AgentBeanProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <group 
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Purple bean body - elongated sphere */}
      <mesh scale={[0.8, 1.2, 0.6]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial 
          color={hovered ? "#a855f7" : "#8b5cf6"} 
          roughness={0.3} 
          metalness={0.4}
          emissive={hovered ? "#7c3aed" : "#6d28d9"}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Highlight */}
      <mesh position={[0.2, 0.4, 0.3]} scale={[0.15, 0.1, 0.1]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#c4b5fd" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.2, 0.2, 0.4]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0.2, 0.2, 0.4]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Eye highlights */}
      <mesh position={[-0.17, 0.23, 0.5]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0.23, 0.23, 0.5]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Smile */}
      <mesh position={[0, -0.1, 0.45]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.15, 0.03, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#4c1d95" />
      </mesh>

      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
        <circleGeometry args={[0.7, 32]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.3} />
      </mesh>

      {/* Hover indicator */}
      {hovered && (
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
        </mesh>
      )}

      {/* Chat bubble */}
      <AgentChatBubble visible={!!chatMessage} message={chatMessage} />

      {/* Click prompt */}
      {hovered && (
        <Html position={[0, 2, 0]} center>
          <div style={{
            background: "rgba(139, 92, 246, 0.9)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontFamily: "Arial, sans-serif",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}>
            Click to chat
          </div>
        </Html>
      )}
    </group>
  );
}

function AgentChatBubble({ visible, message }: { visible: boolean; message?: string }) {
  if (!visible) return null;

  return (
    <Html position={[0, 1.8, 0]} center>
      <div style={{
        background: "white",
        padding: "8px 12px",
        borderRadius: "12px",
        border: "2px solid #8b5cf6",
        fontSize: "14px",
        fontFamily: "Arial, sans-serif",
        whiteSpace: "nowrap",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        position: "relative",
        maxWidth: "200px",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>
        <span style={{ color: "#8b5cf6", fontWeight: "bold" }}>AI</span> {message || "..."}
        <div style={{
          position: "absolute",
          bottom: "-8px",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "8px solid #8b5cf6",
        }} />
      </div>
    </Html>
  );
}
