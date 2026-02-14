import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';

const TEMPO_CHAIN = {
  id: 8081,
  name: 'Tempo Testnet',
  nativeCurrency: { name: 'TEMPO', symbol: 'TEMPO', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evm.testnet.tempo.blockchaineps.com'] },
    public: { http: ['https://evm.testnet.tempo.blockchaineps.com'] },
  },
};

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log('🔑 Generated Keypair for Tempo Testnet');
console.log('=========================================');
console.log(`Private Key: ${privateKey}`);
console.log(`Address:      ${account.address}`);
console.log('');

// Verify it works
const walletClient = createWalletClient({
  account,
  chain: TEMPO_CHAIN,
  transport: http('https://evm.testnet.tempo.blockchaineps.com'),
});

const publicClient = createPublicClient({
  chain: TEMPO_CHAIN,
  transport: http('https://evm.testnet.tempo.blockchaineps.com'),
});

console.log('Testing connection...');
try {
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Balance: ${balance} wei`);
  console.log('');
  console.log('✅ Keypair generated successfully!');
} catch (e) {
  console.log('Note: Balance check failed (expected if no funds)');
}
