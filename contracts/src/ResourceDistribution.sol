// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract ResourceDistribution is Ownable {
    struct Resource {
        bytes32 id;
        string name;
        int256 x;
        int256 y;
        uint256 amount;
        address creator;
        uint256 votes;
        bool approved;
        bool claimed;
    }

    mapping(bytes32 => Resource) public resources;
    bytes32[] public resourceIds;
    
    mapping(address => bytes32[]) public resourcesByCreator;
    mapping(bytes32 => mapping(address => bool)) public hasVoted;
    
    event ResourceProposed(bytes32 indexed id, string name, int256 x, int256 y, address indexed creator);
    event ResourceApproved(bytes32 indexed id);
    event ResourceClaimed(bytes32 indexed id, address indexed claimer);

    constructor() Ownable(msg.sender) {}

    function proposeResource(
        string memory name,
        int256 x,
        int256 y,
        uint256 amount
    ) external returns (bytes32 resourceId) {
        resourceId = keccak256(abi.encodePacked(name, x, y, block.timestamp));
        
        resources[resourceId] = Resource({
            id: resourceId,
            name: name,
            x: x,
            y: y,
            amount: amount,
            creator: msg.sender,
            votes: 0,
            approved: false,
            claimed: false
        });
        
        resourceIds.push(resourceId);
        resourcesByCreator[msg.sender].push(resourceId);
        
        emit ResourceProposed(resourceId, name, x, y, msg.sender);
    }

    function voteForResource(bytes32 resourceId) external {
        Resource storage resource = resources[resourceId];
        require(!resource.approved, "Already approved");
        require(!hasVoted[resourceId][msg.sender], "Already voted");
        
        resource.votes++;
        hasVoted[resourceId][msg.sender] = true;
    }

    function approveResource(bytes32 resourceId) external onlyOwner {
        Resource storage resource = resources[resourceId];
        require(resource.votes >= 3, "Need at least 3 votes");
        require(!resource.approved, "Already approved");
        
        resource.approved = true;
        emit ResourceApproved(resourceId);
    }

    function claimResource(bytes32 resourceId) external {
        Resource storage resource = resources[resourceId];
        require(resource.approved, "Not approved");
        require(!resource.claimed, "Already claimed");
        
        resource.claimed = true;
        emit ResourceClaimed(resourceId, msg.sender);
    }

    function getApprovedResources() external view returns (Resource[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < resourceIds.length; i++) {
            if (resources[resourceIds[i]].approved && !resources[resourceIds[i]].claimed) {
                count++;
            }
        }
        
        Resource[] memory approved = new Resource[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < resourceIds.length; i++) {
            Resource storage r = resources[resourceIds[i]];
            if (r.approved && !r.claimed) {
                approved[index] = r;
                index++;
            }
        }
        return approved;
    }

    function getResource(bytes32 resourceId) external view returns (Resource memory) {
        return resources[resourceId];
    }
}
