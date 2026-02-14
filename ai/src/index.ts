import { 
  createPublicClient, 
  http, 
  parseEther,
  hexToString 
} from "viem";
import { generatePrivateKey, privateKeyToAccount, signMessage } from "viem/accounts";

// Configuration via environment variables
function getPrivateKey(): `0x${string}` {
  if (process.env.PRIVATE_KEY) {
    const key = process.env.PRIVATE_KEY;
    return key.startsWith('0x') ? key as `0x${string}` : `0x${key}`;
  }
  // generatePrivateKey returns 0x... hex string directly in viem
  return generatePrivateKey();
}

const PRIVATE_KEY = getPrivateKey();
const RPC_URL = process.env.RPC_URL || "https://rpc.berachain.com";
const CHAIN_ID = parseInt(process.env.CHAIN_ID || "80084");

export interface AgentConfig {
  privateKey: `0x${string}`;
  chainId: number;
  rpcUrl: string;
}

export interface TransactionRequest {
  to: string;
  value?: bigint;
  data?: string;
}

/**
 * Minimal Shade Agent with private key support
 * 
 * This provides basic agent functionality with:
 * - Private key management
 * - Transaction signing
 * - Message signing
 * - Balance queries
 * 
 * For production use, integrate with:
 * - TEE (Trusted Execution Environment) for verifiability
 * - NEAR Chain Signatures for multichain account abstraction
 */
export class ShadeAgent {
  private account: ReturnType<typeof privateKeyToAccount>;
  private publicClient: ReturnType<typeof createPublicClient>;
  private chainId: number;

  constructor(config: AgentConfig) {
    this.account = privateKeyToAccount(config.privateKey);
    this.chainId = config.chainId;
    
    this.publicClient = createPublicClient({
      transport: http(config.rpcUrl),
      chain: { 
        id: config.chainId, 
        name: 'Berachain', 
        nativeCurrency: { name: 'BERA', symbol: 'BERA', decimals: 18 },
        rpcUrls: { default: { http: [config.rpcUrl] } }
      }
    });
  }

  /**
   * Get the agent's account address
   */
  getAddress(): string {
    return this.account.address;
  }

  /**
   * Get the agent's private key (WARNING: handle with care)
   */
  getPrivateKey(): string {
    return this.account.privateKey;
  }

  /**
   * Get the agent's balance
   */
  async getBalance(): Promise<bigint> {
    return await this.publicClient.getBalance({ 
      address: this.account.address 
    });
  }

  /**
   * Sign a message
   */
  async signMessage(message: string): Promise<string> {
    return await this.account.signMessage({ message });
  }

  /**
   * Sign typed data (for EIP-712)
   */
  async signTypedData<T extends string | readonly string[]>(types: Record<string, unknown[]>, message: Record<string, T>): Promise<string> {
    return await this.account.signTypedData({
      types,
      message,
      primaryType: 'Message',
    });
  }

  /**
   * Sign a transaction hash (simulates Shade Agent's request_signature)
   * Returns signature in secp256k1 format for EVM compatibility
   */
  async signTransactionHash(payload: `0x${string}`): Promise<{
    scheme: string;
    big_r: { affine_point: string };
    s: { scalar: string };
    recovery_id: number;
  }> {
    const signature = await this.account.signMessage({ 
      message: { raw: payload }
    });
    
    // Parse signature into r, s components for secp256k1
    const r = '0x' + signature.slice(2, 66);
    const s = '0x' + signature.slice(66, 130);
    const v = parseInt(signature.slice(130, 132), 16);
    
    return {
      scheme: 'Secp256k1',
      big_r: { affine_point: '0x04' + r.slice(2) }, // uncompressed point
      s: { scalar: s },
      recovery_id: v < 27 ? v : v - 27,
    };
  }

  /**
   * Send a transaction
   */
  async sendTransaction(request: TransactionRequest): Promise<string> {
    const hash = await this.publicClient.sendRawTransaction({
      account: this.account,
      chain: { 
        id: this.chainId, 
        name: 'Berachain', 
        nativeCurrency: { name: 'BERA', symbol: 'BERA', decimals: 18 },
        rpcUrls: { default: { http: [RPC_URL] } }
      },
      to: request.to,
      value: request.value || BigInt(0),
      data: request.data || "0x",
    });
    
    return hash;
  }

  /**
   * Wait for transaction receipt
   */
  async waitForTransactionReceipt(hash: string) {
    return await this.publicClient.waitForTransactionReceipt({ hash });
  }

  /**
   * Read a contract
   */
  async readContract<T>(abi: any[], functionName: string, args: any[]): Promise<T> {
    return await this.publicClient.readContract({
      address: args[0] as string, // First arg is usually address
      abi,
      functionName,
      args: args.slice(1),
    }) as T;
  }

  /**
   * Write to a contract
   */
  async writeContract(abi: any[], functionName: string, args: any[]): Promise<string> {
    const hash = await this.publicClient.writeContract({
      account: this.account,
      chain: { 
        id: this.chainId, 
        name: 'Berachain', 
        nativeCurrency: { name: 'BERA', symbol: 'BERA', decimals: 18 },
        rpcUrls: { default: { http: [RPC_URL] } }
      },
      address: args[0] as string,
      abi,
      functionName,
      args: args.slice(1),
    });
    
    return hash;
  }
}

// Demo usage
async function main() {
  console.log("=== Minimal Shade Agent Demo ===\n");
  
  // Create agent with generated or env key
  const agent = new ShadeAgent({
    privateKey: PRIVATE_KEY,
    chainId: 80084, // Berachain testnet
    rpcUrl: RPC_URL,
  });

  console.log(`Agent Address: ${agent.getAddress()}`);
  console.log(`Private Key: ${PRIVATE_KEY.slice(0, 14)}...`);
  
  // Get balance
  const balance = await agent.getBalance();
  console.log(`Balance: ${parseEther(balance.toString())} BERA`);

  // Sign message
  const message = "Hello from Shade Agent!";
  const signature = await agent.signMessage(message);
  console.log(`\nSigned message: ${signature.slice(0, 50)}...`);

  // Sign transaction hash (simulates multichain signature)
  const payload = "0x" + "ab".repeat(32);
  const txSignature = await agent.signTransactionHash(payload);
  console.log(`\nTransaction signature:`);
  console.log(JSON.stringify(txSignature, null, 2));

  console.log("\n=== Demo Complete ===");
}

// Run if executed directly
main().catch(console.error);
