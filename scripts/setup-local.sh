#!/bin/bash
set -e

echo "🚀 Setting up local Tempo Town environment..."

# Check if foundry is installed
if ! command -v forge &> /dev/null; then
    echo "❌ Foundry not found. Install from: https://book.getfoundry.sh/getting-started/installation"
    exit 1
fi

# Kill any existing anvil instances
pkill -f anvil 2>/dev/null || true

# Start local anvil node
echo "📡 Starting local Anvil node..."
anvil --host 0.0.0.0 --port 8545 > /dev/null 2>&1 &
ANVIL_PID=$!
echo "   Anvil PID: $ANVIL_PID"
sleep 3

# Set RPC URL
export RPC_URL="http://localhost:8545"
export CHAIN_ID=31337

# Generate deployer account (first anvil account)
DEPLOYER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
DEPLOYER_ADDR="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

# Generate user account
USER_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
USER_ADDR="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

echo "   Deployer: $DEPLOYER_ADDR"
echo "   User: $USER_ADDR"

# Deploy contracts
echo "📝 Deploying contracts..."

cd /Users/nevvdevv/Development/hackathons/tempo/tempo-town/contracts

# Create simple ERC20 locally
cat > /tmp/SimpleERC20.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleERC20 {
    string public name = "USD Coin";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    uint256 public totalSupply = 1000000000000000;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor() {
        balanceOf[msg.sender] = totalSupply;
    }
    
    function transfer(address to, uint256 value) external returns (bool) {
        require(balanceOf[msg.sender] >= value, "insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        require(balanceOf[from] >= value, "insufficient balance");
        require(allowance[from][msg.sender] >= value, "insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
    
    function mint(address to, uint256 value) external {
        balanceOf[to] += value;
        totalSupply += value;
        emit Transfer(address(0), to, value);
    }
}
EOF

# Deploy SimpleERC20 with broadcast
USDC_OUTPUT=$(forge create --rpc-url $RPC_URL --private-key $DEPLOYER_KEY --broadcast /tmp/SimpleERC20.sol:SimpleERC20 2>&1 | tee /tmp/forge_out.txt)
USDC_ADDR=$(grep "Deployed to:" /tmp/forge_out.txt | awk '{print $3}')
echo "   USDC deployed at: $USDC_ADDR"

if [ -z "$USDC_ADDR" ]; then
    echo "   Failed to get deployment address, using fallback..."
    USDC_ADDR="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
fi

# Transfer USDC to user (1M USDC with 6 decimals)
cast send --rpc-url $RPC_URL --private-key $DEPLOYER_KEY $USDC_ADDR "transfer(address,uint256)" $USER_ADDR 1000000000
echo "   Transferred 1M USDC to user"

# Transfer some USDC to agents account
AGENT_FUND_ADDR="0x90F79bf6EB2c4f870365E785982E1F101E93b906"
cast send --rpc-url $RPC_URL --private-key $DEPLOYER_KEY $USDC_ADDR "transfer(address,uint256)" $AGENT_FUND_ADDR 100000000
echo "   Transferred 100M USDC to agent fund wallet"

# Fund user with ETH
echo "💰 Funding accounts with ETH..."
cast send --rpc-url $RPC_URL --private-key $DEPLOYER_KEY $USER_ADDR --value 1000000000000000000
cast send --rpc-url $RPC_URL --private-key $DEPLOYER_KEY $AGENT_FUND_ADDR --value 100000000000000000

echo "✅ Setup complete!"
echo ""
echo "📋 Configuration for .env files:"
echo "   RPC_URL=$RPC_URL"
echo "   CHAIN_ID=$CHAIN_ID"  
echo "   USDC_ADDRESS=$USDC_ADDR"
echo ""
echo "User wallet (for frontend):"
echo "   PRIVATE_KEY=$USER_KEY"
echo "   ADDRESS=$USER_ADDR"
echo ""
echo "Agent fund wallet (for AI server .env):"
echo "   TASK_FUND_WALLET=$AGENT_FUND_ADDR"
echo ""
echo "🎮 Ready to start the app!"

# Save to .env.local
cat > /Users/nevvdevv/Development/hackathons/tempo/tempo-town/frontend/.env.local << EOF
VITE_RPC_URL=$RPC_URL
VITE_CHAIN_ID=$CHAIN_ID
VITE_USDC_ADDRESS=$USDC_ADDR
VITE_PRIVATE_KEY=$USER_KEY
EOF

cat > /Users/nevvdevv/Development/hackathons/tempo/tempo-town/ai/agent/.env.local << EOF
TEMPO_RPC=$RPC_URL
PRIVATE_KEY=$DEPLOYER_KEY
EOF

echo "📁 Saved config to .env.local files"
echo ""
echo "⚠️  IMPORTANT: Update ai/agent/.env with these values:"
echo "   TEMPO_RPC=$RPC_URL"
echo "   PRIVATE_KEY=$DEPLOYER_KEY"
echo "   TASK_FUND_WALLET=$AGENT_FUND_ADDR"
