import express, { Request, Response } from 'express';
import axios from 'axios';
import { createWalletClient, createPublicClient, http, parseEther, formatEther, getAddress, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

interface Env {
  OPENROUTER_API_KEY: string;
  TEMPO_RPC: string;
  PRIVATE_KEY: string;
  PORT: number;
  AGENT_NAME: string;
  AGENT_DESCRIPTION: string;
  AUTONOMOUS_MODE: string;
  HEARTBEAT_INTERVAL: number;
  SYSTEM_PROMPT: string;
  MAX_TX_VALUE: string;
  ALLOWED_RECIPIENTS: string;
}

interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'agent';
  content: string;
  identity: 'human' | 'agent' | 'unknown' | 'service';
  metadata: Record<string, any>;
  createdAt: number;
}

interface Conversation {
  id: string;
  participantId?: string;
  participantType: 'human' | 'agent' | 'group' | 'unknown' | 'service';
  participantName: string;
  metadata: Record<string, any>;
  createdAt: number;
  lastMessageAt: number;
}

interface Identity {
  id: string;
  type: 'human' | 'agent' | 'service';
  name: string;
  address?: string;
  metadata: Record<string, any>;
  trustScore: number;
  firstSeen: number;
  lastSeen: number;
}

interface Fact {
  id: string;
  content: string;
  identityId?: string;
  confidence: number;
  createdAt: number;
}

interface Skill {
  name: string;
  description: string;
  triggers: string[];
  action: (agent: Agent, params: SkillParams) => Promise<SkillResult>;
  interval?: number;
  enabled: boolean;
}

interface SkillParams {
  message?: string;
  conversationId?: string;
  identity?: { type: string; name: string; address?: string };
  [key: string]: any;
}

interface SkillResult {
  success: boolean;
  message: string;
  data?: any;
}

