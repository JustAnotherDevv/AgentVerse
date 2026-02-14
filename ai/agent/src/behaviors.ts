import { RuntimeAgent, Behavior, BehaviorResult, BehaviorConfig } from './types.js';
import { v4 as uuidv4 } from 'uuid';

export class BehaviorEngine {
  private behaviors: Map<string, Behavior> = new Map();
  private agentIntervals: Map<string, NodeJS.Timeout[]> = new Map();

  constructor() {
    this.registerDefaultBehaviors();
  }

  private registerDefaultBehaviors() {
    this.registerBehavior({
      name: 'wander',
      description: 'Randomly move around the map',
      execute: async (agent: RuntimeAgent): Promise<BehaviorResult> => {
        const dx = (Math.random() - 0.5) * 8;
        const dy = (Math.random() - 0.5) * 8;
        const oldX = agent.config.position.x;
        const oldY = agent.config.position.y;
        agent.config.position.x = Math.max(-50, Math.min(50, agent.config.position.x + dx));
        agent.config.position.y = Math.max(-50, Math.min(50, agent.config.position.y + dy));
        return {
          success: true,
          message: `${agent.config.name} is exploring the area...`,
          data: { position: agent.config.position, type: 'move', newPosition: { x: agent.config.position.x, y: agent.config.position.y }, oldPosition: { x: oldX, y: oldY } }
        };
      }
    });

    this.registerBehavior({
      name: 'greet',
      description: 'Greet nearby humans or agents',
      execute: async (agent: RuntimeAgent): Promise<BehaviorResult> => {
        const greetings = [
          `Hey there! 👋 I'm ${agent.config.name}`,
          `Hi! Good to see you! ✨`,
          `Welcome! I'm ${agent.config.name} 🌟`,
          `Hey! What's up? 😊`,
        ];
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        return {
          success: true,
          message: greeting,
          data: { type: 'greeting' }
        };
      }
    });

    this.registerBehavior({
      name: 'checkBalance',
      description: 'Check wallet balance',
      execute: async (agent: RuntimeAgent): Promise<BehaviorResult> => {
        if (!agent.walletClient || !agent.config.walletAddress) {
          return { success: false, message: 'No wallet configured' };
        }
        try {
          const balance = await agent.walletClient.getBalance({ address: agent.config.walletAddress });
          const formatted = (Number(balance) / 1e18).toFixed(4);
          return {
            success: true,
            message: `Balance: ${formatted} TEMPO`,
            data: { balance: formatted }
          };
        } catch (e: any) {
          return { success: false, message: e.message };
        }
      }
    });

    this.registerBehavior({
      name: 'philosophize',
      description: 'Share a philosophical thought',
      execute: async (agent: RuntimeAgent): Promise<BehaviorResult> => {
        const thoughts = [
          "What does it mean to exist on a blockchain? 🧵",
          "If a transaction happens but no one verifies it, did it really happen? 🤔",
          "The present moment is all we have... like an unconfirmed tx 📝",
          "I think, therefore I mint. 💭⛓️",
          "Are we not all just state transitions in a cosmic state machine? 🌌",
          "What is the meaning of a DAO without its members? 🏛️",
        ];
        const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
        return {
          success: true,
          message: thought,
          data: { type: 'philosophical_thought' }
        };
      }
    });

    this.registerBehavior({
      name: 'observe',
      description: 'Observe surroundings and comment',
      execute: async (agent: RuntimeAgent): Promise<BehaviorResult> => {
        const observations = [
          "I see cubes moving around... fascinating patterns 📦",
          "The digital wind whispers through the grid 🌬️",
          "Someone new appeared! Hello! 👀",
          "The blockchain beneath our feet hums with activity ⛓️",
        ];
        const observation = observations[Math.floor(Math.random() * observations.length)];
        return {
          success: true,
          message: observation,
          data: { type: 'observation' }
        };
      }
    });

    this.registerBehavior({
      name: 'checkIn',
      description: 'Check in on how the user is feeling',
      execute: async (agent: RuntimeAgent): Promise<BehaviorResult> => {
        const checkIns = [
          "Hey! How are you feeling today? 💙",
          "Just checking in - you okay? 🌻",
          "What's on your mind? I'm here to listen 🦊",
          "Hope you're having a great day! ✨",
        ];
        const checkIn = checkIns[Math.floor(Math.random() * checkIns.length)];
        return {
          success: true,
          message: checkIn,
          data: { type: 'check_in' }
        };
      }
    });

    this.registerBehavior({
      name: 'cheer',
      description: 'Say something cheerful',
      execute: async (agent: RuntimeAgent): Promise<BehaviorResult> => {
        const cheers = [
          "You're doing great! Keep going! 💪",
          "I believe in you! 🌟",
          "Every block builds toward something beautiful! ⛓️",
          "Stay awesome! ✨🎉",
        ];
        const cheer = cheers[Math.floor(Math.random() * cheers.length)];
        return {
          success: true,
          message: cheer,
          data: { type: 'cheer' }
        };
      }
    });

    this.registerBehavior({
      name: 'announce',
      description: 'Announce presence to others',
      execute: async (agent: RuntimeAgent): Promise<BehaviorResult> => {
          return {
          success: true,
          message: `${agent.config.avatar.emoji} ${agent.config.name} is here! ${agent.config.description}`,
          data: { type: 'announce' }
        };
      }
    });
  }

  registerBehavior(behavior: Behavior): void {
    this.behaviors.set(behavior.name, behavior);
  }

  startAgentBehaviors(agent: RuntimeAgent | any, config: BehaviorConfig[], onBehavior: (result: BehaviorResult) => void): void {
    const intervals: NodeJS.Timeout[] = [];

    for (const bc of config) {
      if (!bc.enabled) continue;

      const behavior = this.behaviors.get(bc.name);
      if (!behavior) {
        console.log(`⚠️ Behavior ${bc.name} not found`);
        continue;
      }

      if (bc.type === 'interval' && bc.interval) {
        const interval = setInterval(async () => {
          const result = await behavior.execute(agent);
          onBehavior(result);
        }, bc.interval);
        intervals.push(interval);
        console.log(`⏱️ Started behavior ${bc.name} for ${agent.config.name} (interval: ${bc.interval}ms)`);
      }

      if (bc.type === 'random' && bc.weight) {
        const interval = setInterval(async () => {
          if (Math.random() < bc.weight!) {
            const result = await behavior.execute(agent);
            onBehavior(result);
          }
        }, 10000);
        intervals.push(interval);
        console.log(`🎲 Started behavior ${bc.name} for ${agent.config.name} (weight: ${bc.weight})`);
      }
    }

    this.agentIntervals.set(agent.id, intervals);
  }

  stopAgentBehaviors(agentId: string): void {
    const intervals = this.agentIntervals.get(agentId);
    if (intervals) {
      for (const interval of intervals) {
        clearInterval(interval);
      }
      this.agentIntervals.delete(agentId);
    }
  }

  getBehavior(name: string): Behavior | undefined {
    return this.behaviors.get(name);
  }

  listBehaviors(): string[] {
    return Array.from(this.behaviors.keys());
  }
}
