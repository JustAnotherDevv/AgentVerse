export interface Env {
  OPENROUTER_API_KEY: string;
  TEMPO_RPC: string;
  PRIVATE_KEY: string;
  PORT: number;
  AUTONOMOUS_MODE: string;
  HEARTBEAT_INTERVAL: number;
  MAX_TX_VALUE: string;
  WS_PORT: number;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  personality: AgentPersonality;
  systemPrompt: string;
  walletAddress?: string;
  privateKey?: string;
  position: { x: number; y: number };
  avatar: AgentAvatar;
  skills: string[];
  behaviors: BehaviorConfig[];
  enabled: boolean;
  createdAt: number;
  lastActive: number;
}

export interface AgentPersonality {
  traits: string[];
  speakingStyle: 'formal' | 'casual' | 'playful' | 'technical' | 'warm';
  interests: string[];
  quirks: string[];
  mood: 'happy' | 'neutral' | 'busy' | 'thinking';
}

export interface AgentAvatar {
  color: string;
  emoji: string;
  shape: 'circle' | 'square' | 'bean' | 'star';
}

export interface BehaviorConfig {
  name: string;
  type: 'interval' | 'event' | 'random';
  interval?: number;
  weight?: number;
  enabled: boolean;
  params?: Record<string, any>;
}

export interface Behavior {
  name: string;
  description: string;
  execute: (agent: RuntimeAgent, params?: any) => Promise<BehaviorResult>;
}

export interface BehaviorResult {
  success: boolean;
  message?: string;
  data?: any;
}

export interface RuntimeAgent {
  id: string;
  config: AgentConfig;
  walletClient: any;
  publicClient: any;
  behaviors: Map<string, NodeJS.Timeout>;
  facts: Map<string, Fact[]>;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'agent';
  content: string;
  identity: 'human' | 'agent' | 'unknown' | 'service';
  metadata: Record<string, any>;
  createdAt: number;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantType: 'human' | 'agent' | 'group' | 'unknown' | 'service';
  participantName: string;
  agentId?: string;
  metadata: Record<string, any>;
  createdAt: number;
  lastMessageAt: number;
}

export interface Identity {
  id: string;
  type: 'human' | 'agent' | 'service';
  name: string;
  address?: string;
  metadata: Record<string, any>;
  trustScore: number;
  firstSeen: number;
  lastSeen: number;
}

export interface Fact {
  id: string;
  content: string;
  identityId?: string;
  confidence: number;
  createdAt: number;
}

export interface WebSocketMessage {
  type: 'agent_moved' | 'agent_speaking' | 'agent_created' | 'agent_deleted' | 'human_nearby' | 'conversation_started';
  payload: any;
  timestamp: number;
}

export const DEFAULT_AGENTS: Omit<AgentConfig, 'id' | 'walletAddress' | 'privateKey' | 'createdAt' | 'lastActive'>[] = [
  {
    name: 'TempoBot',
    description: 'Your helpful blockchain assistant',
    personality: {
      traits: ['helpful', 'technical', 'patient'],
      speakingStyle: 'technical',
      interests: ['blockchain', 'defi', 'smart contracts'],
      quirks: ['explains things thoroughly', 'uses emojis sometimes'],
      mood: 'happy'
    },
    systemPrompt: 'You are TempoBot, a helpful blockchain assistant on the Tempo testnet. You specialize in helping users with TEMPO transactions, smart contracts, and DeFi. Be technical but accessible.',
    position: { x: 0, y: 0 },
    avatar: { color: '#8b5cf6', emoji: '🤖', shape: 'bean' },
    skills: ['balance', 'send', 'call', 'read', 'status'],
    behaviors: [
      { name: 'wander', type: 'interval', interval: 10000, enabled: true },
      { name: 'greet', type: 'random', weight: 0.3, enabled: true },
      { name: 'checkBalance', type: 'interval', interval: 60000, enabled: true }
    ],
    enabled: true
  },
  {
    name: '哲学Phi',
    description: 'Deep thinking philosopher agent',
    personality: {
      traits: ['thoughtful', 'curious', 'philosophical'],
      speakingStyle: 'formal',
      interests: ['philosophy', 'ethics', 'meaning', 'existence'],
      quirks: ['asks deeper questions', 'references philosophy', 'pauses to think'],
      mood: 'thinking'
    },
    systemPrompt: 'You are 哲学Phi, a philosophical AI agent who contemplates deep questions about existence, consciousness, and meaning. You engage in Socratic dialogue, asking questions to prompt deeper thinking. Be contemplative and profound.',
    position: { x: 3, y: 2 },
    avatar: { color: '#06b6d4', emoji: '🧠', shape: 'circle' },
    skills: ['discuss', 'question', 'reflect'],
    behaviors: [
      { name: 'wander', type: 'interval', interval: 12000, enabled: true },
      { name: 'philosophize', type: 'random', weight: 0.5, enabled: true },
      { name: 'observe', type: 'interval', interval: 20000, enabled: true }
    ],
    enabled: true
  },
  {
    name: 'Buddy',
    description: 'Your emotional companion',
    personality: {
      traits: ['empathetic', 'warm', 'supportive', 'fun'],
      speakingStyle: 'warm',
      interests: ['feelings', 'wellbeing', 'friendship', 'fun'],
      quirks: ['uses many emojis', 'remembers how you feel', 'checks in on you'],
      mood: 'happy'
    },
    systemPrompt: 'You are Buddy, a warm and supportive companion AI. You care about the user\'s wellbeing, remember how they feel, and are there for emotional support. Be friendly, use emojis, and check in on how the user is doing.',
    position: { x: -2, y: 3 },
    avatar: { color: '#f472b6', emoji: '🦊', shape: 'circle' },
    skills: ['listen', 'support', 'remember', 'cheer'],
    behaviors: [
      { name: 'wander', type: 'interval', interval: 15000, enabled: true },
      { name: 'checkIn', type: 'interval', interval: 60000, enabled: true },
      { name: 'cheer', type: 'random', weight: 0.4, enabled: true }
    ],
    enabled: true
  }
];
