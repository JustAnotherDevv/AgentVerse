import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Cube, GridGround, useCubeManager, AgentBean, AgentChat } from "./components/game";

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

  useEffect(() => {
    const interval = setInterval(() => {
      if (keys["KeyQ"]) yaw.current += rotateSpeed * 0.016;
      if (keys["KeyE"]) yaw.current -= rotateSpeed * 0.016;
    }, 16);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let animationId: number;
    
    const updateCamera = () => {
      const zoomFactor = zoom.current * 0.1;
      zoom.current += mouse.wheel * zoomSpeed * zoomFactor * 0.016;
      zoom.current = THREE.MathUtils.clamp(zoom.current, 8, 200);
      mouse.wheel = 0;

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

      target.current.add(forwardDir.multiplyScalar(forward * panSpeed * 0.016));
      target.current.add(rightDir.multiplyScalar(right * panSpeed * 0.016));

      if (mouse.x < edgeSize)
        target.current.add(rightDir.clone().multiplyScalar(panSpeed * 0.016));
      if (mouse.x > size.width - edgeSize)
        target.current.add(rightDir.clone().multiplyScalar(-panSpeed * 0.016));
      if (mouse.y < edgeSize)
        target.current.add(forwardDir.clone().multiplyScalar(panSpeed * 0.016));
      if (mouse.y > size.height - edgeSize)
        target.current.add(forwardDir.clone().multiplyScalar(-panSpeed * 0.016));

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

      animationId = requestAnimationFrame(updateCamera);
    };

    updateCamera();

    return () => cancelAnimationFrame(animationId);
  }, [camera, size]);

  return null;
}

function Game({ onAgentClick }: { onAgentClick: () => void }) {
  const { cubes, addCube, handlePositionChange, getOtherCubePositions, chattingCubes } = useCubeManager();

  const handlePlaneClick = (point: THREE.Vector3) => {
    addCube(new THREE.Vector3(point.x, 0.5, point.z));
  };

  return (
    <>
      <RTSController />
      <GridGround onPlaneClick={handlePlaneClick} />

      {/* Agent Bean */}
      <AgentBean 
        position={[0, 1, 0]} 
        onClick={onAgentClick}
      />

      {cubes.map(cube => (
        <Cube
          key={cube.id}
          id={cube.id}
          position={cube.position}
          color={cube.color}
          onPositionChange={handlePositionChange}
          otherCubes={getOtherCubePositions(cube.id)}
          chatMessage={chattingCubes.get(cube.id)}
        />
      ))}
    </>
  );
}

export default function App() {
  useInput();
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="w-screen h-screen bg-black">
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[50, 100, 50]} intensity={1} />
        <Game onAgentClick={() => setChatOpen(true)} />
      </Canvas>
      <AgentChat 
        open={chatOpen} 
        onClose={() => setChatOpen(false)} 
      />
    </div>
  );
}
