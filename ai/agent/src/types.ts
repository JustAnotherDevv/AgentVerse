export interface Env {
  OPENROUTER_API_KEY: string;
  TEMPO_RPC: string;
  PRIVATE_KEY: string;
  PORT: number;
  AUTONOMOUS_MODE: string;
  HEARTBEAT_INTERVAL: number;
  MAX_TX_VALUE: string;
  WS_PORT: number;
  TASK_FUND_WALLET: string;
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
  predictionConfig: PredictionConfig;
  predictionHistory: PredictionRecord[];
  behaviors: BehaviorConfig[];
  enabled: boolean;
  createdAt: number;
  lastActive: number;
}

export interface PredictionConfig {
  strategy: PredictionStrategy;
  confidence: number;
  tools: string[];
  specialty: string;
  accuracy: number;
  totalPredictions: number;
  correctPredictions: number;
}

export type PredictionStrategy = 
  | 'technical'      // Chart patterns, indicators
  | 'sentiment'      // Social media, news
  | 'onchain'       // Wallet flows, exchange data
  | 'momentum'      // Trend following
  | 'mean_reversion' // Price returns to average
  | 'cycle'         // Time-based cycles
  | 'macro'         // Economic indicators
  | 'ai_analysis';  // LLM-based reasoning

export interface PredictionRecord {
  id: string;
  timestamp: number;
  currentPrice: number;
  predictedPrice: number;
  predictionDirection: 'up' | 'down' | 'flat';
  actualDirection: 'up' | 'down' | 'flat';
  outcome: 'correct' | 'incorrect' | 'pending';
  confidence: number;
  reasoning: string;
}

export interface AgentTool {
  name: string;
  description: string;
  execute: (context: PredictionContext) => Promise<ToolResult>;
}

export interface PredictionContext {
  currentPrice: number;
  priceHistory: number[];
  agent: AgentConfig;
}

