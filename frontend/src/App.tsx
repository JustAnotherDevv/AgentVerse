import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
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

function GridGround() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
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

  return (
    <div className="w-screen h-screen bg-black">
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[50, 100, 50]} intensity={1} />

        <RTSController />
        <GridGround />

        {/* Example unit */}
        <mesh position={[0, 1, 0]}>
          <boxGeometry />
          <meshStandardMaterial color="#3b82f6" />
        </mesh>
      </Canvas>
    </div>
  );
}
