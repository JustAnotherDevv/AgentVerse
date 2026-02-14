import * as THREE from "three";

interface GridGroundProps {
  onPlaneClick?: (point: THREE.Vector3) => void;
}

export function GridGround({ onPlaneClick }: GridGroundProps) {
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
