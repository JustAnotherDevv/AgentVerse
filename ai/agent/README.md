# Tempo Agent

OpenClaw-style autonomous AI agent for Tempo EVM testnet.

## Features

- 🤖 AI-powered chat via OpenRouter
- 💓 Autonomous heartbeat mode
- 💾 SQLite persistent memory
- 👤 Identity system (human/agent detection)
- 💬 Multi-conversation support
- ⛓️ EVM blockchain interactions
- 🛠️ Skill/plugin system

## Setup

```bash
cd ai/agent
cp .env.example .env
# Edit .env with your keys
npm install
npm start
```

## Configuration

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key for LLM chat |
| `TEMPO_RPC` | Tempo network RPC URL |
| `PRIVATE_KEY` | Wallet private key for transactions |
| `PORT` | Server port (default: 3000) |
| `AGENT_NAME` | Name of your agent |
| `MAX_TX_VALUE` | Max TEMPO per transaction |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | Chat with AI |
| POST | `/whisper` | Silent command mode |
| GET | `/health` | Health check |
| GET | `/balance` | Get balance |
| POST | `/send` | Send TEMPO |
| POST | `/call` | Call contract |
| POST | `/read` | Read contract |
| GET | `/conversations` | List conversations |
| GET | `/memory/facts` | List facts |
| POST | `/autonomous/start` | Start heartbeat |
| POST | `/autonomous/stop` | Stop heartbeat |

## Development

```bash
npm run dev    # Watch mode
npm test      # Run tests
```
