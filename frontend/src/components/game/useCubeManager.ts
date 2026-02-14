import { useState, useRef, useCallback, useEffect } from "react";
import * as THREE from "three";
import { getRandomColor } from "./Cube";

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

interface CubeData {
  id: number;
  position: THREE.Vector3;
  color: string;
}

export function useCubeManager() {
  const [cubes, setCubes] = useState<CubeData[]>([]);
  const [chattingCubes, setChattingCubes] = useState<Map<number, string>>(new Map());
  const cubeIdRef = useRef(0);
  const cubePositionsRef = useRef<Map<number, THREE.Vector3>>(new Map());
  const chatTimeoutRefs = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const addCube = useCallback((position: THREE.Vector3) => {
    const newCube: CubeData = {
      id: cubeIdRef.current++,
      position: position.clone(),
      color: getRandomColor(),
    };
    setCubes(prev => [...prev, newCube]);
    cubePositionsRef.current.set(newCube.id, position.clone());
    return newCube.id;
  }, []);

  const handlePositionChange = useCallback((id: number, position: THREE.Vector3) => {
    cubePositionsRef.current.set(id, position.clone());

    const myPos = position;
    const chatDistance = 2.5;

    // Find nearby cubes
    const nearbyCubes: number[] = [];
    cubes.forEach(cube => {
      if (cube.id === id) return;
      const otherPos = cubePositionsRef.current.get(cube.id);
      if (!otherPos) return;

      const dist = myPos.distanceTo(otherPos);
      if (dist < chatDistance) {
        nearbyCubes.push(cube.id);
      }
    });

    // Randomly start chatting if near another cube and not already chatting
    if (nearbyCubes.length > 0 && !chattingCubes.has(id) && Math.random() < 0.005) {
      const chatPartner = nearbyCubes[Math.floor(Math.random() * nearbyCubes.length)];

      const message = CHAT_MESSAGES[Math.floor(Math.random() * CHAT_MESSAGES.length)];

      setChattingCubes(prev => {
        const newMap = new Map(prev);
        newMap.set(id, message);
        newMap.set(chatPartner, message);
        return newMap;
      });

      // Clear existing timeout for this cube
      if (chatTimeoutRefs.current.has(id)) {
        clearTimeout(chatTimeoutRefs.current.get(id));
      }
      if (chatTimeoutRefs.current.has(chatPartner)) {
        clearTimeout(chatTimeoutRefs.current.get(chatPartner));
      }

      const duration = 2000 + Math.random() * 2000;
      const timeout = setTimeout(() => {
        setChattingCubes(prev => {
          const newMap = new Map(prev);
          newMap.delete(id);
          newMap.delete(chatPartner);
          return newMap;
        });
        chatTimeoutRefs.current.delete(id);
        chatTimeoutRefs.current.delete(chatPartner);
      }, duration);

      chatTimeoutRefs.current.set(id, timeout);
      chatTimeoutRefs.current.set(chatPartner, timeout);
    }
  }, [cubes, chattingCubes]);

  const getOtherCubePositions = useCallback((excludeId: number): Map<number, THREE.Vector3> => {
    const positions = new Map<number, THREE.Vector3>();
    cubePositionsRef.current.forEach((pos, cubeId) => {
      if (cubeId !== excludeId) {
        positions.set(cubeId, pos.clone());
      }
    });
    return positions;
  }, []);

  const removeCube = useCallback((id: number) => {
    setCubes(prev => prev.filter(c => c.id !== id));
    cubePositionsRef.current.delete(id);
    if (chatTimeoutRefs.current.has(id)) {
      clearTimeout(chatTimeoutRefs.current.get(id));
      chatTimeoutRefs.current.delete(id);
    }
  }, []);

  useEffect(() => {
    return () => {
      chatTimeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return {
    cubes,
    addCube,
    handlePositionChange,
    getOtherCubePositions,
    chattingCubes,
    removeCube,
    cubePositionsRef,
  };
}
