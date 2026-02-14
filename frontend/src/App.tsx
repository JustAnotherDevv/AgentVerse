import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

const keys: Record<string, boolean> = {};
const mouse = { x: 0, y: 0, wheel: 0 };

function useInput() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => (keys[e.code] = true);
    const up = (e: KeyboardEvent) => (keys[e.code] = false);

    const move = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const wheel = (e: WheelEvent) => {
      mouse.wheel = e.deltaY;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("mousemove", move);
    window.addEventListener("wheel", wheel);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("wheel", wheel);
    };
  }, []);
}

function RTSController() {
  const { camera, size } = useThree();

  const target = useRef(new THREE.Vector3(0, 0, 0));
  const yaw = useRef(0);
  const zoom = useRef(20);

  const panSpeed = 25;
  const edgeSize = 20;
  const zoomSpeed = 0.2;
  const rotateSpeed = 2;

  useFrame((_, delta) => {
    // ========= ROTATION =========
    if (keys["KeyQ"]) yaw.current += rotateSpeed * delta;
    if (keys["KeyE"]) yaw.current -= rotateSpeed * delta;

    // ========= ZOOM =========
    const zoomFactor = zoom.current * 0.1;
    zoom.current += mouse.wheel * zoomSpeed * zoomFactor * delta;
    zoom.current = THREE.MathUtils.clamp(zoom.current, 8, 200);
    mouse.wheel = 0;

    // ========= PAN (WASD) =========
    const forward = (keys["KeyW"] ? 1 : 0) - (keys["KeyS"] ? 1 : 0);
    const right = (keys["KeyD"] ? 1 : 0) - (keys["KeyA"] ? 1 : 0);

    const forwardDir = new THREE.Vector3(
      Math.sin(yaw.current),
      0,
      Math.cos(yaw.current),
    );

    const rightDir = new THREE.Vector3(
      Math.sin(yaw.current - Math.PI / 2),
      0,
      Math.cos(yaw.current - Math.PI / 2),
    );

    target.current.add(forwardDir.multiplyScalar(forward * panSpeed * delta));
    target.current.add(rightDir.multiplyScalar(right * panSpeed * delta));

    // ========= EDGE SCROLL =========
    if (mouse.x < edgeSize)
      target.current.add(rightDir.clone().multiplyScalar(panSpeed * delta));
    if (mouse.x > size.width - edgeSize)
      target.current.add(rightDir.clone().multiplyScalar(-panSpeed * delta));
    if (mouse.y < edgeSize)
      target.current.add(forwardDir.clone().multiplyScalar(panSpeed * delta));
    if (mouse.y > size.height - edgeSize)
      target.current.add(forwardDir.clone().multiplyScalar(-panSpeed * delta));

    // ========= CAMERA POSITION =========
    const height = zoom.current;
    const distance = zoom.current * 0.9;

    const offset = new THREE.Vector3(
      -Math.sin(yaw.current) * distance,
      height,
      -Math.cos(yaw.current) * distance,
    );

    const desiredPosition = target.current.clone().add(offset);

    camera.position.lerp(desiredPosition, 0.12);
    camera.lookAt(target.current);
  });

  return null;
}

function RedCube({ startPosition }: { startPosition: [number, number, number] }) {
  const positionRef = useRef(new THREE.Vector3(...startPosition));
  const targetRef = useRef(new THREE.Vector3(0, 0.5, 50));
  const rotationRef = useRef(0);
  const speedRef = useRef(2);
  const initializedRef = useRef(false);

  const [renderPosition, setRenderPosition] = useState<[number, number, number]>(startPosition);
  const [renderRotation, setRenderRotation] = useState(0);

  useEffect(() => {
    targetRef.current.set(
      (Math.random() - 0.5) * 100,
      0.5,
      (Math.random() - 0.5) * 100
    );
    rotationRef.current = Math.random() * Math.PI * 2;
    speedRef.current = 2 + Math.random() * 2;
    initializedRef.current = true;
  }, []);

  useFrame((_, delta) => {
    if (!initializedRef.current) return;

    const pos = positionRef.current;
    const target = targetRef.current;

    const dx = target.x - pos.x;
    const dz = target.z - pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 1) {
      targetRef.current.set(
        (Math.random() - 0.5) * 100,
        0.5,
        (Math.random() - 0.5) * 100
      );
    } else {
      const moveX = (dx / dist) * speedRef.current * delta;
      const moveZ = (dz / dist) * speedRef.current * delta;
      pos.x += moveX;
      pos.z += moveZ;

      rotationRef.current = Math.atan2(dx, dz);
    }

    setRenderPosition([pos.x, pos.y, pos.z]);
    setRenderRotation(rotationRef.current);
  });

  return (
    <group position={renderPosition} rotation={[0, renderRotation, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ef4444" roughness={0.4} metalness={0.3} />
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
    </group>
  );
}

function GridGround({ onPlaneClick }: { onPlaneClick?: (point: THREE.Vector3) => void }) {
  return (
    <>
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        onPointerDown={(e) => {
          e.stopPropagation();
          onPlaneClick?.(e.point);
        }}
      >
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      <gridHelper
        args={[500, 200, "#334155", "#1e293b"]}
        position={[0, 0.01, 0]}
      />
    </>
  );
}

export default function App() {
  useInput();
  const [cubes, setCubes] = useState<{ id: number; position: [number, number, number] }[]>([]);
  const cubeIdRef = useRef(0);

  const handlePlaneClick = useCallback((point: THREE.Vector3) => {
    const newCube = {
      id: cubeIdRef.current++,
      position: [point.x, 0.5, point.z] as [number, number, number]
    };
    setCubes(prev => [...prev, newCube]);
  }, []);

  return (
    <div className="w-screen h-screen bg-black">
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[50, 100, 50]} intensity={1} />

        <RTSController />
        <GridGround onPlaneClick={handlePlaneClick} />

        {cubes.map(cube => (
          <RedCube key={cube.id} startPosition={cube.position} />
        ))}
      </Canvas>
    </div>
  );
}
