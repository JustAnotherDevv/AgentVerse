import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ChatBubble } from "./ChatBubble";

const CUBE_COLORS = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

const CHAT_MESSAGES = [
  "Hello!",
  "Nice day!",
  "Howdy!",
  "What's up?",
  "Hey there!",
  "Hi!",
  "Yo!",
  "Greetings!",
  "Sup?",
  "Hey!",
];

interface CubeProps {
  id: number;
  position: THREE.Vector3;
  color: string;
  onPositionChange: (id: number, position: THREE.Vector3) => void;
  otherCubes: Map<number, THREE.Vector3>;
  chatMessage?: string;
}

export function Cube({ id, position, color, onPositionChange, otherCubes, chatMessage }: CubeProps) {
  const positionRef = useRef(position.clone());
  const targetRef = useRef(new THREE.Vector3(
    (Math.random() - 0.5) * 80,
    0.5,
    (Math.random() - 0.5) * 80
  ));
  const rotationRef = useRef(Math.random() * Math.PI * 2);
  const speedRef = useRef(2 + Math.random() * 2);
  const initializedRef = useRef(false);

  const [renderPosition, setRenderPosition] = useState<[number, number, number]>([position.x, position.y, position.z]);
  const [renderRotation, setRenderRotation] = useState(0);

  useEffect(() => {
    positionRef.current.copy(position);
    rotationRef.current = Math.random() * Math.PI * 2;
    speedRef.current = 2 + Math.random() * 2;
    initializedRef.current = true;
  }, [position]);

  useFrame((_, delta) => {
    if (!initializedRef.current) return;

    const pos = positionRef.current;
    const target = targetRef.current;

    let dx = target.x - pos.x;
    let dz = target.z - pos.z;
    let dist = Math.sqrt(dx * dx + dz * dz);

    const avoidanceRadius = 3;
    const avoidanceStrength = 5;
    
    otherCubes.forEach((otherPos, otherId) => {
      if (otherId === id) return;
      
      const ax = pos.x - otherPos.x;
      const az = pos.z - otherPos.z;
      const avoidDist = Math.sqrt(ax * ax + az * az);
      
      if (avoidDist < avoidanceRadius && avoidDist > 0) {
        const force = (avoidanceRadius - avoidDist) / avoidanceRadius * avoidanceStrength;
        dx += (ax / avoidDist) * force;
        dz += (az / avoidDist) * force;
      }
    });

    dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 1 || target.distanceTo(pos) < 1) {
      targetRef.current.set(
        (Math.random() - 0.5) * 80,
        0.5,
        (Math.random() - 0.5) * 80
      );
    } else {
      const moveX = (dx / dist) * speedRef.current * delta;
      const moveZ = (dz / dist) * speedRef.current * delta;
      pos.x += moveX;
      pos.z += moveZ;

      rotationRef.current = Math.atan2(dx, dz);
    }

    pos.x = THREE.MathUtils.clamp(pos.x, -100, 100);
    pos.z = THREE.MathUtils.clamp(pos.z, -100, 100);

    setRenderPosition([pos.x, pos.y, pos.z]);
    setRenderRotation(rotationRef.current);
    onPositionChange(id, pos);
  });

  return (
    <group position={renderPosition} rotation={[0, renderRotation, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[-0.2, 0.2, 0.5]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0.2, 0.2, 0.5]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.49, 0]}>
        <circleGeometry args={[0.6, 16]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.3} />
      </mesh>
      <ChatBubble visible={!!chatMessage} message={chatMessage} />
    </group>
  );
}

export function getRandomColor(): string {
  return CUBE_COLORS[Math.floor(Math.random() * CUBE_COLORS.length)];
}

export { CUBE_COLORS, CHAT_MESSAGES };
