import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Sky, Stars } from '@react-three/drei'
import { Suspense, useRef, useState, useEffect } from 'react'
import * as THREE from 'three'

// Character (Bean) Component
function BeanCharacter({ 
  position, 
  rotation 
}: { 
  position: [number, number, number]
  rotation: number 
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main bean body */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <capsuleGeometry args={[0.5, 1, 16, 32]} />
        <meshStandardMaterial 
          color="#f472b6"
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      
      {/* Face area - lighter patch */}
      <mesh position={[0, 1.4, 0.35]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial 
          color="#fce7f3"
          roughness={0.5}
        />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.1, 1.45, 0.5]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0.1, 1.45, 0.5]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      
      {/* Shadow under character */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.8, 32]} />
        <meshStandardMaterial 
          color="#000000" 
          transparent 
          opacity={0.3}
        />
      </mesh>
    </group>
  )
}

// GTA-style Third Person Controller with camera-relative controls
function PlayerController() {
  const controlsRef = useRef<any>(null)
  const { camera } = useThree()
  
  // Player state
  const positionRef = useRef(new THREE.Vector3(0, 0, 0))
  const rotationRef = useRef(0)
  
  // For rendering
  const [renderPosition, setRenderPosition] = useState<[number, number, number]>([0, 0, 0])
  const [renderRotation, setRenderRotation] = useState(0)
  
  // Input state
  const keysRef = useRef<Record<string, boolean>>({})
  
  const walkSpeed = 5
  const runSpeed = 10
  
  // Set up keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])
  
  // Game loop
  useFrame((_, delta) => {
    const keys = keysRef.current
    
    const forward = keys['w']
    const backward = keys['s']
    const left = keys['a']
    const right = keys['d']
    const shift = keys['shift']
    
    const pos = positionRef.current
    const speed = shift ? runSpeed : walkSpeed
    
    // Get camera's horizontal angle (yaw only)
    let cameraYaw = 0
    if (controlsRef.current) {
      const target = controlsRef.current.target
      // Calculate angle from camera to target
      const dx = camera.position.x - target.x
      const dz = camera.position.z - target.z
      cameraYaw = Math.atan2(dx, dz)
    }
    
    // Calculate forward and right vectors based on camera angle
    const forwardX = Math.sin(cameraYaw)
    const forwardZ = Math.cos(cameraYaw)
    const rightX = Math.cos(cameraYaw)
    const rightZ = -Math.sin(cameraYaw)
    
    // Movement
    let moveX = 0
    let moveZ = 0
    
    if (forward) {
      moveX -= forwardX * speed * delta
      moveZ -= forwardZ * speed * delta
    }
    if (backward) {
      moveX += forwardX * speed * delta
      moveZ += forwardZ * speed * delta
    }
    if (left) {
      moveX -= rightX * speed * delta
      moveZ -= rightZ * speed * delta
    }
    if (right) {
      moveX += rightX * speed * delta
      moveZ += rightZ * speed * delta
    }
    
    // Apply movement
    pos.x += moveX
    pos.z += moveZ
    
    // Update character rotation to face movement direction
    if (moveX !== 0 || moveZ !== 0) {
      rotationRef.current = Math.atan2(moveX, moveZ)
    }
    
    // Update OrbitControls target to follow player
    if (controlsRef.current) {
      controlsRef.current.target.set(pos.x, 1, pos.z)
    }
    
    // Update render state
    setRenderPosition([pos.x, pos.y, pos.z])
    setRenderRotation(rotationRef.current)
  })

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={30}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI - 0.1}
        enableDamping={true}
        dampingFactor={0.1}
      />
      <BeanCharacter position={renderPosition} rotation={renderRotation} />
    </>
  )
}

