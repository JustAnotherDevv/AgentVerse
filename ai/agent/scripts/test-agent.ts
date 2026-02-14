import { TempoAgentClient } from '../src/client.js';
import { createWalletClient, http, parseEther, formatEther, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const TEMPO_CHAIN = {
  id: 8081,
  name: 'Tempo Testnet',
  nativeCurrency: { name: 'TEMPO', symbol: 'TEMPO', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evm.testnet.tempo.blockchaineps.com'] },
    public: { http: ['https://evm.testnet.tempo.blockchaineps.com'] },
  },
};

const TEST_WALLET = privateKeyToAccount('0x7fffad291e3cf7c6946af6fd4d11dff30887e4c8180a8b7de0de25faa7a85f82');
const TEST_ADDRESS = TEST_WALLET.address;
const AGENT_URL = process.env.AGENT_URL || 'http://localhost:3000';

const logDir = join(process.cwd(), 'test-logs');
if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
const logFile = join(logDir, `test-${Date.now()}.log`);

function log(msg: string, level: 'INFO' | 'PASS' | 'FAIL' | 'SKIP' = 'INFO') {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${msg}`;
  console.log(line);
  appendFileSync(logFile, line + '\n');
}

function logSection(title: string) {
  const line = `\n${'='.repeat(60)}\n${title}\n${'='.repeat(60)}`;
  console.log(line);
  appendFileSync(logFile, line + '\n');
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  logSection('TEMPO AGENT AUTOMATED TEST SUITE');
  log(`Agent URL: ${AGENT_URL}`);
  log(`Test Wallet: ${TEST_ADDRESS}`);

  const client = new TempoAgentClient(AGENT_URL, TEST_ADDRESS);
  const results: { name: string; status: 'PASS' | 'FAIL' | 'SKIP'; error?: string; duration: number }[] = [];

  const start = Date.now();

  // Test 1: Health Check
  try {
    logSection('TEST 1: Health Check');
    const t0 = Date.now();
    const health = await client.health();
    log(`Status: ${health.status}`, health.status === 'ok' ? 'PASS' : 'FAIL');
    log(`Agent: ${health.agent}`);
    log(`Account: ${health.account}`);
    log(`Autonomous: ${health.autonomous}`);
    log(`Skills: ${health.skills.join(', ')}`);
    log(`Conversations: ${health.conversations}`);
    results.push({ name: 'health', status: health.status === 'ok' ? 'PASS' : 'FAIL', duration: Date.now() - t0 });
  } catch (e: any) {
    log(`Health check failed: ${e.message}`, 'FAIL');
    results.push({ name: 'health', status: 'FAIL', error: e.message, duration: 0 });
  }

  await delay(500);

  // Test 2: Get Balance
  try {
    logSection('TEST 2: Get Balance');
    const t0 = Date.now();
    const balance = await client.getBalance();
    log(`Balance: ${balance.balance}`, 'PASS');
    log(`Raw: ${balance.raw}`);
    results.push({ name: 'balance', status: 'PASS', duration: Date.now() - t0 });
  } catch (e: any) {
    log(`Balance check failed: ${e.message}`, 'FAIL');
    results.push({ name: 'balance', status: 'FAIL', error: e.message, duration: Date.now() - Date.now() });
  }

  await delay(500);

  // Test 3: Get Balance for Specific Address
  try {
    logSection('TEST 3: Get Balance for Address');
    const t0 = Date.now();
    const balance = await client.getBalance(TEST_ADDRESS);
    log(`Balance for ${TEST_ADDRESS.slice(0, 10)}...: ${balance.balance}`, 'PASS');
    results.push({ name: 'balance-address', status: 'PASS', duration: Date.now() - t0 });
  } catch (e: any) {
    log(`Balance check failed: ${e.message}`, 'FAIL');
    results.push({ name: 'balance-address', status: 'FAIL', error: e.message, duration: 0 });
  }

  await delay(500);

  // Test 4: Chat - Basic Message
  try {
    logSection('TEST 4: Chat - Basic Message');
    const t0 = Date.now();
    const chatRes = await client.chat('Hello, what is your name?');
    log(`Response: ${chatRes.response.slice(0, 200)}...`);
    log(`Conversation ID: ${chatRes.conversationId}`);
    log(`Identity Type: ${chatRes.identity.type}`, 'PASS');
    results.push({ name: 'chat-basic', status: 'PASS', duration: Date.now() - t0 });
  } catch (e: any) {
    log(`Chat failed: ${e.message}`, 'FAIL');
    results.push({ name: 'chat-basic', status: 'FAIL', error: e.message, duration: 0 });
  }

  await delay(500);

  // Test 5: Chat - Identity Detection
  try {
    logSection('TEST 5: Chat - Identity Detection');
    const t0 = Date.now();
    
    // Different address = different identity
    const client2 = new TempoAgentClient(AGENT_URL, '0x1234567890123456789012345678901234567890');
    const chatRes = await client2.chat('Hello');
    log(`Identity Type: ${chatRes.identity.type}`, chatRes.identity.type !== 'unknown' ? 'PASS' : 'FAIL');
    log(`Identity Name: ${chatRes.identity.name}`);
    results.push({ name: 'identity-detection', status: chatRes.identity.type !== 'unknown' ? 'PASS' : 'FAIL', duration: Date.now() - t0 });
  } catch (e: any) {
    log(`Identity detection failed: ${e.message}`, 'FAIL');
    results.push({ name: 'identity-detection', status: 'FAIL', error: e.message, duration: 0 });
  }

  await delay(500);

  // Test 6: Get Skills
  try {
    logSection('TEST 6: Get Skills');
    const t0 = Date.now();
    const skills = await client.getSkills();
    log(`Skills count: ${skills.skills.length}`);
    for (const skill of skills.skills) {
      log(`  - ${skill.name}: ${skill.description}`);
      log(`    Triggers: ${skill.triggers.join(', ')}`);
      log(`    Enabled: ${skill.enabled}`);
    }
    results.push({ name: 'skills-list', status: 'PASS', duration: Date.now() - t0 });
  } catch (e: any) {
    log(`Get skills failed: ${e.message}`, 'FAIL');
    results.push({ name: 'skills-list', status: 'FAIL', error: e.message, duration: 0 });
  }

  await delay(500);

  // Test 7: Run Skill - Balance Monitor
  try {
    logSection('TEST 7: Run Skill - Balance Monitor');
    const t0 = Date.now();
    const result = await client.runSkill('balance_monitor');
    log(`Result: ${result.message}`, result.success ? 'PASS' : 'FAIL');
    results.push({ name: 'skill-balance', status: result.success ? 'PASS' : 'FAIL', duration: Date.now() - t0 });
  } catch (e: any) {
    log(`Skill failed: ${e.message}`, 'FAIL');
    results.push({ name: 'skill-balance', status: 'FAIL', error: e.message, duration: 0 });
  }

  await delay(500);

  // Test 8: Run Skill - Whoami
  try {
    logSection('TEST 8: Run Skill - Whoami');
    const t0 = Date.now();
    const result = await client.runSkill('whoami');
    log(`Result: ${result.message}`, result.success ? 'PASS' : 'FAIL');
    results.push({ name: 'skill-whoami', status: result.success ? 'PASS' : 'FAIL', duration: Date.now() - t0 });
  } catch (e: any) {
    log(`Skill failed: ${e.message}`, 'FAIL');
    results.push({ name: 'skill-whoami', status: 'FAIL', error: e.message, duration: 0 });
  }

  await delay(500);

  // Test 9: Get Conversations
  try {
    logSection('TEST 9: Get Conversations');
    const t0 = Date.now();
    const convs = await client.getConversations();
    log(`Conversations count: ${convs.conversations.length}`);
    for (const conv of convs.conversations) {
      log(`  - ${conv.id.slice(0, 8)}... | ${conv.participantType} | ${conv.participantName}`);
    }
    results.push({ name: 'conversations-list', status: 'PASS', duration: Date.now() - t0 });
  } catch (e: any) {
    log(`Get conversations failed: ${e.message}`, 'FAIL');
    results.push({ name: 'conversations-list', status: 'FAIL', error: e.message, duration: 0 });
  }

  await delay(500);

  // Test 10: Chat triggers skill
  try {
    logSection('TEST 10: Chat Triggers Skill');
    const t0 = Date.now();
    const chatRes = await client.chat('check my balance');
    log(`Response: ${chatRes.response}`);
    const hasBalance = chatRes.response.toLowerCase().includes('balance');
    log(`Skill triggered: ${hasBalance}`, hasBalance ? 'PASS' : 'FAIL');
    results.push({ name: 'chat-skill-trigger', status: hasBalance ? 'PASS' : 'FAIL', duration: Date.now() - t0 });
  } catch (e: any) {
    log(`Chat skill trigger failed: ${e.message}`, 'FAIL');
    results.push({ name: 'chat-skill-trigger', status: 'FAIL', error: e.message, duration: 0 });
  }

  await delay(500);

  // Test 11: Add Fact to Memory
  try {
    logSection('TEST 11: Add Fact to Memory');
    const t0 = Date.now();
    const fact = await client.addFact('Test fact: This is a test fact', 0.9);
    log(`Fact added: ${fact.fact.id}`, fact.success ? 'PASS' : 'FAIL');
    log(`Content: ${fact.fact.content}`);
    results.push({ name: 'memory-add-fact', status: fact.success ? 'PASS' : 'FAIL', duration: Date.now() - t0 });
  } catch (e: any) {
    log(`Add fact failed: ${e.message}`, 'FAIL');
    results.push({ name: 'memory-add-fact', status: 'FAIL', error: e.message, duration: 0 });
  }

  await delay(500);

  // Test 12: Get Facts
  try {
    logSection('TEST 12: Get Facts');
    const t0 = Date.now();
    const facts = await client.getFacts();
    log(`Facts count: ${facts.facts.length}`);
    for (const fact of facts.facts.slice(0, 3)) {
      log(`  - ${fact.content} (${fact.confidence})`);
    }
    results.push({ name: 'memory-get-facts', status: 'PASS', duration: Date.now() - t0 });
  } catch (e: any) {
    log(`Get facts failed: ${e.message}`, 'FAIL');
    results.push({ name: 'memory-get-facts', status: 'FAIL', error: e.message, duration: 0 });
  }

  await delay(500);

  // Test 13: Autonomous Mode - Start
  try {
    logSection('TEST 13: Autonomous Mode - Start');
    const t0 = Date.now();
    const res = await client.startAutonomous();
    log(`Started: ${res.success}`, res.success ? 'PASS' : 'FAIL');
    const status = await client.getAutonomousStatus();
    log(`Status: ${status.running}`);
    results.push({ name: 'autonomous-start', status: res.success && status.running ? 'PASS' : 'FAIL', duration: Date.now() - t0 });
  } catch (e: any) {
    log(`Autonomous start failed: ${e.message}`, 'FAIL');
    results.push({ name: 'autonomous-start', status: 'FAIL', error: e.message, duration: 0 });
  }

  await delay(500);

  // Test 14: Autonomous Mode - Stop
  try {
    logSection('TEST 14: Autonomous Mode - Stop');
    const t0 = Date.now();
    const res = await client.stopAutonomous();
    log(`Stopped: ${res.success}`, res.success ? 'PASS' : 'FAIL');
    const status = await client.getAutonomousStatus();
    log(`Status: ${status.running}`);
    results.push({ name: 'autonomous-stop', status: res.success && !status.running ? 'PASS' : 'FAIL', duration: Date.now() - t0 });
  } catch (e: any) {
    log(`Autonomous stop failed: ${e.message}`, 'FAIL');
    results.push({ name: 'autonomous-stop', status: 'FAIL', error: e.message, duration: 0 });
  }

  await delay(500);

  // Test 15: Multi-Conversation Isolation
  try {
    logSection('TEST 15: Multi-Conversation Isolation');
    const t0 = Date.now();
    
    const clientA = new TempoAgentClient(AGENT_URL, '0xAAAAAAAAAAAAAAAABBBBBBBBBBBBBBBBCCCCCCCCCC');
    const clientB = new TempoAgentClient(AGENT_URL, '0xDDDDDDDDDDDDDDDDEEEEEEEEEEEEEEFFFFFFFFFFFF');
    
    const resA = await clientA.chat('My name is Alice');
    const resB = await clientB.chat('My name is Bob');
    
    log(`Alice conv: ${resA.conversationId.slice(0, 8)}...`);
    log(`Bob conv: ${resB.conversationId.slice(0, 8)}...`);
    
    const isolated = resA.conversationId !== resB.conversationId;
    log(`Conversations isolated: ${isolated}`, isolated ? 'PASS' : 'FAIL');
    results.push({ name: 'conversation-isolation', status: isolated ? 'PASS' : 'FAIL', duration: Date.now() - t0 });
  } catch (e: any) {
    log(`Multi-conversation test failed: ${e.message}`, 'FAIL');
    results.push({ name: 'conversation-isolation', status: 'FAIL', error: e.message, duration: 0 });
  }

  await delay(500);

  // Test 16: Whisper (Silent Commands)
  try {
    logSection('TEST 16: Whisper - Silent Commands');
    const t0 = Date.now();
    const res = await client.whisper('balance');
    log(`Whisper response: ${res.response}`, 'PASS');
    results.push({ name: 'whisper', status: 'PASS', duration: Date.now() - t0 });
  } catch (e: any) {
    log(`Whisper failed: ${e.message}`, 'FAIL');
    results.push({ name: 'whisper', status: 'FAIL', error: e.message, duration: 0 });
  }

  await delay(500);

  // Test 17: Get Conversation Messages
  try {
    logSection('TEST 17: Get Conversation Messages');
    const t0 = Date.now();
    const convs = await client.getConversations();
    if (convs.conversations.length > 0) {
      const firstConv = convs.conversations[0];
      const details = await client.getConversation(firstConv.id);
      log(`Messages in conv: ${details.messages.length}`);
      for (const msg of details.messages.slice(-3)) {
        log(`  [${msg.role}] ${msg.content.slice(0, 50)}...`);
      }
      results.push({ name: 'conversation-messages', status: 'PASS', duration: Date.now() - t0 });
    } else {
      log('No conversations to test', 'SKIP');
      results.push({ name: 'conversation-messages', status: 'SKIP', duration: Date.now() - t0 });
    }
  } catch (e: any) {
    log(`Get messages failed: ${e.message}`, 'FAIL');
    results.push({ name: 'conversation-messages', status: 'FAIL', error: e.message, duration: 0 });
  }

  // Summary
  logSection('TEST SUMMARY');
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;
  const totalDuration = Date.now() - start;

  log(`Total Tests: ${total}`);
  log(`Passed: ${passed}`, passed === total ? 'PASS' : 'FAIL');
  log(`Failed: ${failed}`);
  log(`Skipped: ${skipped}`);
  log(`Duration: ${totalDuration}ms`);

  logSection('DETAILED RESULTS');
  for (const r of results) {
    const status = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⏭️';
    const duration = r.duration > 0 ? ` (${r.duration}ms)` : '';
    log(`${status} ${r.name}${duration}`, r.status);
    if (r.error) log(`   Error: ${r.error}`);
  }

  const summary = {
    timestamp: new Date().toISOString(),
    total,
    passed,
    failed,
    skipped,
    duration: totalDuration,
    results,
  };

  writeFileSync(join(logDir, 'test-summary.json'), JSON.stringify(summary, null, 2));
  log(`\n📝 Test summary saved to: ${join(logDir, 'test-summary.json')}`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  log(`Fatal error: ${e.message}`, 'FAIL');
  process.exit(1);
});
