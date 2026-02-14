import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

export interface Agent {
  id: string;
  name: string;
  description: string;
  personality: {
    traits: string[];
    speakingStyle: string;
    interests: string[];
    quirks: string[];
    mood: string;
  };
  systemPrompt: string;
  walletAddress?: string;
  position: { x: number; y: number };
  avatar: {
    color: string;
    emoji: string;
    shape: 'circle' | 'square' | 'bean' | 'star';
  };
  skills: string[];
  behaviors: any[];
  enabled: boolean;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
}

export interface AgentSpeakingEvent {
  agentId: string;
  agentName: string;
  message: string;
  type: string;
}

export interface WorldMessage {
  id: string;
  type: 'agent_speech' | 'system' | 'world_event';
  agentId?: string;
  agentName?: string;
  avatar?: { emoji: string };
  content: string;
  timestamp: number;
}

export function useAgentSystem(agentUrl: string = "http://localhost:3000") {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [speakingAgents, setSpeakingAgents] = useState<Map<string, string>>(new Map());
  const [worldMessages, setWorldMessages] = useState<WorldMessage[]>([]);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const agentsRef = useRef<Agent[]>([]);
  agentsRef.current = agents;

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch(`${agentUrl}/agents`);
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (e) {
      console.error("Failed to fetch agents:", e);
    }
  }, [agentUrl]);

  const addWorldMessage = useCallback((msg: Omit<WorldMessage, 'id' | 'timestamp'>) => {
    const newMsg: WorldMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now()
    };
    setWorldMessages(prev => [...prev.slice(-99), newMsg]);
  }, []);

  const handleAgentSpeaking = useCallback((event: AgentSpeakingEvent) => {
    setSpeakingAgents(prev => {
      const next = new Map(prev);
      next.set(event.agentId, event.message);
      
      setTimeout(() => {
        setSpeakingAgents(p => {
          const after = new Map(p);
          after.delete(event.agentId);
          return after;
        });
      }, 10000);
      
      return next;
    });
  }, []);

  useEffect(() => {
    const newSocket = io(agentUrl, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      console.log("🔌 Connected to agent system");
      setConnected(true);
      newSocket.emit("subscribe");
    });

    newSocket.on("disconnect", () => {
      console.log("🔌 Disconnected from agent system");
      setConnected(false);
    });

    newSocket.on("message", (msg: WebSocketMessage) => {
      console.log("📡 WebSocket message:", msg.type, msg.payload);
      switch (msg.type) {
        case "agent_created":
        case "agent_updated":
          fetchAgents();
          break;
        case "agent_deleted":
          setAgents(prev => prev.filter(a => a.id !== msg.payload.id));
          break;
        case "agent_moved":
          console.log("🎯 Agent moved:", msg.payload.agentId, msg.payload.position);
          setAgents(prev => prev.map(a => 
            a.id === msg.payload.agentId 
              ? { ...a, position: msg.payload.position }
              : a
          ));
          addWorldMessage({
            type: 'world_event',
            agentId: msg.payload.agentId,
            agentName: msg.payload.agentName,
            content: `${msg.payload.agentName} moved to (${msg.payload.position.x.toFixed(1)}, ${msg.payload.position.y.toFixed(1)})`,
          });
          break;
        case "agent_speaking":
          handleAgentSpeaking(msg.payload as AgentSpeakingEvent);
          if (msg.payload.message && msg.payload.type !== 'move') {
            addWorldMessage({
              type: 'agent_speech',
              agentId: msg.payload.agentId,
              agentName: msg.payload.agentName,
              avatar: msg.payload.avatar,
              content: msg.payload.message,
            });
          }
          break;
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [agentUrl, fetchAgents, addWorldMessage, handleAgentSpeaking]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const sendMessage = useCallback(async (agentId: string, message: string, sessionId: string) => {
    const res = await fetch(`${agentUrl}/agents/${agentId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, sessionId })
    });
    const data = await res.json();
    return data;
  }, [agentUrl]);

  const createAgent = useCallback(async (agent: Partial<Agent>) => {
    const res = await fetch(`${agentUrl}/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agent)
    });
    const data = await res.json();
    return data;
  }, [agentUrl]);

  return {
    agents,
    connected,
    speakingAgents,
    worldMessages,
    sendMessage,
    createAgent,
    fetchAgents,
    socket
  };
}