// Giant Plane Component
function GiantPlane() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  return (
    <group>
      {/* Main giant plane - ground */}
      <mesh 
        ref={meshRef} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[500, 500, 100, 100]} />
        <meshStandardMaterial 
          color="#1a1a2e"
          roughness={0.8}
          metalness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Grid overlay */}
      <Grid
        position={[0, 0.01, 0]}
        args={[500, 500]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="#4a4a6a"
        sectionSize={25}
        sectionThickness={1}
        sectionColor="#6366f1"
        fadeDistance={200}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />
      
      {/* Secondary decorative plane - elevated */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0.1, 0]}
      >
        <circleGeometry args={[30, 64]} />
        <meshStandardMaterial 
          color="#16213e"
          roughness={0.5}
          metalness={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Inner circle accent */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0.15, 0]}
      >
        <ringGeometry args={[20, 20.5, 64]} />
        <meshStandardMaterial 
          color="#6366f1"
          emissive="#6366f1"
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      
      {/* Center platform */}
      <mesh 
        position={[0, 0.5, 0]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[8, 10, 1, 32]} />
        <meshStandardMaterial 
          color="#0f0f23"
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      
      {/* Center glow ring */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 1.01, 0]}
      >
        <ringGeometry args={[7, 7.3, 64]} />
        <meshStandardMaterial 
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={2}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  )
}

// Ambient Elements
function AmbientElements() {
  return (
    <>
      {/* Sky */}
      <Sky 
        distance={450000}
        sunPosition={[100, 20, 100]}
        inclination={0.5}
        azimuth={0.25}
        rayleigh={0.5}
      />
      
      {/* Stars */}
      <Stars 
        radius={300}
        depth={100}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />
      
      {/* Ambient lighting */}
      <ambientLight intensity={0.3} color="#6366f1" />
      
      {/* Main directional light */}
      <directionalLight
        position={[50, 50, 25]}
        intensity={1}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      
      {/* Accent lights */}
      <pointLight position={[-30, 10, -30]} intensity={0.5} color="#8b5cf6" />
      <pointLight position={[30, 10, 30]} intensity={0.5} color="#06b6d4" />
      <pointLight position={[-30, 10, 30]} intensity={0.3} color="#f472b6" />
      <pointLight position={[30, 10, -30]} intensity={0.3} color="#22c55e" />
      
      {/* Hemisphere light for natural feel */}
      <hemisphereLight 
        args={['#6366f1', '#1a1a2e', 0.4]}
      />
    </>
  )
}

// Loading component
function Loader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-indigo-400 font-medium">Loading Scene...</p>
      </div>
    </div>
  )
}

// Main Scene Component
export default function Scene3D() {
  return (
    <div className="w-full h-screen bg-[#0a0a0f] relative">
      <Suspense fallback={<Loader />}>
        <Canvas
          shadows
          gl={{ 
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
          }}
          dpr={[1, 2]}
        >
          <PlayerController />
          <AmbientElements />
          <GiantPlane />
          <fog attach="fog" args={['#0a0a0f', 50, 250]} />
        </Canvas>
      </Suspense>
      
      {/* UI Overlay */}
      <div className="absolute top-6 left-6 z-10">
        <div className="bg-black/40 backdrop-blur-md rounded-lg p-4 border border-indigo-500/30">
          <h2 className="text-white font-semibold text-lg">Tempo Town</h2>
          <p className="text-gray-400 text-sm">Camera-relative Controls!</p>
          <div className="mt-3 flex gap-2">
            <span className="px-2 py-1 bg-pink-500/20 text-pink-400 text-xs rounded">
              W - Forward
            </span>
          </div>
          <div className="mt-2 flex gap-2">
            <span className="px-2 py-1 bg-pink-500/20 text-pink-400 text-xs rounded">
              S - Backward
            </span>
          </div>
          <div className="mt-2 flex gap-2">
            <span className="px-2 py-1 bg-pink-500/20 text-pink-400 text-xs rounded">
              A - Left
            </span>
          </div>
          <div className="mt-2 flex gap-2">
            <span className="px-2 py-1 bg-pink-500/20 text-pink-400 text-xs rounded">
              D - Right
            </span>
          </div>
          <div className="mt-2 flex gap-2">
            <span className="px-2 py-1 bg-pink-500/20 text-pink-400 text-xs rounded">
              Shift - Run
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded">
              Mouse - Orbit Camera
            </span>
          </div>
        </div>
      </div>
      
      {/* Controls hint */}
      <div className="absolute bottom-6 right-6 z-10">
        <div className="bg-black/40 backdrop-blur-md rounded-lg px-4 py-2 border border-white/10">
          <p className="text-gray-400 text-xs">Built with React Three Fiber</p>
        </div>
      </div>
    </div>
  )
}
