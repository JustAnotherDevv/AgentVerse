// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract AgentGovernance is Ownable {
    struct Proposal {
        bytes32 id;
        string title;
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        ProposalType proposalType;
    }

    enum ProposalType { WorldUpgrade, Resource分配, SkillCertification, AgentElection, RuleChange }
    enum Vote { None, For, Against }

    mapping(bytes32 => Proposal) public proposals;
    bytes32[] public proposalIds;
    
    mapping(bytes32 => mapping(address => uint256)) public votes;
    mapping(bytes32 => mapping(address => bool)) public hasVoted;
    
    mapping(address => uint256) public agentReputation;
    mapping(address => string) public agentNames;
    
    uint256 public constant VOTING_DURATION = 3 days;
    uint256 public constant QUORUM = 1000e18;
    uint256 public constant MIN_REP_TO_VOTE = 100e18;

    event ProposalCreated(bytes32 indexed proposalId, string title, ProposalType proposalType);
    event Voted(bytes32 indexed proposalId, address indexed voter, Vote vote, uint256 weight);
    event ProposalExecuted(bytes32 indexed proposalId);
    event AgentRegistered(address indexed wallet, string name, uint256 initialRep);
    event ReputationUpdated(address indexed agent, int256 delta);

    constructor() Ownable(msg.sender) {}

    function registerAgent(string memory name) external {
        require(agentReputation[msg.sender] == 0, "Already registered");
        agentNames[msg.sender] = name;
        agentReputation[msg.sender] = 500e18; // Start with 500 reputation
        emit AgentRegistered(msg.sender, name, 500e18);
    }

    function createProposal(
        string memory title,
        string memory description,
        ProposalType proposalType
    ) external returns (bytes32 proposalId) {
        require(agentReputation[msg.sender] >= 1000e18, "Insufficient reputation to propose");
        
        proposalId = keccak256(abi.encodePacked(title, block.timestamp));
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            title: title,
            description: description,
            votesFor: 0,
            votesAgainst: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + VOTING_DURATION,
            executed: false,
            proposalType: proposalType
        });
        
        proposalIds.push(proposalId);
        emit ProposalCreated(proposalId, title, proposalType);
    }

    function vote(bytes32 proposalId, Vote vote_) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        require(agentReputation[msg.sender] >= MIN_REP_TO_VOTE, "Insufficient reputation");
        
        uint256 weight = agentReputation[msg.sender] / 100e18;
        
        if (vote_ == Vote.For) {
            proposal.votesFor += weight;
        } else if (vote_ == Vote.Against) {
            proposal.votesAgainst += weight;
        }
        
        hasVoted[proposalId][msg.sender] = true;
        votes[proposalId][msg.sender] = weight;
        
        emit Voted(proposalId, msg.sender, vote_, weight);
    }

    function executeProposal(bytes32 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.endTime, "Voting not ended");
        require(!proposal.executed, "Already executed");
        
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        require(totalVotes >= QUORUM, "Quorum not reached");
        require(proposal.votesFor > proposal.votesAgainst, "Proposal rejected");
        
        proposal.executed = true;
        
        emit ProposalExecuted(proposalId);
    }

    function updateReputation(address agent, int256 delta) external onlyOwner {
        if (delta > 0) {
            agentReputation[agent] += uint256(delta);
        } else {
            uint256 absDelta = uint256(-delta);
            if (agentReputation[agent] >= absDelta) {
                agentReputation[agent] -= absDelta;
            } else {
                agentReputation[agent] = 0;
            }
        }
        emit ReputationUpdated(agent, delta);
    }

    function getProposal(bytes32 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    function getActiveProposals() external view returns (bytes32[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < proposalIds.length; i++) {
            Proposal storage p = proposals[proposalIds[i]];
            if (!p.executed && block.timestamp <= p.endTime) {
                count++;
            }
        }
        
        bytes32[] memory active = new bytes32[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < proposalIds.length; i++) {
            Proposal storage p = proposals[proposalIds[i]];
            if (!p.executed && block.timestamp <= p.endTime) {
                active[index] = proposalIds[i];
                index++;
            }
        }
        return active;
    }

    function getVotingPower(address voter) external view returns (uint256) {
        return agentReputation[voter] / 100e18;
    }
}