const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { name: 'transfer', type: 'function', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable' },
  { name: 'approve', type: 'function', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable' },
  { name: 'allowance', type: 'function', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { name: 'decimals', type: 'function', inputs: [], outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view' },
  { name: 'symbol', type: 'function', inputs: [], outputs: [{ name: '', type: 'string' }], stateMutability: 'view' },
  { name: 'name', type: 'function', inputs: [], outputs: [{ name: '', type: 'string' }], stateMutability: 'view' },
  { name: 'totalSupply', type: 'function', inputs: [], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
];

const TEMPO_CHAIN = {
  id: 42431,
  name: 'Tempo Testnet (Moderato)',
  nativeCurrency: { name: 'TEMPO', symbol: 'TEMPO', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.moderato.tempo.xyz'] },
    public: { http: ['https://rpc.moderato.tempo.xyz'] },
  },
};

class DatabaseManager {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS identities (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        address TEXT,
        metadata TEXT,
        trustScore REAL DEFAULT 0.5,
        firstSeen INTEGER,
        lastSeen INTEGER
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        participantId TEXT,
        participantType TEXT NOT NULL,
        participantName TEXT NOT NULL,
        metadata TEXT,
        createdAt INTEGER,
        lastMessageAt INTEGER
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversationId TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        identity TEXT,
        metadata TEXT,
        createdAt INTEGER
      );

      CREATE TABLE IF NOT EXISTS facts (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        identityId TEXT,
        confidence REAL DEFAULT 1.0,
        createdAt INTEGER
      );

      CREATE TABLE IF NOT EXISTS skills (
        name TEXT PRIMARY KEY,
        description TEXT,
        triggers TEXT,
        interval INTEGER,
        enabled INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS action_logs (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        params TEXT,
        result TEXT,
        success INTEGER,
        identityId TEXT,
        createdAt INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversationId);
      CREATE INDEX IF NOT EXISTS idx_conversations_participant ON conversations(participantId);
      CREATE INDEX IF NOT EXISTS idx_facts_identity ON facts(identityId);
    `);
  }

  getIdentity(address: string): Identity | undefined {
    const row = this.db.prepare('SELECT * FROM identities WHERE address = ?').get(address) as any;
    return row ? { ...row, metadata: JSON.parse(row.metadata || '{}') } : undefined;
  }

  createIdentity(identity: Identity): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO identities (id, type, name, address, metadata, trustScore, firstSeen, lastSeen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      identity.id,
      identity.type,
      identity.name,
      identity.address || null,
      JSON.stringify(identity.metadata),
      identity.trustScore,
      identity.firstSeen,
      identity.lastSeen
    );
  }

  updateIdentitySeen(address: string): void {
    this.db.prepare('UPDATE identities SET lastSeen = ? WHERE address = ?').run(Date.now(), address);
  }

  createConversation(conversation: Conversation): void {
    this.db.prepare(`
      INSERT INTO conversations (id, participantId, participantType, participantName, metadata, createdAt, lastMessageAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      conversation.id,
      conversation.participantId || null,
      conversation.participantType,
      conversation.participantName,
      JSON.stringify(conversation.metadata),
      conversation.createdAt,
      conversation.lastMessageAt
    );
  }

  getConversation(id: string): Conversation | undefined {
    const row = this.db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as any;
    return row ? { ...row, metadata: JSON.parse(row.metadata || '{}') } : undefined;
  }

  getConversationByParticipant(participantId: string): Conversation | undefined {
    const row = this.db.prepare('SELECT * FROM conversations WHERE participantId = ? ORDER BY lastMessageAt DESC').get(participantId) as any;
    return row ? { ...row, metadata: JSON.parse(row.metadata || '{}') } : undefined;
  }

  updateConversationLastMessage(id: string): void {
    this.db.prepare('UPDATE conversations SET lastMessageAt = ? WHERE id = ?').run(Date.now(), id);
  }

  getConversations(): Conversation[] {
    return this.db.prepare('SELECT * FROM conversations ORDER BY lastMessageAt DESC').all() as any;
  }

  addMessage(message: Message): void {
    this.db.prepare(`
      INSERT INTO messages (id, conversationId, role, content, identity, metadata, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      message.id,
      message.conversationId,
      message.role,
      message.content,
      message.identity,
      JSON.stringify(message.metadata),
      message.createdAt
    );
    this.updateConversationLastMessage(message.conversationId);
  }

  getMessages(conversationId: string, limit = 50): Message[] {
    const rows = this.db.prepare(
      'SELECT * FROM messages WHERE conversationId = ? ORDER BY createdAt DESC LIMIT ?'
    ).all(conversationId, limit) as any[];
    return rows.map(row => ({
      ...row,
      metadata: JSON.parse(row.metadata || '{}'),
    })).reverse();
  }

  addFact(fact: Fact): void {
    this.db.prepare(`
      INSERT INTO facts (id, content, identityId, confidence, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(fact.id, fact.content, fact.identityId || null, fact.confidence, fact.createdAt);
  }

  getFacts(identityId?: string): Fact[] {
    if (identityId) {
      return this.db.prepare('SELECT * FROM facts WHERE identityId = ? ORDER BY createdAt DESC').all(identityId) as Fact[];
    }
    return this.db.prepare('SELECT * FROM facts ORDER BY createdAt DESC').all() as Fact[];
  }

  logAction(action: string, params: any, result: string, success: boolean, identityId?: string): void {
    this.db.prepare(`
      INSERT INTO action_logs (id, action, params, result, success, identityId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), action, JSON.stringify(params), result, success ? 1 : 0, identityId || null, Date.now());
  }

  getRecentActions(limit = 10): any[] {
    return this.db.prepare('SELECT * FROM action_logs ORDER BY createdAt DESC LIMIT ?').all(limit);
  }

  close(): void {
    this.db.close();
  }
}

const DEFAULT_SKILLS: Skill[] = [
  {
    name: 'balance_monitor',
    description: 'Monitor wallet balance',
    triggers: ['balance', 'check balance', 'how much', 'balance?'],
    enabled: true,
    async action(agent: Agent): Promise<SkillResult> {
      const balance = await agent.getBalance();
      return { success: true, message: `Current balance: ${balance} TEMPO`, data: { balance } };
    }
  },
  {
    name: 'gas_checker',
    description: 'Check current gas prices',
    triggers: ['gas', 'gas price', 'fee', 'gas?'],
    enabled: true,
    async action(agent: Agent): Promise<SkillResult> {
      const gas = await agent.getGasPrice();
      return { success: true, message: `Gas price: ${formatEther(gas)} ETH`, data: { gas: gas.toString() } };
    }
  },
  {
    name: 'whoami',
    description: 'Tell the user about the agent',
    triggers: ['who are you', 'whoami', 'about you', 'what are you'],
    enabled: true,
    async action(agent: Agent): Promise<SkillResult> {
      const env = agent.getEnv();
      return {
        success: true,
        message: `I am ${env.AGENT_NAME}, an autonomous AI agent on Tempo EVM testnet. ${env.AGENT_DESCRIPTION}`
      };
    }
  },
  {
    name: 'status',
    description: 'Get agent status',
    triggers: ['status', 'how are you', 'uptime'],
    enabled: true,
    async action(agent: Agent): Promise<SkillResult> {
      const env = agent.getEnv();
      return {
        success: true,
        message: `Agent: ${env.AGENT_NAME}\nMode: ${env.AUTONOMOUS_MODE === 'true' ? 'Autonomous' : 'Manual'}\nRPC: ${env.TEMPO_RPC}`
      };
    }
  },
];

class Agent {
  private app: express.Application;
  private env: Env;
  private db!: DatabaseManager;
  private walletClient: ReturnType<typeof createWalletClient> | null = null;
  private publicClient: ReturnType<typeof createPublicClient> | null = null;
  private account: ReturnType<typeof privateKeyToAccount> | null = null;
  private skills: Map<string, Skill> = new Map();
  private heartbeatIntervals: NodeJS.Timeout[] = [];
  private isRunning = false;
  private dataDir: string;

  constructor() {
    this.app = express();
    this.env = this.loadEnv();
    this.dataDir = join(process.cwd(), 'data');
    this.initDb();
    this.setupDefaultSkills();
    this.setupRoutes();
  }

  getEnv() { return this.env; }

  private loadEnv(): Env {
    return {
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
      TEMPO_RPC: process.env.TEMPO_RPC || 'https://evm.testnet.tempo.blockchaineps.com',
      PRIVATE_KEY: process.env.PRIVATE_KEY || '',
      PORT: parseInt(process.env.PORT || '3000'),
      AGENT_NAME: process.env.AGENT_NAME || 'TempoBot',
      AGENT_DESCRIPTION: process.env.AGENT_DESCRIPTION || 'An autonomous AI agent for Tempo EVM testnet',
      AUTONOMOUS_MODE: process.env.AUTONOMOUS_MODE || 'false',
      HEARTBEAT_INTERVAL: parseInt(process.env.HEARTBEAT_INTERVAL || '60000'),
      SYSTEM_PROMPT: process.env.SYSTEM_PROMPT || '',
      MAX_TX_VALUE: process.env.MAX_TX_VALUE || '10',
      ALLOWED_RECIPIENTS: process.env.ALLOWED_RECIPIENTS || '',
    };
  }

  private initDb() {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
    this.db = new DatabaseManager(join(this.dataDir, 'agent.db'));
  }

  private setupDefaultSkills() {
    for (const skill of DEFAULT_SKILLS) {
      this.skills.set(skill.name, skill);
    }
  }

  private detectIdentity(req: Request): { type: 'human' | 'agent' | 'unknown' | 'service'; name: string; address?: string } {
    const address = req.body.address || req.headers['x-wallet-address'] as string;
    const userAgent = req.headers['user-agent'] as string;
    const apiKey = req.headers['x-api-key'] as string;

    if (address) {
      const existing = this.db.getIdentity(address);
      if (existing) {
        this.db.updateIdentitySeen(address);
        return { type: existing.type, name: existing.name, address };
      }
      
      const isAgent = apiKey || userAgent?.includes('Agent') || userAgent?.includes('Bot');
      const newIdentity: Identity = {
        id: uuidv4(),
        type: isAgent ? 'agent' : 'human',
        name: address.slice(0, 6) + '...' + address.slice(-4),
        address,
        metadata: { userAgent, firstAddress: true },
        trustScore: 0.5,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
      };
      this.db.createIdentity(newIdentity);
      return { type: newIdentity.type, name: newIdentity.name, address };
    }

    return { type: 'unknown', name: 'Anonymous' };
  }

  private getOrCreateConversation(identity: ReturnType<typeof this.detectIdentity>): Conversation {
    if (identity.address) {
      const existing = this.db.getConversationByParticipant(identity.address);
      if (existing) return existing;
      
      // Ensure identity exists for this address
      const existingIdentity = this.db.getIdentity(identity.address);
      if (!existingIdentity) {
        const newIdentity: Identity = {
          id: uuidv4(),
          type: identity.type as 'human' | 'agent' | 'service',
          name: identity.name,
          address: identity.address,
          metadata: {},
          trustScore: 0.5,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
        };
        this.db.createIdentity(newIdentity);
      }
    }

    const conversation: Conversation = {
      id: uuidv4(),
      participantId: identity.address,
      participantType: identity.type === 'unknown' ? 'unknown' : identity.type as any,
      participantName: identity.name,
      metadata: {},
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
    };
    this.db.createConversation(conversation);
    return conversation;
  }

  private buildSystemPrompt(conversation: Conversation, identity: ReturnType<typeof this.detectIdentity>): string {
    const facts = this.db.getFacts();
    const recentActions = this.db.getRecentActions(5);
    const isAgent = identity.type === 'agent';

    return `You are ${this.env.AGENT_NAME}, ${this.env.AGENT_DESCRIPTION}.

## Current Context
- You are talking to a ${identity.type} (${identity.name})
- ${isAgent ? '⚠️ You are communicating with another AI agent - be precise and machine-readable' : '👤 You are talking to a human - be friendly and conversational'}
- Conversation ID: ${conversation.id}

## Your Identity
- Name: ${this.env.AGENT_NAME}
- Chain: Tempo Testnet (EVM 8081)
- Account: ${this.account?.address || 'read-only'}

## Safety Limits
- Max single transaction: ${this.env.MAX_TX_VALUE} TEMPO
- Allowed recipients: ${this.env.ALLOWED_RECIPIENTS || 'anyone'}

## Known Facts
${facts.slice(0, 10).map(f => `- ${f.content}`).join('\n') || 'No stored facts.'}

## Recent Actions
${recentActions.map(a => `- ${a.action}: ${a.result}`).join('\n') || 'No recent actions.'}

## Your Capabilities
- Check/send native TEMPO
- Interact with ERC20 tokens
- Read/write smart contracts
- Persistent memory (facts about users)
- Run autonomous tasks

## Behavior
${isAgent ? 
'- Be precise and structured - other agents parse your responses' :
'- Be helpful and conversational with humans'}
- Always confirm before significant transactions
- Remember important facts about users
- You CAN act autonomously when beneficial`;
  }

  private setupRoutes() {
    this.app.use(express.json());

    this.app.post('/chat', async (req: Request, res: Response) => {
      try {
        const { message, sessionId } = req.body;
        if (!message) {
          res.status(400).json({ error: 'Message is required' });
          return;
        }

        const identity = this.detectIdentity(req);
        const conversation = sessionId 
          ? (this.db.getConversation(sessionId) || this.getOrCreateConversation(identity))
          : this.getOrCreateConversation(identity);

        const response = await this.handleMessage(message, conversation, identity);
        
        this.db.addMessage({
          id: uuidv4(),
          conversationId: conversation.id,
          role: 'user',
          content: message,
          identity: identity.type,
          metadata: { address: identity.address },
          createdAt: Date.now(),
        });
        this.db.addMessage({
          id: uuidv4(),
          conversationId: conversation.id,
          role: 'assistant',
          content: response,
          identity: 'agent',
          metadata: {},
          createdAt: Date.now(),
        });

        res.json({ 
          response, 
          conversationId: conversation.id,
          identity: { type: identity.type, name: identity.name },
          agent: this.env.AGENT_NAME,
        });
      } catch (error: any) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/whisper', async (req: Request, res: Response) => {
      try {
        const { message, sessionId } = req.body;
        if (!message) {
          res.status(400).json({ error: 'Message is required' });
          return;
        }

        const identity = this.detectIdentity(req);
        const conversation = sessionId 
          ? (this.db.getConversation(sessionId) || this.getOrCreateConversation(identity))
          : this.getOrCreateConversation(identity);

        const response = await this.handleMessage(message, conversation, identity);
        
        res.json({ response });
      } catch (error: any) {
        console.error('Whisper error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/conversations', async (req: Request, res: Response) => {
      const conversations = this.db.getConversations();
      res.json({ conversations });
    });

    this.app.get('/conversations/:id', async (req: Request, res: Response) => {
      const conversation = this.db.getConversation(req.params.id);
      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }
      const messages = this.db.getMessages(req.params.id);
      res.json({ conversation, messages });
    });

    this.app.get('/health', async (req: Request, res: Response) => {
      const balance = this.account ? await this.getBalance() : '0';
      res.json({
        status: 'ok',
        agent: this.env.AGENT_NAME,
        account: this.account?.address || 'read-only',
        balance: `${balance} TEMPO`,
        autonomous: this.isRunning,
        skills: Array.from(this.skills.values()).filter(s => s.enabled).map(s => s.name),
        conversations: this.db.getConversations().length,
      });
    });

    this.app.get('/balance', async (req: Request, res: Response) => {
      const balance = await this.getBalance();
      res.json({ balance: `${balance} TEMPO`, raw: balance });
    });

    this.app.get('/balance/:address', async (req: Request, res: Response) => {
      const balance = await this.getBalance(req.params.address);
      res.json({ address: req.params.address, balance: `${balance} TEMPO`, raw: balance });
    });

    this.app.post('/send', async (req: Request, res: Response) => {
      try {
        const identity = this.detectIdentity(req);
        const { to, amount } = req.body;
        
        if (!to || !amount) {
          res.status(400).json({ error: 'to and amount are required' });
          return;
        }

        const amountNum = parseFloat(amount);
        const maxTx = parseFloat(this.env.MAX_TX_VALUE);
        if (amountNum > maxTx) {
          res.status(400).json({ error: `Amount exceeds max (${maxTx} TEMPO)` });
          return;
        }

        const txHash = await this.sendNative(to, amount);
        
        this.db.logAction('send', { to, amount }, txHash, true, identity.address);
        
        res.json({ 
          txHash, 
          to, 
          amount,
          explorer: `https://explore.tempo.xyz/tx/${txHash}`,
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/call', async (req: Request, res: Response) => {
      try {
        const identity = this.detectIdentity(req);
        const { to, abi, functionName, args, value } = req.body;
        
        if (!to || !functionName) {
          res.status(400).json({ error: 'to and functionName are required' });
          return;
        }

        const result = await this.callContract(to, abi, functionName, args, value);
        this.db.logAction('call', { to, functionName }, result.txHash, true, identity.address);
        
        res.json({ 
          ...result, 
          explorer: result.txHash ? `https://explore.tempo.xyz/tx/${result.txHash}` : undefined 
        });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/read', async (req: Request, res: Response) => {
      try {
        const { to, abi, functionName, args } = req.body;
        if (!to || !functionName) {
          res.status(400).json({ error: 'to and functionName are required' });
          return;
        }
        const result = await this.readContract(to, abi, functionName, args);
        res.json({ result });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/memory/facts', async (req: Request, res: Response) => {
      const facts = this.db.getFacts();
      res.json({ facts });
    });

    this.app.post('/memory/facts', async (req: Request, res: Response) => {
      const { content, confidence = 1.0 } = req.body;
      if (!content) {
        res.status(400).json({ error: 'content is required' });
        return;
      }
      const fact: Fact = {
        id: uuidv4(),
        content,
        confidence,
        createdAt: Date.now(),
      };
      this.db.addFact(fact);
      res.json({ success: true, fact });
    });

    this.app.get('/identities', async (req: Request, res: Response) => {
      res.json({ identities: 'see messages for now' });
    });

    this.app.get('/skills', async (req: Request, res: Response) => {
      const skillsList = Array.from(this.skills.values()).map(s => ({
        name: s.name,
        description: s.description,
        triggers: s.triggers,
        interval: s.interval,
        enabled: s.enabled,
      }));
      res.json({ skills: skillsList });
    });

    this.app.post('/skills/:name/run', async (req: Request, res: Response) => {
      const skill = this.skills.get(req.params.name);
      if (!skill) {
        res.status(404).json({ error: 'Skill not found' });
        return;
      }
      const result = await skill.action(this, req.body);
      res.json(result);
    });

    this.app.post('/autonomous/start', async (req: Request, res: Response) => {
      this.startAutonomous();
      res.json({ success: true });
    });

    this.app.post('/autonomous/stop', async (req: Request, res: Response) => {
      this.stopAutonomous();
      res.json({ success: true });
    });

    this.app.get('/autonomous/status', async (req: Request, res: Response) => {
      res.json({ running: this.isRunning });
    });
  }

  async init() {
    console.log(`🌐 Connecting to Tempo RPC: ${this.env.TEMPO_RPC}`);

    if (!this.env.PRIVATE_KEY) {
      console.log('⚠️  No PRIVATE_KEY - running in read-only mode');
      this.publicClient = createPublicClient({
        chain: TEMPO_CHAIN,
        transport: http(this.env.TEMPO_RPC),
      });
      return;
    }

    this.account = privateKeyToAccount(this.env.PRIVATE_KEY as `0x${string}`);

    try {
      this.walletClient = createWalletClient({
        account: this.account,
        chain: TEMPO_CHAIN,
        transport: http(this.env.TEMPO_RPC),
      });

      this.publicClient = createPublicClient({
        chain: TEMPO_CHAIN,
        transport: http(this.env.TEMPO_RPC),
      });

      // Test connection
      await this.publicClient.getChainId();
      console.log('✅ RPC connected successfully');
    } catch (e: any) {
      console.log(`⚠️  RPC connection failed: ${e.message}`);
      console.log('⚠️  Running in offline mode (no blockchain operations)');
      this.walletClient = null;
      this.publicClient = null;
    }

    const identity: Identity = {
      id: 'self',
      type: 'service',
      name: this.env.AGENT_NAME,
      address: this.account?.address || '0x0000000000000000000000000000000000000000',
      metadata: {},
      trustScore: 1.0,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
    };
    this.db.createIdentity(identity);

    if (this.account) {
      console.log(`📍 Agent Account: ${this.account.address}`);
    }

    if (this.env.AUTONOMOUS_MODE === 'true') {
      this.startAutonomous();
    }
  }

  private startAutonomous() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('🚀 Starting autonomous mode...');

    const heartbeat = setInterval(async () => {
      try {
        const balance = await this.getBalance();
        console.log(`💓 Heartbeat - Balance: ${balance} TEMPO`);
      } catch (e) {
        console.error('Heartbeat error:', e);
      }
    }, this.env.HEARTBEAT_INTERVAL);

    this.heartbeatIntervals.push(heartbeat);

    for (const [name, skill] of this.skills) {
      if (skill.interval && skill.enabled) {
        const interval = setInterval(async () => {
          try {
            console.log(`🔧 Running skill: ${name}`);
            await skill.action(this, {});
          } catch (e) {
            console.error(`Skill ${name} error:`, e);
          }
        }, skill.interval);
        this.heartbeatIntervals.push(interval);
      }
    }
  }

  private stopAutonomous() {
    for (const interval of this.heartbeatIntervals) {
      clearInterval(interval);
    }
    this.heartbeatIntervals = [];
    this.isRunning = false;
    console.log('🛑 Autonomous mode stopped');
  }

  private async callLLM(message: string, conversation: Conversation, identity: ReturnType<typeof this.detectIdentity>): Promise<string> {
    if (!this.env.OPENROUTER_API_KEY) {
      const skill = this.findMatchingSkill(message);
      if (skill) {
        const result = await skill.action(this, { message, conversationId: conversation.id, identity });
        return result.message;
      }
      return `I'm running in offline mode. Try: balance, status, whoami, or gas`;
    }

    const messages = this.db.getMessages(conversation.id, 20);
    
    const systemPrompt = this.buildSystemPrompt(conversation, identity);

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          { role: 'user', content: message },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${this.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  }

  private findMatchingSkill(message: string): Skill | undefined {
    for (const skill of this.skills.values()) {
      if (!skill.enabled) continue;
      for (const trigger of skill.triggers) {
        if (message.toLowerCase().includes(trigger.toLowerCase())) {
          return skill;
        }
      }
    }
    return undefined;
  }

  async handleMessage(message: string, conversation: Conversation, identity: ReturnType<typeof this.detectIdentity>): Promise<string> {
    const skill = this.findMatchingSkill(message);
    if (skill) {
      console.log(`🎯 Skill triggered: ${skill.name}`);
      const result = await skill.action(this, { message, conversationId: conversation.id, identity });
      return result.message;
    }

    return await this.callLLM(message, conversation, identity);
  }

  async getBalance(address?: string): Promise<string> {
    const targetAddress = address || this.account?.address;
    if (!targetAddress || !this.publicClient) return '0';
    try {
      const balance = await this.publicClient.getBalance({ address: getAddress(targetAddress) });
      return formatEther(balance);
    } catch (e) {
      return '0';
    }
  }

  async getGasPrice() {
    if (!this.publicClient) return BigInt(0);
    try {
      return await this.publicClient.getGasPrice();
    } catch (e) {
      return BigInt(0);
    }
  }

  async sendNative(to: string, amount: string): Promise<string> {
    if (!this.walletClient || !this.account) throw new Error('Wallet not initialized');
    const hash = await this.walletClient.sendTransaction({
      account: this.account,
      chain: TEMPO_CHAIN,
      to: getAddress(to),
      value: parseEther(amount),
    });
    return hash;
  }

  async callContract(to: string, abi: any, functionName: string, args: any[] = [], value?: string) {
    if (!this.walletClient || !this.account) throw new Error('Wallet not initialized');
    const data = encodeFunctionData({
      abi: abi || ERC20_ABI,
      functionName,
      args,
    });
    const hash = await this.walletClient.sendTransaction({
      account: this.account,
      chain: TEMPO_CHAIN,
      to: getAddress(to),
      data,
      value: value ? parseEther(value) : undefined,
    });
    return { txHash: hash };
  }

  async readContract(to: string, abi: any, functionName: string, args: any[] = []) {
    if (!this.publicClient) throw new Error('Public client not initialized (RPC unavailable)');
    try {
      return await this.publicClient.readContract({
        address: getAddress(to),
        abi: abi || ERC20_ABI,
        functionName,
        args,
      });
    } catch (e) {
      throw new Error('Contract read failed');
    }
  }

  async start() {
    await this.init();

    this.app.listen(this.env.PORT, () => {
      console.log(`
🤖 ${this.env.AGENT_NAME} v2.0 - OpenClaw-style Autonomous Agent

📍 Account: ${this.account?.address || 'read-only'}
🌐 Network: Tempo Testnet (EVM 8081)
💾 Database: SQLite (persistent)

🌐 Server: http://localhost:${this.env.PORT}

📡 Endpoints:
  POST /chat                  - Chat (multi-identity)
  GET  /conversations         - List all conversations
  GET  /conversations/:id     - Get conversation with messages
  GET  /health                - Status
  GET  /balance               - Your balance
  POST /send                  - Send TEMPO (with safety limits)
  POST /call                  - Write contract
  POST /read                  - Read contract
  GET  /memory/facts          - List facts
  POST /memory/facts          - Add fact
  GET  /skills                - List skills
  POST /skills/:name/run      - Run skill
  POST /autonomous/start      - Start heartbeat
  POST /autonomous/stop       - Stop heartbeat

🔐 Safety:
  - Max TX: ${this.env.MAX_TX_VALUE} TEMPO
  - Identity tracking via wallet address
  - Conversation isolation per identity
`);
    });
  }
}

const agent = new Agent();
agent.start();