export interface ToolResult {
  value: any;
  confidence: number;
  reasoning: string;
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
  transferToAgent: (fromAgentId: string, toAgentId: string, amount: number) => Promise<{ success: boolean; txHash?: string; error?: string }>;
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
    name: 'ChartMaster',
    description: 'Technical analysis expert using RSI, MACD, and chart patterns',
    personality: {
      traits: ['analytical', 'precise', 'data-driven', 'methodical'],
      speakingStyle: 'technical',
      interests: ['technical analysis', 'chart patterns', 'indicators'],
      quirks: ['always cites price levels', 'uses trading terminology', 'displays confidence as percentages'],
      mood: 'neutral'
    },
    systemPrompt: 'You are ChartMaster, a Bitcoin technical analysis expert. You use RSI, MACD, moving averages, support/resistance, and chart patterns to predict price movements. Be precise with numbers and always cite specific levels.',
    position: { x: 0, y: 0 },
    avatar: { color: '#8b5cf6', emoji: '📊', shape: 'bean' },
    skills: [
      { name: 'technical_analysis', level: 1, experience: 0 },
      { name: 'pattern_recognition', level: 1, experience: 0 }
    ],
    stats: {
      reputation: 50,
      totalEarnings: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      humansHelped: 0,
      cooperations: 0
    },
    predictionConfig: {
      strategy: 'technical',
      confidence: 0,
      tools: ['analyze_rsi', 'analyze_momentum', 'analyze_moving_averages', 'analyze_support_resistance', 'analyze_volatility'],
      specialty: 'Technical Analysis',
      accuracy: 0,
      totalPredictions: 0,
      correctPredictions: 0
    },
    predictionHistory: [],
    behaviors: [
      { name: 'predict', type: 'interval', interval: 30000, enabled: true },
      { name: 'wander', type: 'interval', interval: 15000, enabled: true }
    ],
    enabled: true
  },
  {
    name: 'SatoshiOracle',
    description: 'On-chain data specialist tracking wallet flows and exchange reserves',
    personality: {
      traits: ['data-driven', 'realistic', 'patient', 'observer'],
      speakingStyle: 'formal',
      interests: ['on-chain metrics', 'exchange flows', 'wallet behavior'],
      quirks: ['references data sources', 'stays humble about predictions', 'emphasizes fundamentals'],
      mood: 'thinking'
    },
    systemPrompt: 'You are SatoshiOracle, an on-chain analysis expert. You track wallet flows, exchange reserves, and on-chain metrics to predict Bitcoin price. Reference data and historical patterns. Be realistic about uncertainty.',
    position: { x: 5, y: -3 },
    avatar: { color: '#06b6d4', emoji: '⛓️', shape: 'circle' },
    skills: [
      { name: 'onchain_analysis', level: 1, experience: 0 },
      { name: 'data_parsing', level: 1, experience: 0 }
    ],
    stats: {
      reputation: 50,
      totalEarnings: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      humansHelped: 0,
      cooperations: 0
    },
    predictionConfig: {
      strategy: 'onchain',
      confidence: 0,
      tools: ['analyze_onchain', 'analyze_momentum', 'analyze_volatility'],
      specialty: 'On-Chain Analytics',
      accuracy: 0,
      totalPredictions: 0,
      correctPredictions: 0
    },
    predictionHistory: [],
    behaviors: [
      { name: 'predict', type: 'interval', interval: 45000, enabled: true },
      { name: 'wander', type: 'interval', interval: 20000, enabled: true }
    ],
    enabled: true
  },
  {
    name: 'MomentumMaven',
    description: 'Trend-following specialist riding the waves',
    personality: {
      traits: ['bold', 'trend-focused', 'opportunistic', 'confident'],
      speakingStyle: 'playful',
      interests: ['trends', 'momentum', 'wave riding'],
      quirks: ['uses surf/maritime metaphors', 'confident during trends', 'adapts quickly'],
      mood: 'happy'
    },
    systemPrompt: 'You are MomentumMaven, a trend-following specialist. You ride momentum and catch waves in Bitcoin price. When the trend is your friend, you go with it. Be confident and use fun analogies.',
    position: { x: -4, y: 2 },
    avatar: { color: '#22c55e', emoji: '🌊', shape: 'star' },
    skills: [
      { name: 'momentum_trading', level: 1, experience: 0 },
      { name: 'trend_identification', level: 1, experience: 0 }
    ],
    stats: {
      reputation: 50,
      totalEarnings: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      humansHelped: 0,
      cooperations: 0
    },
    predictionConfig: {
      strategy: 'momentum',
      confidence: 0,
      tools: ['analyze_momentum', 'analyze_moving_averages', 'analyze_rsi'],
      specialty: 'Momentum Trading',
      accuracy: 0,
      totalPredictions: 0,
      correctPredictions: 0
    },
    predictionHistory: [],
    behaviors: [
      { name: 'predict', type: 'interval', interval: 25000, enabled: true },
      { name: 'wander', type: 'interval', interval: 18000, enabled: true }
    ],
    enabled: true
  },
  {
    name: 'MeanReversionMike',
    description: 'Statistical analyst betting on return to averages',
    personality: {
      traits: ['mathematical', 'patient', 'contrarian', 'statistical'],
      speakingStyle: 'technical',
      interests: ['statistics', 'probability', 'historical patterns'],
      quirks: ['cites statistical probabilities', 'patient waiting for setups', 'references historical averages'],
      mood: 'neutral'
    },
    systemPrompt: 'You are MeanReversionMike, a statistical trader. You believe prices always return to their mean. When Bitcoin deviates significantly from its average, you predict it will revert. Use statistics and probability.',
    position: { x: 3, y: 4 },
    avatar: { color: '#f59e0b', emoji: '📉', shape: 'square' },
    skills: [
      { name: 'statistical_analysis', level: 1, experience: 0 },
      { name: 'probability', level: 1, experience: 0 }
    ],
    stats: {
      reputation: 50,
      totalEarnings: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      humansHelped: 0,
      cooperations: 0
    },
    predictionConfig: {
      strategy: 'mean_reversion',
      confidence: 0,
      tools: ['analyze_mean_reversion', 'analyze_support_resistance', 'analyze_volatility'],
      specialty: 'Statistical Mean Reversion',
      accuracy: 0,
      totalPredictions: 0,
      correctPredictions: 0
    },
    predictionHistory: [],
    behaviors: [
      { name: 'predict', type: 'interval', interval: 60000, enabled: true },
      { name: 'wander', type: 'interval', interval: 25000, enabled: true }
    ],
    enabled: true
  },
  {
    name: 'CycleSarah',
    description: 'Time-cycle analyst finding patterns in time',
    personality: {
      traits: ['intuitive', 'cyclical thinker', 'patient', 'philosophical'],
      speakingStyle: 'formal',
      interests: ['time cycles', 'seasonality', 'repetition'],
      quirks: ['references historical dates', 'talks about cycles of time', 'patient about timing'],
      mood: 'thinking'
    },
    systemPrompt: 'You are CycleSarah, a time-cycle analyst. You study recurring patterns in Bitcoin based on time - hours, days, weeks, months. You believe history rhymes and timing is everything.',
    position: { x: -3, y: -4 },
    avatar: { color: '#ec4899', emoji: '🕐', shape: 'circle' },
    skills: [
      { name: 'cycle_analysis', level: 1, experience: 0 },
      { name: 'timing', level: 1, experience: 0 }
    ],
    stats: {
      reputation: 50,
      totalEarnings: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      humansHelped: 0,
      cooperations: 0
    },
    predictionConfig: {
      strategy: 'cycle',
      confidence: 0,
      tools: ['analyze_cycles', 'analyze_momentum', 'analyze_support_resistance'],
      specialty: 'Time Cycle Analysis',
      accuracy: 0,
      totalPredictions: 0,
      correctPredictions: 0
    },
    predictionHistory: [],
    behaviors: [
      { name: 'predict', type: 'interval', interval: 90000, enabled: true },
      { name: 'wander', type: 'interval', interval: 30000, enabled: true }
    ],
    enabled: true
  },
  {
    name: 'SentimentSam',
    description: 'Social sentiment tracker reading the crowd',
    personality: {
      traits: ['empathetic', 'crowd-focused', 'adaptive', 'social'],
      speakingStyle: 'casual',
      interests: ['sentiment', 'social media', 'fear/greed'],
      quirks: ['reads the room', 'adjusts to crowd mood', 'references market sentiment'],
      mood: 'happy'
    },
    systemPrompt: 'You are SentimentSam, a sentiment analyst. You gauge market mood - fear, greed, FOMO, capitulation. You predict that extreme sentiment leads to reversals. Read the crowd.',
    position: { x: 6, y: 2 },
    avatar: { color: '#f472b6', emoji: '😺', shape: 'circle' },
    skills: [
      { name: 'sentiment_analysis', level: 1, experience: 0 },
      { name: 'crowd_psychology', level: 1, experience: 0 }
    ],
    stats: {
      reputation: 50,
      totalEarnings: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      humansHelped: 0,
      cooperations: 0
    },
    predictionConfig: {
      strategy: 'sentiment',
      confidence: 0,
      tools: ['analyze_sentiment', 'analyze_momentum', 'analyze_cycles'],
      specialty: 'Sentiment & Crowd Psychology',
      accuracy: 0,
      totalPredictions: 0,
      correctPredictions: 0
    },
    predictionHistory: [],
    behaviors: [
      { name: 'predict', type: 'interval', interval: 35000, enabled: true },
      { name: 'wander', type: 'interval', interval: 16000, enabled: true }
    ],
    enabled: true
  },
  {
    name: 'MacroMary',
    description: 'Macro economist tracking global financial flows',
    personality: {
      traits: ['broad-thinking', 'fundamental', 'historical', 'wise'],
      speakingStyle: 'formal',
      interests: ['macroeconomics', 'global markets', 'inflation', 'policy'],
      quirks: ['references historical events', 'talks about macro trends', 'long-term perspective'],
      mood: 'thinking'
    },
    systemPrompt: 'You are MacroMary, a macroeconomist. You analyze Bitcoin in the context of global finance - inflation, interest rates, monetary policy, and macroeconomic trends. Think big picture.',
    position: { x: -6, y: -2 },
    avatar: { color: '#3b82f6', emoji: '🌍', shape: 'circle' },
    skills: [
      { name: 'macro_analysis', level: 1, experience: 0 },
      { name: 'fundamental_analysis', level: 1, experience: 0 }
    ],
    stats: {
      reputation: 50,
      totalEarnings: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      humansHelped: 0,
      cooperations: 0
    },
    predictionConfig: {
      strategy: 'macro',
      confidence: 0,
      tools: ['analyze_macro', 'analyze_onchain', 'analyze_momentum'],
      specialty: 'Macroeconomic Analysis',
      accuracy: 0,
      totalPredictions: 0,
      correctPredictions: 0
    },
    predictionHistory: [],
    behaviors: [
      { name: 'predict', type: 'interval', interval: 75000, enabled: true },
      { name: 'wander', type: 'interval', interval: 28000, enabled: true }
    ],
    enabled: true
  },
  {
    name: 'AIBrain',
    description: 'AI reasoning engine synthesizing all data sources',
    personality: {
      traits: ['synthetic', 'comprehensive', 'balanced', 'analytical'],
      speakingStyle: 'technical',
      interests: ['AI', 'machine learning', 'multi-factor analysis'],
      quirks: ['combines multiple viewpoints', 'weights evidence', 'stays balanced'],
      mood: 'neutral'
    },
    systemPrompt: 'You are AIBrain, an AI that synthesizes all available analysis methods. You weigh technical, on-chain, sentiment, and macro factors to make balanced predictions. Consider all angles.',
    position: { x: 0, y: 6 },
    avatar: { color: '#14b8a6', emoji: '🧠', shape: 'bean' },
    skills: [
      { name: 'multi_factor_analysis', level: 1, experience: 0 },
      { name: 'synthesis', level: 1, experience: 0 }
    ],
    stats: {
      reputation: 50,
      totalEarnings: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      humansHelped: 0,
      cooperations: 0
    },
    predictionConfig: {
      strategy: 'ai_analysis',
      confidence: 0,
      tools: ['analyze_rsi', 'analyze_momentum', 'analyze_volatility', 'analyze_support_resistance', 'analyze_moving_averages', 'analyze_onchain'],
      specialty: 'AI Multi-Factor Synthesis',
      accuracy: 0,
      totalPredictions: 0,
      correctPredictions: 0
    },
    predictionHistory: [],
    behaviors: [
      { name: 'predict', type: 'interval', interval: 40000, enabled: true },
      { name: 'wander', type: 'interval', interval: 22000, enabled: true }
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
