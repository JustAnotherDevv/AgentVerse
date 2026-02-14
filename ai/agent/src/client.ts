import axios, { AxiosInstance } from 'axios';

interface ChatResponse {
  response: string;
  conversationId: string;
  identity: { type: string; name: string };
  agent: string;
}

interface HealthResponse {
  status: string;
  agent: string;
  account: string;
  balance: string;
  autonomous: boolean;
  skills: string[];
  conversations: number;
}

interface Conversation {
  id: string;
  participantId?: string;
  participantType: string;
  participantName: string;
  metadata: Record<string, any>;
  createdAt: number;
  lastMessageAt: number;
}

interface Message {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  identity: string;
  metadata: Record<string, any>;
  createdAt: number;
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
  interval?: number;
  enabled: boolean;
}

export class TempoAgentClient {
  private client: AxiosInstance;
  private address: string;

  constructor(baseUrl: string = 'http://localhost:3000', address?: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(address && { 'x-wallet-address': address }),
      },
    });
    this.address = address || '';
  }

  setAddress(address: string) {
    this.address = address;
    this.client.defaults.headers['x-wallet-address'] = address;
  }

  async chat(message: string, sessionId?: string): Promise<ChatResponse> {
    const res = await this.client.post<ChatResponse>('/chat', { message, sessionId });
    return res.data;
  }

  async whisper(message: string, sessionId?: string): Promise<any> {
    const res = await this.client.post('/whisper', { message, sessionId });
    return res.data;
  }

  async health(): Promise<HealthResponse> {
    const res = await this.client.get<HealthResponse>('/health');
    return res.data;
  }

  async getBalance(address?: string): Promise<{ balance: string; raw: string }> {
    const url = address ? `/balance/${address}` : '/balance';
    const res = await this.client.get(url);
    return res.data;
  }

  async send(to: string, amount: string): Promise<{ txHash: string; to: string; amount: string; explorer: string }> {
    const res = await this.client.post('/send', { to, amount });
    return res.data;
  }

  async callContract(to: string, functionName: string, args: any[] = [], abi?: any, value?: string): Promise<any> {
    const res = await this.client.post('/call', { to, functionName, args, abi, value });
    return res.data;
  }

  async readContract(to: string, functionName: string, args: any[] = [], abi?: any): Promise<any> {
    const res = await this.client.post('/read', { to, functionName, args, abi });
    return res.data;
  }

  async getConversations(): Promise<{ conversations: Conversation[] }> {
    const res = await this.client.get('/conversations');
    return res.data;
  }

  async getConversation(id: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    const res = await this.client.get(`/conversations/${id}`);
    return res.data;
  }

  async getFacts(): Promise<{ facts: Fact[] }> {
    const res = await this.client.get('/memory/facts');
    return res.data;
  }

  async addFact(content: string, confidence: number = 1.0): Promise<{ success: boolean; fact: Fact }> {
    const res = await this.client.post('/memory/facts', { content, confidence });
    return res.data;
  }

  async getSkills(): Promise<{ skills: Skill[] }> {
    const res = await this.client.get('/skills');
    return res.data;
  }

  async runSkill(name: string, params: any = {}): Promise<any> {
    const res = await this.client.post(`/skills/${name}/run`, params);
    return res.data;
  }

  async startAutonomous(): Promise<{ success: boolean }> {
    const res = await this.client.post('/autonomous/start');
    return res.data;
  }

  async stopAutonomous(): Promise<{ success: boolean }> {
    const res = await this.client.post('/autonomous/stop');
    return res.data;
  }

  async getAutonomousStatus(): Promise<{ running: boolean }> {
    const res = await this.client.get('/autonomous/status');
    return res.data;
  }
}

export default TempoAgentClient;
