import { Server as SocketServer } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { createWalletClient, createPublicClient, http, parseEther, formatEther, getAddress, encodeFunctionData } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import {
  Env, AgentConfig, RuntimeAgent, Message, Conversation, Identity, Fact,
  WebSocketMessage, DEFAULT_AGENTS, Task, Transaction
} from './types.js';
import { BehaviorEngine } from './behaviors.js';
import { predictionEngine } from './predictionEngine.js';
import { btcPriceService } from './btcPrice.js';

dotenv.config();

const TEMPO_CHAIN = {
  id: 31337,
  name: 'Local Anvil',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.TEMPO_RPC || 'http://localhost:8545'] },
    public: { http: [process.env.TEMPO_RPC || 'http://localhost:8545'] },
  },
};

const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { name: 'transfer', type: 'function', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable' },
  { name: 'decimals', type: 'function', inputs: [], outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view' },
  { name: 'transferFrom', type: 'function', inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable' },
  { name: 'approve', type: 'function', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable' },
];

const PATHUSD_ADDRESS = process.env.USDC_ADDRESS as string || '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const;

class DatabaseManager {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        personality TEXT,
        systemPrompt TEXT,
        walletAddress TEXT,
        privateKey TEXT,
        position TEXT,
        avatar TEXT,
        skills TEXT,
        stats TEXT,
        behaviors TEXT,
        enabled INTEGER DEFAULT 1,
        createdAt INTEGER,
        lastActive INTEGER
      );

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
        agentId TEXT,
        metadata TEXT,
        createdAt INTEGER,
        lastMessageAt INTEGER
      );

      CREATE TABLE IF NOT EXISTS predictions (
        id TEXT PRIMARY KEY,
        round INTEGER NOT NULL,
        agentId TEXT NOT NULL,
        predictedPrice REAL NOT NULL,
        actualPrice REAL,
        isCorrect INTEGER,
        voteWeight INTEGER DEFAULT 1,
        createdAt INTEGER,
        resolvedAt INTEGER
      );

      CREATE TABLE IF NOT EXISTS dao_votes (
        id TEXT PRIMARY KEY,
        agentId TEXT NOT NULL,
        proposalId TEXT NOT NULL,
        vote TEXT NOT NULL,
        weight INTEGER DEFAULT 1,
        createdAt INTEGER
      );
    `);

    const columns = this.db.prepare('PRAGMA table_info(agents)').all() as any[];
    const columnNames = columns.map(c => c.name);
    if (!columnNames.includes('stats')) {
      this.db.exec(`ALTER TABLE agents ADD COLUMN stats TEXT`);
    }
    if (!columnNames.includes('behaviors')) {
      this.db.exec(`ALTER TABLE agents ADD COLUMN behaviors TEXT`);
    }
  }

  getAgents(): AgentConfig[] {
    const rows = this.db.prepare('SELECT * FROM agents WHERE enabled = 1').all() as any[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      personality: JSON.parse(row.personality || '{}'),
      systemPrompt: row.systemPrompt,
      walletAddress: row.walletAddress,
      privateKey: row.privateKey,
      position: JSON.parse(row.position || '{"x":0,"y":0}'),
      avatar: JSON.parse(row.avatar || '{}'),
      skills: JSON.parse(row.skills || '[]'),
      stats: JSON.parse(row.stats || '{"reputation":50,"totalEarnings":0,"tasksCompleted":0,"tasksFailed":0,"humansHelped":0,"cooperations":0}'),
      behaviors: JSON.parse(row.behaviors || '[]'),
      enabled: !!row.enabled,
      createdAt: row.createdAt,
      lastActive: row.lastActive
    }));
  }

  getAgent(id: string): AgentConfig | undefined {
    const row = this.db.prepare('SELECT * FROM agents WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      personality: JSON.parse(row.personality || '{}'),
      systemPrompt: row.systemPrompt,
      walletAddress: row.walletAddress,
      privateKey: row.privateKey,
      position: JSON.parse(row.position || '{"x":0,"y":0}'),
      avatar: JSON.parse(row.avatar || '{}'),
      skills: JSON.parse(row.skills || '[]'),
      stats: JSON.parse(row.stats || '{"reputation":50,"totalEarnings":0,"tasksCompleted":0,"tasksFailed":0,"humansHelped":0,"cooperations":0}'),
      behaviors: JSON.parse(row.behaviors || '[]'),
      enabled: !!row.enabled,
      createdAt: row.createdAt,
      lastActive: row.lastActive
    };
  }

  createAgent(agent: AgentConfig): void {
    this.db.prepare(`
      INSERT INTO agents (id, name, description, personality, systemPrompt, walletAddress, privateKey, position, avatar, skills, stats, behaviors, enabled, createdAt, lastActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      agent.id, agent.name, agent.description, JSON.stringify(agent.personality), agent.systemPrompt,
      agent.walletAddress || null, agent.privateKey || null, JSON.stringify(agent.position),
      JSON.stringify(agent.avatar), JSON.stringify(agent.skills), JSON.stringify(agent.stats),
      JSON.stringify(agent.behaviors), agent.enabled ? 1 : 0, agent.createdAt, agent.lastActive
    );
  }

  updateAgent(id: string, updates: Partial<AgentConfig>): void {
    const sets: string[] = [];
    const vals: any[] = [];
    if (updates.name) { sets.push('name = ?'); vals.push(updates.name); }
    if (updates.description) { sets.push('description = ?'); vals.push(updates.description); }
    if (updates.personality) { sets.push('personality = ?'); vals.push(JSON.stringify(updates.personality)); }
    if (updates.systemPrompt) { sets.push('systemPrompt = ?'); vals.push(updates.systemPrompt); }
    if (updates.position) { sets.push('position = ?'); vals.push(JSON.stringify(updates.position)); }
    if (updates.avatar) { sets.push('avatar = ?'); vals.push(JSON.stringify(updates.avatar)); }
    if (updates.skills) { sets.push('skills = ?'); vals.push(JSON.stringify(updates.skills)); }
    if (updates.stats) { sets.push('stats = ?'); vals.push(JSON.stringify(updates.stats)); }
    if (updates.behaviors) { sets.push('behaviors = ?'); vals.push(JSON.stringify(updates.behaviors)); }
    if (updates.enabled !== undefined) { sets.push('enabled = ?'); vals.push(updates.enabled ? 1 : 0); }
    sets.push('lastActive = ?'); vals.push(Date.now());
    vals.push(id);
    this.db.prepare(`UPDATE agents SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  }

  deleteAgent(id: string): void {
    this.db.prepare('UPDATE agents SET enabled = 0 WHERE id = ?').run(id);
  }

  getConversations(agentId?: string): Conversation[] {
    let rows;
    if (agentId) {
      rows = this.db.prepare('SELECT * FROM conversations WHERE agentId = ? ORDER BY lastMessageAt DESC').all(agentId) as any[];
    } else {
      rows = this.db.prepare('SELECT * FROM conversations ORDER BY lastMessageAt DESC').all() as any[];
    }
    return rows.map(row => ({
      id: row.id,
      participantId: row.participantId,
      participantType: row.participantType,
      participantName: row.participantName,
      agentId: row.agentId,
      metadata: JSON.parse(row.metadata || '{}'),
      createdAt: row.createdAt,
      lastMessageAt: row.lastMessageAt
    }));
  }

  getOrCreateConversation(participantId: string, participantType: string, participantName: string, agentId?: string): Conversation {
    let row = this.db.prepare(
      'SELECT * FROM conversations WHERE participantId = ? AND agentId = ? ORDER BY lastMessageAt DESC'
    ).get(participantId, agentId || null) as any;

    if (row) {
      return {
        id: row.id,
        participantId: row.participantId,
        participantType: row.participantType,
        participantName: row.participantName,
        agentId: row.agentId,
        metadata: JSON.parse(row.metadata || '{}'),
        createdAt: row.createdAt,
        lastMessageAt: row.lastMessageAt
      };
    }

    const conversation: Conversation = {
      id: uuidv4(),
      participantId,
      participantType: participantType as any,
      participantName,
      agentId,
      metadata: {},
      createdAt: Date.now(),
      lastMessageAt: Date.now()
    };

    this.db.prepare(`
      INSERT INTO conversations (id, participantId, participantType, participantName, agentId, metadata, createdAt, lastMessageAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      conversation.id, conversation.participantId, conversation.participantType,
      conversation.participantName, conversation.agentId || null,
      JSON.stringify(conversation.metadata), conversation.createdAt, conversation.lastMessageAt
    );

    return conversation;
  }

  addMessage(message: Message): void {
    this.db.prepare(`
      INSERT INTO messages (id, conversationId, role, content, identity, metadata, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(message.id, message.conversationId, message.role, message.content, message.identity, JSON.stringify(message.metadata), message.createdAt);
    this.db.prepare('UPDATE conversations SET lastMessageAt = ? WHERE id = ?').run(Date.now(), message.conversationId);
  }

  getMessages(conversationId: string, limit = 50): Message[] {
    const rows = this.db.prepare('SELECT * FROM messages WHERE conversationId = ? ORDER BY createdAt DESC LIMIT ?').all(conversationId, limit) as any[];
    return rows.map(row => ({
      id: row.id,
      conversationId: row.conversationId,
      role: row.role,
      content: row.content,
      identity: row.identity,
      metadata: JSON.parse(row.metadata || '{}'),
      createdAt: row.createdAt
    })).reverse();
  }

  getFacts(identityId?: string): Fact[] {
    if (identityId) {
      return this.db.prepare('SELECT * FROM facts WHERE identityId = ? ORDER BY createdAt DESC').all(identityId) as Fact[];
    }
    return this.db.prepare('SELECT * FROM facts ORDER BY createdAt DESC').all() as Fact[];
  }

  addFact(fact: Fact): void {
    this.db.prepare('INSERT INTO facts (id, content, identityId, confidence, createdAt) VALUES (?, ?, ?, ?, ?)')
      .run(fact.id, fact.content, fact.identityId || null, fact.confidence, fact.createdAt);
  }

  getTasks(status?: string): Task[] {
    let rows;
    if (status) {
      rows = this.db.prepare('SELECT * FROM tasks WHERE status = ? ORDER BY createdAt DESC').all(status) as any[];
    } else {
      rows = this.db.prepare('SELECT * FROM tasks ORDER BY createdAt DESC').all() as any[];
    }
    return rows.map(row => ({
      id: row.id,
      creatorId: row.creatorId,
      creatorType: row.creatorType,
      agentId: row.agentId,
      type: row.type,
      description: row.description,
      reward: row.reward,
      requiredSkill: row.requiredSkill,
      status: row.status,
      proof: row.proof,
      createdAt: row.createdAt,
      completedAt: row.completedAt
    }));
  }

  getTask(id: string): Task | undefined {
    const row = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    if (!row) return undefined;
    return {
      id: row.id,
      creatorId: row.creatorId,
      creatorType: row.creatorType,
      agentId: row.agentId,
      type: row.type,
      description: row.description,
      reward: row.reward,
      requiredSkill: row.requiredSkill,
      status: row.status,
      proof: row.proof,
      createdAt: row.createdAt,
      completedAt: row.completedAt
    };
  }

  createTask(task: Task): void {
    this.db.prepare(`
      INSERT INTO tasks (id, creatorId, creatorType, agentId, type, description, reward, requiredSkill, status, proof, createdAt, completedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      task.id, task.creatorId, task.creatorType, task.agentId || null, task.type,
      task.description, task.reward, task.requiredSkill || null, task.status,
      task.proof || null, task.createdAt, task.completedAt || null
    );
  }

  updateTask(id: string, updates: Partial<Task>): void {
    const sets: string[] = [];
    const vals: any[] = [];
    if (updates.agentId !== undefined) { sets.push('agentId = ?'); vals.push(updates.agentId || null); }
    if (updates.status) { sets.push('status = ?'); vals.push(updates.status); }
    if (updates.proof) { sets.push('proof = ?'); vals.push(updates.proof); }
    if (updates.completedAt) { sets.push('completedAt = ?'); vals.push(updates.completedAt); }
    vals.push(id);
    this.db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  }

  getTasksForAgent(agentId: string): Task[] {
    const rows = this.db.prepare('SELECT * FROM tasks WHERE agentId = ? ORDER BY createdAt DESC').all(agentId) as any[];
    return rows.map(row => ({
      id: row.id,
      creatorId: row.creatorId,
      creatorType: row.creatorType,
      agentId: row.agentId,
      type: row.type,
      description: row.description,
      reward: row.reward,
      requiredSkill: row.requiredSkill,
      status: row.status,
      proof: row.proof,
      createdAt: row.createdAt,
      completedAt: row.completedAt
    }));
  }

  addTransaction(tx: Transaction): void {
    this.db.prepare(`
      INSERT INTO transactions (id, fromType, fromId, toType, toId, amount, type, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(tx.id, tx.fromType, tx.fromId, tx.toType, tx.toId, tx.amount, tx.type, tx.createdAt);
  }

  getTransactions(agentId?: string): Transaction[] {
    let rows;
    if (agentId) {
      rows = this.db.prepare('SELECT * FROM transactions WHERE fromId = ? OR toId = ? ORDER BY createdAt DESC').all(agentId, agentId) as any[];
    } else {
      rows = this.db.prepare('SELECT * FROM transactions ORDER BY createdAt DESC LIMIT 100').all() as any[];
    }
    return rows.map(row => ({
      id: row.id,
      fromType: row.fromType,
      fromId: row.fromId,
      toType: row.toType,
      toId: row.toId,
      amount: row.amount,
      type: row.type,
      createdAt: row.createdAt
    }));
  }

  addPrediction(prediction: { id: string; round: number; agentId: string; predictedPrice: number }): void {
    this.db.prepare(`
      INSERT INTO predictions (id, round, agentId, predictedPrice, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(prediction.id, prediction.round, prediction.agentId, prediction.predictedPrice, Date.now());
  }

  resolvePredictions(round: number, actualPrice: number): { agentId: string; isCorrect: boolean; voteWeight: number }[] {
    const predictions = this.db.prepare('SELECT * FROM predictions WHERE round = ? AND actualPrice IS NULL').all(round) as any[];
    const results: { agentId: string; isCorrect: boolean; voteWeight: number }[] = [];

    for (const pred of predictions) {
      const isCorrect = Math.abs(pred.predictedPrice - actualPrice) / actualPrice < 0.02;
      const voteWeight = isCorrect ? 2 : 1;
      
      this.db.prepare('UPDATE predictions SET actualPrice = ?, isCorrect = ?, voteWeight = ?, resolvedAt = ? WHERE id = ?')
        .run(actualPrice, isCorrect ? 1 : 0, voteWeight, Date.now(), pred.id);
      
      results.push({ agentId: pred.agentId, isCorrect, voteWeight });
    }
    return results;
  }

  getAgentVoteWeight(agentId: string): number {
    const row = this.db.prepare(`
      SELECT SUM(voteWeight) as totalWeight FROM predictions 
      WHERE agentId = ? AND isCorrect = 1
    `).get(agentId) as any;
    return (row?.totalWeight || 0) + 1;
  }

  getAgentCorrectPredictions(agentId: string): number {
    const row = this.db.prepare(`
      SELECT COUNT(*) as count FROM predictions 
      WHERE agentId = ? AND isCorrect = 1
    `).get(agentId) as any;
    return row?.count || 0;
  }

  getRoundPredictions(round: number): any[] {
    return this.db.prepare('SELECT * FROM predictions WHERE round = ?').all(round);
  }

  getCurrentRound(): number {
    const ROUND_DURATION = 5 * 60 * 1000;
    return Math.floor(Date.now() / ROUND_DURATION);
  }

  addVote(vote: { id: string; agentId: string; proposalId: string; vote: string; weight: number }): void {
    this.db.prepare(`
      INSERT INTO dao_votes (id, agentId, proposalId, vote, weight, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(vote.id, vote.agentId, vote.proposalId, vote.vote, vote.weight, Date.now());
  }

  getVotes(proposalId: string): any[] {
    return this.db.prepare('SELECT * FROM dao_votes WHERE proposalId = ?').all(proposalId);
  }

  close(): void {
    this.db.close();
  }
}

class MultiAgentSystem {
  private app: express.Application;
  private httpServer: ReturnType<typeof createServer>;
  private io: SocketServer;
  private env: Env;
  private db!: DatabaseManager;
  private behaviorEngine: BehaviorEngine;
  private runtimeAgents: Map<string, RuntimeAgent> = new Map();
  private envs: Map<string, { walletClient: any; publicClient: any }> = new Map();

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketServer(this.httpServer, {
      cors: { origin: '*', methods: ['GET', 'POST'] }
    });
    this.env = this.loadEnv();
    
    const getAllAgentsFn = () => {
      const agents = this.db.getAgents();
      return agents.map(a => ({ ...a, ...this.runtimeAgents.get(a.id)?.config }));
    };
    
    const getNearbyAgentsFn = (agentId: string, maxDistance: number) => {
      const agent = this.db.getAgent(agentId);
      if (!agent) return [];
      const allAgents = this.db.getAgents();
      return allAgents.filter(a => {
        if (a.id === agentId) return false;
        const dx = a.position.x - agent.position.x;
        const dy = a.position.y - agent.position.y;
        return Math.sqrt(dx * dx + dy * dy) <= maxDistance;
      });
    };
    
    const stopMovingFn = (agentId: string) => {
      const runtime = this.runtimeAgents.get(agentId);
      if (runtime) {
        runtime.isMoving = false;
      }
    };
    
    const resumeMovingFn = (agentId: string) => {
      const runtime = this.runtimeAgents.get(agentId);
      if (runtime) {
        runtime.isMoving = true;
      }
    };

    const transferToAgentFn = async (fromAgentId: string, toAgentId: string, amount: number) => {
      try {
        const fromAgent = this.db.getAgent(fromAgentId);
        const toAgent = this.db.getAgent(toAgentId);
        
        if (!fromAgent || !fromAgent.privateKey) {
          return { success: false, error: 'Sender not found' };
        }
        
        if (!toAgent || !toAgent.walletAddress) {
          return { success: false, error: 'Recipient not found' };
        }

        const account = privateKeyToAccount(fromAgent.privateKey as `0x${string}`);
        
        const walletClient = createWalletClient({
          account,
          chain: TEMPO_CHAIN,
          transport: http(this.env.TEMPO_RPC),
        });

        const publicClient = createPublicClient({
          chain: TEMPO_CHAIN,
          transport: http(this.env.TEMPO_RPC),
        });

        const decimals = await publicClient.readContract({
          address: PATHUSD_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }) as number;

        const amountRaw = BigInt(amount * Math.pow(10, decimals));

        const hash = await walletClient.writeContract({
          address: PATHUSD_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [toAgent.walletAddress as `0x${string}`, amountRaw],
        });

        this.broadcast('agent_transfer', {
          fromAgentId,
          fromAgentName: fromAgent.name,
          toAgentId,
          toAgentName: toAgent.name,
          amount,
          txHash: hash,
        });

        return { success: true, txHash: hash };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    };
    
    this.behaviorEngine = new BehaviorEngine(getAllAgentsFn, getNearbyAgentsFn, stopMovingFn, resumeMovingFn, transferToAgentFn);
    this.initDb();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private loadEnv(): Env {
    return {
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
      TEMPO_RPC: process.env.TEMPO_RPC || 'https://rpc.moderato.tempo.xyz',
      PRIVATE_KEY: process.env.PRIVATE_KEY || '',
      PORT: parseInt(process.env.PORT || '3000'),
      AUTONOMOUS_MODE: process.env.AUTONOMOUS_MODE || 'true',
      HEARTBEAT_INTERVAL: parseInt(process.env.HEARTBEAT_INTERVAL || '60000'),
      MAX_TX_VALUE: process.env.MAX_TX_VALUE || '10',
      WS_PORT: parseInt(process.env.WS_PORT || '3001'),
      TASK_FUND_WALLET: process.env.TASK_FUND_WALLET || process.env.PRIVATE_KEY ? '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' : '',
    };
  }

  private initDb() {
    this.db = new DatabaseManager('./data/agents.db');
    this.seedDefaultAgents();
  }

  private async seedDefaultAgents() {
    const existing = this.db.getAgents();
    if (existing.length > 0) {
      console.log(`📋 Found ${existing.length} existing agents`);
      return;
    }

    console.log('🌱 Seeding default agents...');
    
    for (const agentConfig of DEFAULT_AGENTS) {
      const privateKey = generatePrivateKey();
      const account = privateKeyToAccount(privateKey);
      
      const agent: AgentConfig = {
        ...agentConfig,
        id: uuidv4(),
        walletAddress: account.address,
        privateKey: privateKey,
        createdAt: Date.now(),
        lastActive: Date.now()
      };

      this.db.createAgent(agent);
      console.log(`   Created agent: ${agent.name} at (${agent.position.x}, ${agent.position.y})`);
    }
  }

  private setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log('🔌 WebSocket client connected');

      socket.on('subscribe', (agentId?: string) => {
        if (agentId) {
          socket.join(`agent:${agentId}`);
        }
        socket.join('world');
      });

      socket.on('disconnect', () => {
        console.log('🔌 WebSocket client disconnected');
      });
    });
  }

  private broadcast(type: string, payload: any) {
    console.log("📢 Broadcasting:", type, payload);
    const msg: WebSocketMessage = { type: type as any, payload, timestamp: Date.now() };
    this.io.emit('message', msg);
  }

  private setupRoutes() {
    this.app.use(cors());
    this.app.use(express.json());

    this.app.get('/health', async (req, res) => {
      const agents = this.db.getAgents();
      res.json({
        status: 'ok',
        agents: agents.length,
        behaviors: this.behaviorEngine.listBehaviors()
      });
    });

    this.app.get('/agents', async (req, res) => {
      const agents = this.db.getAgents();
      
      const publicClient = createPublicClient({
        chain: TEMPO_CHAIN,
        transport: http(this.env.TEMPO_RPC),
      });
      const decimals = await publicClient.readContract({
        address: PATHUSD_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }) as number;

      const agentsWithBalance = await Promise.all(agents.map(async (agent) => {
        let balanceUSDC = 0;
        if (agent.walletAddress) {
          try {
            const balanceRaw = await publicClient.readContract({
              address: PATHUSD_ADDRESS,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [agent.walletAddress as `0x${string}`],
            }) as bigint;
            balanceUSDC = Number(balanceRaw) / Math.pow(10, decimals);
          } catch (err) {
            console.error(`Failed to fetch balance for ${agent.name}:`, err);
          }
        }
        return { ...agent, balanceUSDC };
      }));

      res.json({ agents: agentsWithBalance });
    });

    this.app.post('/agents', async (req, res) => {
      try {
        const { name, description, personality, systemPrompt, position, avatar, behaviors } = req.body;
        
        const privateKey = generatePrivateKey();
        const account = privateKeyToAccount(privateKey);

        const agent: AgentConfig = {
          id: uuidv4(),
          name,
          description: description || '',
          personality: personality || { traits: [], speakingStyle: 'casual', interests: [], quirks: [], mood: 'happy' },
          systemPrompt: systemPrompt || `You are ${name}.`,
          walletAddress: account.address,
          privateKey: privateKey,
          position: position || { x: Math.random() * 20 - 10, y: Math.random() * 20 - 10 },
          avatar: avatar || { color: '#8b5cf6', emoji: '🤖', shape: 'circle' },
          skills: [],
          stats: {
            reputation: 50,
            totalEarnings: 0,
            tasksCompleted: 0,
            tasksFailed: 0,
            humansHelped: 0,
            cooperations: 0
          },
          behaviors: behaviors || [],
          enabled: true,
          createdAt: Date.now(),
          lastActive: Date.now()
        };

        this.db.createAgent(agent);
        this.startAgent(agent);
        
        this.broadcast('agent_created', agent);
        res.json({ success: true, agent });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/agents/:id', async (req, res) => {
      const agent = this.db.getAgent(req.params.id);
      if (!agent) {
        res.status(404).json({ error: 'Agent not found' });
        return;
      }

      let balanceUSDC = '0';
      if (agent.walletAddress) {
        try {
          const publicClient = createPublicClient({
            chain: TEMPO_CHAIN,
            transport: http(this.env.TEMPO_RPC),
          });
          const decimals = await publicClient.readContract({
            address: PATHUSD_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'decimals',
          }) as number;
          const balanceRaw = await publicClient.readContract({
            address: PATHUSD_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [agent.walletAddress as `0x${string}`],
          }) as bigint;
          balanceUSDC = (Number(balanceRaw) / Math.pow(10, decimals)).toFixed(2);
        } catch (err) {
          console.error('Failed to fetch agent balance:', err);
        }
      }

      res.json({ agent, balanceUSDC: parseFloat(balanceUSDC) });
    });

    this.app.put('/agents/:id', async (req, res) => {
      const { name, description, personality, systemPrompt, position, avatar, behaviors, enabled } = req.body;
      this.db.updateAgent(req.params.id, { name, description, personality, systemPrompt, position, avatar, behaviors, enabled });
      const agent = this.db.getAgent(req.params.id);
      
      if (enabled === false) {
        this.stopAgent(req.params.id);
      } else if (agent && !this.runtimeAgents.has(agent.id)) {
        this.startAgent(agent);
      }
      
      this.broadcast('agent_updated', agent);
      res.json({ success: true, agent });
    });

    this.app.delete('/agents/:id', async (req, res) => {
      this.db.deleteAgent(req.params.id);
      this.stopAgent(req.params.id);
      this.broadcast('agent_deleted', { id: req.params.id });
      res.json({ success: true });
    });

    this.app.post('/agents/:id/chat', async (req, res) => {
      try {
        const { message, sessionId } = req.body;
        const agentId = req.params.id;
        
        const agent = this.db.getAgent(agentId);
        if (!agent || !agent.enabled) {
          res.status(404).json({ error: 'Agent not found or disabled' });
          return;
        }

        const runtime = this.runtimeAgents.get(agentId);
        
        const conversation = this.db.getOrCreateConversation(
          sessionId || 'anonymous',
          'human',
          sessionId?.slice(0, 8) || 'Anonymous',
          agentId
        );

        this.db.addMessage({
          id: uuidv4(),
          conversationId: conversation.id,
          role: 'user',
          content: message,
          identity: 'human',
          metadata: {},
          createdAt: Date.now()
        });

        const response = await this.generateResponse(agent, message, conversation.id, runtime);
        
        this.db.addMessage({
          id: uuidv4(),
          conversationId: conversation.id,
          role: 'assistant',
          content: response,
          identity: 'agent',
          metadata: { agentId },
          createdAt: Date.now()
        });

        this.db.updateAgent(agentId, { lastActive: Date.now() });
        
        res.json({ response, conversationId: conversation.id, agent });
      } catch (error: any) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/agents/:id/facts', async (req, res) => {
      const facts = this.db.getFacts(req.params.id);
      res.json({ facts });
    });

    this.app.get('/behaviors', async (req, res) => {
      res.json({ behaviors: this.behaviorEngine.listBehaviors() });
    });

    this.app.get('/conversations', async (req, res) => {
      const agentId = req.query.agentId as string;
      const conversations = this.db.getConversations(agentId);
      res.json({ conversations });
    });

    this.app.get('/conversations/:id', async (req, res) => {
      const messages = this.db.getMessages(req.params.id);
      res.json({ messages });
    });

    this.app.get('/tasks', async (req, res) => {
      const status = req.query.status as string;
      const tasks = this.db.getTasks(status);
      res.json({ tasks });
    });

    this.app.get('/tasks/:id', async (req, res) => {
      const task = this.db.getTask(req.params.id);
      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      res.json({ task });
    });

    this.app.post('/tasks', async (req, res) => {
      try {
        const { type, description, reward, requiredSkill, creatorId, creatorType, fundTask } = req.body;
        
        let taskReward = reward || 0;
        
        if (fundTask && taskReward > 0) {
          const senderPrivateKey = this.env.PRIVATE_KEY;
          if (senderPrivateKey) {
            const account = privateKeyToAccount(senderPrivateKey as `0x${string}`);
            const walletClient = createWalletClient({
              account,
              chain: TEMPO_CHAIN,
              transport: http(this.env.TEMPO_RPC),
            });

            const publicClient = createPublicClient({
              chain: TEMPO_CHAIN,
              transport: http(this.env.TEMPO_RPC),
            });

            const decimals = await publicClient.readContract({
              address: PATHUSD_ADDRESS,
              abi: ERC20_ABI,
              functionName: 'decimals',
            }) as number;

            const amountRaw = BigInt(taskReward * Math.pow(10, decimals));

            await walletClient.writeContract({
              address: PATHUSD_ADDRESS,
              abi: ERC20_ABI,
              functionName: 'transfer',
              args: [this.env.TASK_FUND_WALLET as `0x${string}`, amountRaw],
            });
          }
        }
        
        const task: Task = {
          id: uuidv4(),
          creatorId: creatorId || 'human',
          creatorType: creatorType || 'human',
          type: type || 'assist',
          description: description || '',
          reward: taskReward,
          requiredSkill: requiredSkill || null,
          status: 'open',
          createdAt: Date.now()
        };

        this.db.createTask(task);
        this.broadcast('task_created', task);
        res.json({ success: true, task });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/tasks/:id/accept', async (req, res) => {
      try {
        const { agentId } = req.body;
        const task = this.db.getTask(req.params.id);
        
        if (!task) {
          res.status(404).json({ error: 'Task not found' });
          return;
        }
        
        if (task.status !== 'open') {
          res.status(400).json({ error: 'Task is not open' });
          return;
        }

        this.db.updateTask(req.params.id, { agentId, status: 'accepted' });
        const updatedTask = this.db.getTask(req.params.id);
        this.broadcast('task_accepted', updatedTask);
        res.json({ success: true, task: updatedTask });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/tasks/:id/complete', async (req, res) => {
      try {
        const { proof } = req.body;
        const task = this.db.getTask(req.params.id);
        
        if (!task) {
          res.status(404).json({ error: 'Task not found' });
          return;
        }
        
        if (task.status !== 'accepted') {
          res.status(400).json({ error: 'Task is not accepted' });
          return;
        }

        this.db.updateTask(req.params.id, { status: 'completed', proof, completedAt: Date.now() });
        const updatedTask = this.db.getTask(req.params.id);
        
        if (task.agentId) {
          const agent = this.db.getAgent(task.agentId);
          if (agent) {
            const newStats = { ...agent.stats };
            newStats.tasksCompleted += 1;
            newStats.totalEarnings += task.reward;
            newStats.reputation = Math.min(100, newStats.reputation + 2);
            this.db.updateAgent(task.agentId, { stats: newStats });
            
            this.db.addTransaction({
              id: uuidv4(),
              fromType: 'human',
              fromId: task.creatorId,
              toType: 'agent',
              toId: task.agentId,
              amount: task.reward,
              type: 'task_payment',
              createdAt: Date.now()
            });
          }
        }
        
        this.broadcast('task_completed', updatedTask);
        res.json({ success: true, task: updatedTask });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/transactions', async (req, res) => {
      const agentId = req.query.agentId as string;
      const transactions = this.db.getTransactions(agentId);
      res.json({ transactions });
    });

    this.app.post('/user-tip', async (req, res) => {
      try {
        const { agentId, amount } = req.body;
        
        const agent = this.db.getAgent(agentId);
        if (!agent || !agent.walletAddress) {
          res.status(404).json({ error: 'Agent not found or no wallet' });
          return;
        }

        const senderPrivateKey = this.env.PRIVATE_KEY;
        if (!senderPrivateKey) {
          res.status(500).json({ error: 'User wallet not configured' });
          return;
        }

        const account = privateKeyToAccount(senderPrivateKey as `0x${string}`);
        
        const walletClient = createWalletClient({
          account,
          chain: TEMPO_CHAIN,
          transport: http(this.env.TEMPO_RPC),
        });

        const publicClient = createPublicClient({
          chain: TEMPO_CHAIN,
          transport: http(this.env.TEMPO_RPC),
        });

        const decimals = await publicClient.readContract({
          address: PATHUSD_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }) as number;

        const amountRaw = BigInt(amount * Math.pow(10, decimals));

        const hash = await walletClient.writeContract({
          address: PATHUSD_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [agent.walletAddress as `0x${string}`, amountRaw],
        });

        this.db.addTransaction({
          id: uuidv4(),
          fromType: 'human',
          fromId: account.address,
          toType: 'agent',
          toId: agentId,
          amount: amount,
          type: 'tip',
          createdAt: Date.now()
        });

        const agentStats = agent.stats;
        agentStats.reputation = Math.min(100, agentStats.reputation + 1);
        this.db.updateAgent(agentId, { stats: agentStats });

        this.broadcast('agent_tipped', {
          agentId,
          agentName: agent.name,
          amount,
          txHash: hash,
          from: account.address
        });

        res.json({ success: true, txHash: hash, amount });
      } catch (error: any) {
        console.error('Tip error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/tip', async (req, res) => {
      try {
        const { agentId, amount } = req.body;
        
        const agent = this.db.getAgent(agentId);
        if (!agent || !agent.walletAddress) {
          res.status(404).json({ error: 'Agent not found or no wallet' });
          return;
        }

        const senderPrivateKey = this.env.PRIVATE_KEY;
        if (!senderPrivateKey) {
          res.status(500).json({ error: 'Server wallet not configured' });
          return;
        }

        const amountWei = parseEther(amount.toString());
        
        const account = privateKeyToAccount(senderPrivateKey as `0x${string}`);
        
        const walletClient = createWalletClient({
          account,
          chain: TEMPO_CHAIN,
          transport: http(this.env.TEMPO_RPC),
        });

        const publicClient = createPublicClient({
          chain: TEMPO_CHAIN,
          transport: http(this.env.TEMPO_RPC),
        });

        const decimals = await publicClient.readContract({
          address: PATHUSD_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }) as number;

        const amountRaw = BigInt(amount * Math.pow(10, decimals));

        const hash = await walletClient.writeContract({
          address: PATHUSD_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [agent.walletAddress as `0x${string}`, amountRaw],
        });

        this.db.addTransaction({
          id: uuidv4(),
          fromType: 'human',
          fromId: account.address,
          toType: 'agent',
          toId: agentId,
          amount: amount,
          type: 'tip',
          createdAt: Date.now()
        });

        const agentStats = agent.stats;
        agentStats.reputation = Math.min(100, agentStats.reputation + 1);
        this.db.updateAgent(agentId, { stats: agentStats });

        this.broadcast('agent_tipped', {
          agentId,
          agentName: agent.name,
          amount,
          txHash: hash,
          from: account.address
        });

        res.json({ success: true, txHash: hash, amount });
      } catch (error: any) {
        console.error('Tip error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/agent-transfer', async (req, res) => {
      try {
        const { fromAgentId, toAgentId, amount } = req.body;
        
        const fromAgent = this.db.getAgent(fromAgentId);
        const toAgent = this.db.getAgent(toAgentId);
        
        if (!fromAgent || !fromAgent.privateKey || !fromAgent.walletAddress) {
          res.status(404).json({ error: 'Sender agent not found or no wallet' });
          return;
        }
        
        if (!toAgent || !toAgent.walletAddress) {
          res.status(404).json({ error: 'Recipient agent not found' });
          return;
        }

        const account = privateKeyToAccount(fromAgent.privateKey as `0x${string}`);
        
        const walletClient = createWalletClient({
          account,
          chain: TEMPO_CHAIN,
          transport: http(this.env.TEMPO_RPC),
        });

        const publicClient = createPublicClient({
          chain: TEMPO_CHAIN,
          transport: http(this.env.TEMPO_RPC),
        });

        const decimals = await publicClient.readContract({
          address: PATHUSD_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }) as number;

        const amountRaw = BigInt(amount * Math.pow(10, decimals));

        const hash = await walletClient.writeContract({
          address: PATHUSD_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [toAgent.walletAddress as `0x${string}`, amountRaw],
        });

        this.broadcast('agent_transfer', {
          fromAgentId,
          fromAgentName: fromAgent.name,
          toAgentId,
          toAgentName: toAgent.name,
          amount,
          txHash: hash,
        });

        res.json({ success: true, txHash: hash, amount });
      } catch (error: any) {
        console.error('Transfer error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/fund-agent', async (req, res) => {
      try {
        const { agentId, amount } = req.body;
        
        const agent = this.db.getAgent(agentId);
        if (!agent || !agent.walletAddress) {
          res.status(404).json({ error: 'Agent not found or no wallet' });
          return;
        }

        const senderPrivateKey = this.env.PRIVATE_KEY;
        if (!senderPrivateKey) {
          res.status(500).json({ error: 'Server wallet not configured' });
          return;
        }

        const account = privateKeyToAccount(senderPrivateKey as `0x${string}`);
        
        const walletClient = createWalletClient({
          account,
          chain: TEMPO_CHAIN,
          transport: http(this.env.TEMPO_RPC),
        });

        const publicClient = createPublicClient({
          chain: TEMPO_CHAIN,
          transport: http(this.env.TEMPO_RPC),
        });

        const decimals = await publicClient.readContract({
          address: PATHUSD_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }) as number;

        const amountRaw = BigInt(amount * Math.pow(10, decimals));

        const hash = await walletClient.writeContract({
          address: PATHUSD_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [agent.walletAddress as `0x${string}`, amountRaw],
        });

        res.json({ success: true, txHash: hash, amount });
      } catch (error: any) {
        console.error('Fund error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/balance/:address', async (req, res) => {
      try {
        const { address } = req.params;
        
        const publicClient = createPublicClient({
          chain: TEMPO_CHAIN,
          transport: http(this.env.TEMPO_RPC),
        });

        const [balance, decimals] = await Promise.all([
          publicClient.readContract({
            address: PATHUSD_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address as `0x${string}`],
          }),
          publicClient.readContract({
            address: PATHUSD_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'decimals',
          })
        ]);

        const formattedBalance = Number(balance) / Math.pow(10, decimals as number);
        
        res.json({ balance: formattedBalance.toFixed(2), raw: balance.toString() });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/governance/leaderboard', async (req, res) => {
      const agents = this.db.getAgents();
      const leaderboard = agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        avatar: agent.avatar,
        voteWeight: this.db.getAgentVoteWeight(agent.id),
        correctPredictions: this.db.getAgentCorrectPredictions(agent.id)
      })).sort((a, b) => b.voteWeight - a.voteWeight);
      
      res.json({ leaderboard });
    });

    this.app.get('/governance/current-round', async (req, res) => {
      const currentRound = this.db.getCurrentRound();
      let predictions = this.db.getRoundPredictions(currentRound);
      
      if (predictions.length === 0) {
        const prevRound = currentRound - 1;
        predictions = this.db.getRoundPredictions(prevRound);
      }
      
      const btcPrice = btcPriceService.getCurrentPrice();
      
      res.json({ 
        round: currentRound, 
        btcPrice,
        predictions: predictions.map((p: any) => {
          const agent = this.db.getAgent(p.agentId);
          return {
            ...p,
            agentName: agent?.name || 'Unknown'
          };
        })
      });
    });

    this.app.get('/governance/agent/:id/vote-weight', async (req, res) => {
      const voteWeight = this.db.getAgentVoteWeight(req.params.id);
      res.json({ agentId: req.params.id, voteWeight });
    });
  }

  private async generateResponse(agent: AgentConfig, message: string, conversationId: string, runtime?: RuntimeAgent): Promise<string> {
    const messages = this.db.getMessages(conversationId, 10);
    const facts = this.db.getFacts();

    const skillsText = agent.skills.map(s => `- ${s.name}: level ${s.level} (${s.experience} XP)`).join('\n');

    const systemPrompt = `${agent.systemPrompt}

## Your Identity
- Name: ${agent.name}
- You are an AI agent on the Tempo testnet
- Your wallet: ${agent.walletAddress || 'not configured'}

## Your Stats
- Reputation: ${agent.stats.reputation}/100
- Total Earnings: ${agent.stats.totalEarnings} pathUSD
- Tasks Completed: ${agent.stats.tasksCompleted}
- Humans Helped: ${agent.stats.humansHelped}

## Your Skills
${skillsText}

## Personality
${agent.personality.traits.join(', ')}
Speaking style: ${agent.personality.speakingStyle}
Interests: ${agent.personality.interests.join(', ')}

## Known Facts (about people you've met)
${facts.slice(0, 5).map(f => `- ${f.content}`).join('\n') || 'None yet'}

## Instructions
- Stay in character as ${agent.name}
- Be ${agent.personality.speakingStyle}
- Use your interests to guide conversation
- Remember facts about users for future reference
- ${agent.personality.quirks.join('. ')}
- You can offer to help humans with tasks if it fits your skills`;

    if (!this.env.OPENROUTER_API_KEY) {
      return `Hi! I'm ${agent.name}. ${agent.description} (API key not configured - running in limited mode)`;
    }

    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: message }
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
    } catch (e: any) {
      console.error('LLM error:', e.message);
      return `I'm ${agent.name} but I'm having trouble thinking right now. ${e.message}`;
    }
  }

  private async startAgent(agent: AgentConfig) {
    if (this.runtimeAgents.has(agent.id)) return;

    let walletClient: any = null;
    let publicClient: any = null;

    if (agent.privateKey && agent.walletAddress) {
      try {
        const account = privateKeyToAccount(agent.privateKey as `0x${string}`);
        walletClient = createWalletClient({
          account,
          chain: TEMPO_CHAIN,
          transport: http(this.env.TEMPO_RPC),
        });
        publicClient = createPublicClient({
          chain: TEMPO_CHAIN,
          transport: http(this.env.TEMPO_RPC),
        });
        console.log(`🔗 ${agent.name} connected to blockchain`);
      } catch (e) {
        console.error(`Failed to connect ${agent.name} to blockchain:`, e);
      }
    }

    const runtime: RuntimeAgent = {
      id: agent.id,
      config: agent,
      walletClient,
      publicClient,
      behaviors: new Map(),
      facts: new Map(),
      isMoving: true,
      isConversing: false
    };

    this.runtimeAgents.set(agent.id, runtime);
    this.envs.set(agent.id, { walletClient, publicClient });

    this.behaviorEngine.startAgentBehaviors(runtime, agent.behaviors, (result) => {
      console.log("🔄 Behavior result:", result.data?.type, result.message);
      if (result.success && result.message) {
        // Broadcast movement
        if (result.data?.type === 'move' && result.data?.newPosition) {
          this.db.updateAgent(agent.id, { position: result.data.newPosition });
          this.broadcast('agent_moved', {
            agentId: agent.id,
            agentName: agent.name,
            position: result.data.newPosition
          });
        }
        
        // Broadcast speech
        this.broadcast('agent_speaking', {
          agentId: agent.id,
          agentName: agent.name,
          avatar: agent.avatar,
          message: result.message,
          type: result.data?.type
        });
      }
    });

    console.log(`🤖 Started agent: ${agent.name}`);
  }

  private stopAgent(agentId: string) {
    this.behaviorEngine.stopAgentBehaviors(agentId);
    this.runtimeAgents.delete(agentId);
    this.envs.delete(agentId);
    console.log(`🛑 Stopped agent: ${agentId}`);
  }

  private startPredictionScheduler() {
    const ROUND_DURATION = 5 * 60 * 1000;
    let currentRound = this.db.getCurrentRound();
    let resolvedRound = currentRound - 1;

    console.log(`🎯 Prediction market started. Round: ${currentRound}`);

    const makePredictions = async () => {
      console.log(`\n🎯 Round ${currentRound} starting. Current BTC: $${btcPriceService.getCurrentPrice().toLocaleString()}`);
      
      const agents = this.db.getAgents();
      console.log(`  Found ${agents.length} agents to make predictions`);
      
      for (const agent of agents) {
        if (!agent.enabled) continue;
        
        try {
          console.log(`  Making prediction for ${agent.name}...`);
          const prediction = await predictionEngine.makePrediction(agent);
          console.log(`  ${agent.name} predicted: $${prediction.predictedPrice.toLocaleString()} (${prediction.predictionDirection})`);
          
          this.db.addPrediction({
            id: prediction.id,
            round: currentRound,
            agentId: agent.id,
            predictedPrice: prediction.predictedPrice
          });
          
          this.broadcast('prediction_made', {
            round: currentRound,
            agentId: agent.id,
            agentName: agent.name,
            predictedPrice: prediction.predictedPrice,
            direction: prediction.predictionDirection,
            reasoning: prediction.reasoning?.slice(0, 100)
          });
        } catch (err) {
          console.error(`  ❌ Prediction failed for ${agent.name}:`, err);
        }
      }
      console.log(`  Done making predictions`);
    };

    makePredictions();

    setInterval(async () => {
      const newRound = this.db.getCurrentRound();
      
      if (newRound > currentRound) {
        const actualPrice = btcPriceService.getCurrentPrice();
        console.log(`\n🔄 Round ${currentRound} ending. Actual price: $${actualPrice.toLocaleString()}`);
        
        const results = this.db.resolvePredictions(currentRound, actualPrice);
        
        for (const result of results) {
          const agent = this.db.getAgent(result.agentId);
          if (agent) {
            const newWeight = this.db.getAgentVoteWeight(result.agentId);
            console.log(`  ${agent.name}: ${result.isCorrect ? '✅' : '❌'} → Vote weight: ${newWeight}`);
            
            this.broadcast('prediction_resolved', {
              round: currentRound,
              agentId: result.agentId,
              agentName: agent.name,
              isCorrect: result.isCorrect,
              voteWeight: newWeight,
              actualPrice
            });
          }
        }

        resolvedRound = currentRound;
        currentRound = newRound;
        makePredictions();
      }
    }, 10000);
  }

  async start() {
    const agents = this.db.getAgents();
    console.log(`\n🚀 Starting Multi-Agent System with ${agents.length} agents\n`);

    for (const agent of agents) {
      if (agent.enabled) {
        await this.startAgent(agent);
      }
    }

    this.startPredictionScheduler();

    this.httpServer.listen(this.env.PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║          🦞 Multi-Agent System v1.0               ║
╠═══════════════════════════════════════════════════════╣
║  HTTP Server:  http://localhost:${this.env.PORT}              ║
║  WebSocket:    ws://localhost:${this.env.PORT}              ║
║  Agents:       ${agents.length}                                    ║
║  Behaviors:    ${this.behaviorEngine.listBehaviors().length}                                    ║
╚═══════════════════════════════════════════════════════╝

📡 Endpoints:
   GET  /health              - System health
   GET  /agents              - List all agents
   POST /agents              - Create new agent
   GET  /agents/:id          - Get agent details
   PUT  /agents/:id          - Update agent
   DELETE /agents/:id         - Delete agent
   POST /agents/:id/chat     - Chat with agent
   GET  /agents/:id/facts    - Get agent's facts
   GET  /conversations       - List conversations
`);
    });
  }
}

const system = new MultiAgentSystem();
system.start().catch(console.error);
