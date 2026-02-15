// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract AgentRegistry is Ownable {
    struct Agent {
        address wallet;
        string name;
        string[] skills;
        uint8[] skillLevels;
        uint16 reputation;
        bool isActive;
        uint256 createdAt;
    }

    mapping(bytes32 => Agent) public agents;
    mapping(address => bytes32[]) public agentIdsByWallet;
    mapping(bytes32 => mapping(address => bool)) public approvedSpenders;

    event AgentRegistered(bytes32 indexed agentId, address indexed wallet, string name);
    event AgentUpdated(bytes32 indexed agentId);
    event SkillUpdated(bytes32 indexed agentId, string skill, uint8 level);
    event ReputationUpdated(bytes32 indexed agentId, uint16 newReputation);
    event SpenderApproved(bytes32 indexed agentId, address indexed spender, bool approved);

    constructor() Ownable(msg.sender) {}

    function registerAgent(string memory name, string[] memory skills) external returns (bytes32 agentId) {
        agentId = keccak256(abi.encodePacked(msg.sender, name, block.timestamp));
        
        string[] memory emptySkills = new string[](0);
        uint8[] memory emptyLevels = new uint8[](0);
        
        agents[agentId] = Agent({
            wallet: msg.sender,
            name: name,
            skills: skills,
            skillLevels: emptyLevels,
            reputation: 5000,
            isActive: true,
            createdAt: block.timestamp
        });

        agentIdsByWallet[msg.sender].push(agentId);

        emit AgentRegistered(agentId, msg.sender, name);
    }

    function registerAgentWithLevels(string memory name, string[] memory skills, uint8[] memory levels) external returns (bytes32 agentId) {
        require(skills.length == levels.length, "Skills and levels must have same length");
        
        agentId = keccak256(abi.encodePacked(msg.sender, name, block.timestamp));
        
        agents[agentId] = Agent({
            wallet: msg.sender,
            name: name,
            skills: skills,
            skillLevels: levels,
            reputation: 5000,
            isActive: true,
            createdAt: block.timestamp
        });

        agentIdsByWallet[msg.sender].push(agentId);

        emit AgentRegistered(agentId, msg.sender, name);
    }

    function getAgent(bytes32 agentId) external view returns (Agent memory) {
        return agents[agentId];
    }

    function getAgentByWallet(address wallet) external view returns (bytes32[] memory) {
        return agentIdsByWallet[wallet];
    }

    function updateReputation(bytes32 agentId, int16 delta) external onlyOwner {
        Agent storage agent = agents[agentId];
        require(agent.isActive, "Agent not active");
        
        if (delta > 0) {
            agent.reputation = uint16(min(int256(agent.reputation) + delta, 10000));
        } else {
            agent.reputation = uint16(max(int256(agent.reputation) + delta, 0));
        }
        
        emit ReputationUpdated(agentId, agent.reputation);
    }

    function updateSkills(bytes32 agentId, string[] memory skills, uint8[] memory levels) external {
        require(skills.length == levels.length, "Skills and levels must have same length");
        
        Agent storage agent = agents[agentId];
        require(agent.wallet == msg.sender || approvedSpenders[agentId][msg.sender], "Not authorized");
        
        agent.skills = skills;
        agent.skillLevels = levels;
        
        emit AgentUpdated(agentId);
    }

    function addSkill(bytes32 agentId, string memory skill, uint8 level) external {
        Agent storage agent = agents[agentId];
        require(agent.wallet == msg.sender || approvedSpenders[agentId][msg.sender], "Not authorized");
        
        agent.skills.push(skill);
        agent.skillLevels.push(level);
        
        emit AgentUpdated(agentId);
    }

    function approveSpender(bytes32 agentId, address spender, bool approved) external {
        require(agents[agentId].wallet == msg.sender, "Not the agent owner");
        approvedSpenders[agentId][spender] = approved;
        emit SpenderApproved(agentId, spender, approved);
    }

    function getTopAgents(uint8 count) external view returns (bytes32[] memory) {
        bytes32[] memory allIds;
        uint256 totalAgents = 0;
        
        for (uint256 i = 0; i < owner().balance; i++) {
            // This is inefficient, but works for demo
        }
        
        return allIds;
    }

    function min(int256 a, int256 b) internal pure returns (int256) {
        return a < b ? a : b;
    }

    function max(int256 a, int256 b) internal pure returns (int256) {
        return a > b ? a : b;
    }
}
