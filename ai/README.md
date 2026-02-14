# Minimal Shade Agent

A minimal implementation of a Shade Agent with private key support.

## What is a Shade Agent?

From the [NEAR Shade Agents documentation](https://docs.near.org/ai/shade-agents/getting-started/introduction):

> Shade Agents are decentralized and trustless AI agents that control accounts and assets across multiple blockchains using Trusted Execution Environments (TEEs) and NEAR's decentralized key management.

This implementation provides basic agent functionality for development/testing. For production, you should integrate with:
- **TEE (Trusted Execution Environment)** - for verifiability and code execution
- **NEAR Chain Signatures** - for decentralized key management and multichain support

## Features

- ✅ Private key management via environment variables
- ✅ Transaction signing and sending
- ✅ Message signing
- ✅ EIP-712 typed data signing
- ✅ Balance queries
- ✅ Contract read/write operations

## Installation

```bash
cd ai
npm install
```

## Usage

### Environment Variables

Create a `.env` file:

```bash
PRIVATE_KEY=0x...  # Your private key (optional - will generate one if not provided)
RPC_URL=https://rpc.berachain.com  # RPC endpoint
```

### Running the Demo

```bash
npm run dev
```

### Using in Your Project

```typescript
import { ShadeAgent } from './src/index';

const agent = new ShadeAgent({
  privateKey: '0x...', // or use env PRIVATE_KEY
  chainId: 80084,      // Berachain testnet
  rpcUrl: 'https://rpc.berachain.com',
});

console.log(`Agent address: ${agent.getAddress()}`);

// Sign a message
const signature = await agent.signMessage('Hello!');

// Send a transaction
const txHash = await agent.sendTransaction({
  to: '0x...',
  value: parseEther('0.01'),
});
```

## API

### `new ShadeAgent(config)`

Create a new agent instance.

- `config.privateKey` - EVM private key
- `config.chainId` - Chain ID (e.g., 80084 for Berachain)
- `config.rpcUrl` - RPC URL

### Methods

| Method | Description |
|--------|-------------|
| `getAddress()` | Get agent's EVM address |
| `getPrivateKey()` | Get the private key |
| `getBalance()` | Get native token balance |
| `signMessage(message)` | Sign a message |
| `signTypedData(types, message)` | Sign typed data (EIP-712) |
| `signTransactionHash(payload)` | Sign a transaction hash |
| `sendTransaction(request)` | Send a transaction |
| `waitForTransactionReceipt(hash)` | Wait for tx receipt |
| `readContract(abi, fn, args)` | Read from contract |
| `writeContract(abi, fn, args)` | Write to contract |

## Production Considerations

For production use, consider:

1. **TEE Integration** - Run the agent in a Trusted Execution Environment (e.g., Phala Cloud)
2. **NEAR Chain Signatures** - Use for multichain account abstraction
3. **NEAR Agent Contract** - Deploy an agent contract for registration and access control

See the [official Shade Agents documentation](https://docs.near.org/ai/shade-agents/getting-started/introduction) for more details.

## License

MIT
