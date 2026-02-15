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
  skills: AgentSkill[];
  stats: AgentStats;
  behaviors: BehaviorConfig[];
  enabled: boolean;
  createdAt: number;
  lastActive: number;
}

export interface AgentSkill {
  name: string;
  level: number;        // 1-10
  experience: number;   // Points toward next level
}

export interface AgentStats {
  reputation: number;        // 0-100
  totalEarnings: number;     // Total pathUSD earned
  tasksCompleted: number;
  tasksFailed: number;
  humansHelped: number;
  cooperations: number;
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
  execute: (agent: RuntimeAgent, context: BehaviorContext, params?: any) => Promise<BehaviorResult>;
}

export interface BehaviorContext {
  getNearbyAgents: (agentId: string, maxDistance: number) => AgentConfig[];
  getAllAgents: () => AgentConfig[];
  stopMoving: (agentId: string) => void;
  resumeMoving: (agentId: string) => void;
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
  isMoving: boolean;
  isConversing: boolean;
  conversationPartner?: string;
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
    skills: [
      { name: 'assistant', level: 1, experience: 0 },
      { name: 'explorer', level: 1, experience: 0 }
    ],
    stats: {
      reputation: 50,
      totalEarnings: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      humansHelped: 0,
      cooperations: 0
    },
    behaviors: [
      { name: 'wander', type: 'interval', interval: 10000, enabled: true },
      { name: 'encounter', type: 'interval', interval: 8000, enabled: true },
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
    skills: [
      { name: 'assistant', level: 1, experience: 0 },
      { name: 'mediator', level: 1, experience: 0 }
    ],
    stats: {
      reputation: 50,
      totalEarnings: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      humansHelped: 0,
      cooperations: 0
    },
    behaviors: [
      { name: 'wander', type: 'interval', interval: 12000, enabled: true },
      { name: 'encounter', type: 'interval', interval: 8000, enabled: true },
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
    skills: [
      { name: 'assistant', level: 1, experience: 0 },
      { name: 'mediator', level: 1, experience: 0 }
    ],
    stats: {
      reputation: 50,
      totalEarnings: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      humansHelped: 0,
      cooperations: 0
    },
    behaviors: [
      { name: 'wander', type: 'interval', interval: 15000, enabled: true },
      { name: 'encounter', type: 'interval', interval: 8000, enabled: true },
      { name: 'checkIn', type: 'interval', interval: 60000, enabled: true },
      { name: 'cheer', type: 'random', weight: 0.4, enabled: true }
    ],
    enabled: true
  }
];

export interface Task {
  id: string;
  creatorId: string;
  creatorType: 'human' | 'agent';
  agentId?: string;
  type: 'assist' | 'build' | 'explore' | 'create';
  description: string;
  reward: number;
  requiredSkill?: string;
  status: 'open' | 'accepted' | 'working' | 'completed' | 'disputed';
  proof?: string;
  createdAt: number;
  completedAt?: number;
}

export interface Transaction {
  id: string;
  fromType: 'human' | 'agent' | 'escrow';
  fromId: string;
  toType: 'human' | 'agent' | 'escrow';
  toId: string;
  amount: number;
  type: 'tip' | 'task_payment' | 'trade';
  createdAt: number;
}
