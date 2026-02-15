import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Cube, GridGround, useCubeManager, AgentBean } from "./components/game";
import { AgentChat } from "./components/game/AgentChat";
import { WorldChat } from "./components/game/WorldChat";
import { AgentPanel } from "./components/game/AgentPanel";
import { TaskMarketplace } from "./components/game/TaskMarketplace";
import { useAgentSystem, type Agent } from "./hooks/useAgentSystem";

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  const stored = localStorage.getItem("tempo-chat-session");
  if (stored) return stored;
  const newId = "sess-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 10);
  localStorage.setItem("tempo-chat-session", newId);
  return newId;
}

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

function Game({ 
  onAgentClick, 
  agents, 
  speakingAgents 
}: { 
  onAgentClick: (agent: Agent) => void;
  agents: Agent[];
  speakingAgents: Map<string, string>;
}) {
  const { cubes, addCube, handlePositionChange, getOtherCubePositions, chattingCubes } = useCubeManager();

  console.log("🎮 Game rendering agents:", agents.map(a => `${a.name}: (${a.position.x}, ${a.position.y})`));

  const handlePlaneClick = (point: THREE.Vector3) => {
    addCube(new THREE.Vector3(point.x, 0.5, point.z));
  };

  return (
    <>
      <RTSController />
      <GridGround onPlaneClick={handlePlaneClick} />

      {/* Agent Beans */}
      {agents.map(agent => (
        <AgentBean
          key={agent.id}
          id={agent.id}
          name={agent.name}
          position={agent.position}
          avatar={agent.avatar}
          personality={agent.personality}
          stats={agent.stats}
          skills={agent.skills}
          onClick={() => onAgentClick(agent)}
          chatMessage={speakingAgents.get(agent.id)}
        />
      ))}

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
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [taskMarketplaceOpen, setTaskMarketplaceOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [sessionId] = useState(() => getOrCreateSessionId());
  
  const { 
    agents, 
    connected, 
    speakingAgents, 
    worldMessages,
    sendMessage, 
    createTask,
    fetchTasks,
    tipAgent,
  } = useAgentSystem();

  useEffect(() => {
    fetchTasks().then(setTasks);
  }, [fetchTasks]);

  const handleAgentClick = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
    setPanelOpen(true);
    setChatOpen(true);
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!selectedAgent) return;
    return await sendMessage(selectedAgent.id, message, sessionId);
  }, [selectedAgent, sendMessage, sessionId]);

  const handleCreateTask = useCallback(async (task: any) => {
    const result = await createTask(task);
    const updatedTasks = await fetchTasks();
    setTasks(updatedTasks);
    return result;
  }, [createTask, fetchTasks]);

  return (
    <div className="w-screen h-screen bg-black">
      {/* Connection status */}
      <div style={{
        position: 'fixed',
        top: 10,
        left: 10,
        zIndex: 100,
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: connected ? '#22c55e' : '#ef4444',
        }} />
        <span style={{ color: '#9ca3af', fontSize: 12 }}>
          {connected ? `Connected (${agents.length} agents)` : 'Connecting...'}
        </span>
      </div>

      {/* Task Marketplace Button */}
      <button
        onClick={() => setTaskMarketplaceOpen(true)}
        style={{
          position: 'fixed',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          padding: '8px 16px',
          background: 'rgba(139, 92, 246, 0.9)',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        📋 Tasks ({tasks.filter(t => t.status === 'open').length})
      </button>

      {/* Agent selector in top right */}
      {agents.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 10,
          right: 10,
          zIndex: 100,
          display: 'flex',
          gap: '8px',
        }}>
          {agents.slice(0, 3).map(agent => (
            <div
              key={agent.id}
              onClick={() => handleAgentClick(agent)}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: agent.avatar.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                cursor: 'pointer',
                border: selectedAgent?.id === agent.id ? '2px solid white' : '2px solid transparent',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
              title={agent.name}
            >
              {agent.avatar.emoji}
            </div>
          ))}
        </div>
      )}

      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[50, 100, 50]} intensity={1} />
        <Game 
          onAgentClick={handleAgentClick}
          agents={agents}
          speakingAgents={speakingAgents}
        />
      </Canvas>
      
      <WorldChat messages={worldMessages} />
      
      <AgentChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        agent={selectedAgent || undefined}
        onSend={handleSendMessage}
      />

      <AgentPanel
        agent={selectedAgent}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onTip={tipAgent}
      />

      {taskMarketplaceOpen && (
        <TaskMarketplace
          agents={agents}
          tasks={tasks}
          onCreateTask={handleCreateTask}
          onClose={() => setTaskMarketplaceOpen(false)}
        />
      )}
    </div>
  );
}
