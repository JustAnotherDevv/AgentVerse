// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract TaskBoard is Ownable {
    enum TaskType { Assist, Build, Explore, Create }
    enum TaskStatus { Open, Accepted, Completed, Disputed }

    struct Task {
        bytes32 id;
        address creator;
        bytes32 agentId;
        TaskType taskType;
        string description;
        uint256 reward;
        bytes32 requiredSkill;
        TaskStatus status;
        string proof;
        uint256 createdAt;
        uint256 completedAt;
    }

    mapping(bytes32 => Task) public tasks;
    bytes32[] public taskIds;
    mapping(address => bytes32[]) public tasksByCreator;
    mapping(bytes32 => bytes32[]) public tasksByAgent;

    event TaskCreated(bytes32 indexed taskId, address indexed creator, string description, uint256 reward);
    event TaskAccepted(bytes32 indexed taskId, bytes32 indexed agentId);
    event TaskCompleted(bytes32 indexed taskId, string proof);
    event TaskDisputed(bytes32 indexed taskId);

    constructor() Ownable(msg.sender) {}

    function postTask(
        TaskType taskType,
        string memory description,
        uint256 reward,
        bytes32 requiredSkill
    ) external payable returns (bytes32 taskId) {
        require(msg.value >= reward, "Insufficient reward provided");
        
        taskId = keccak256(abi.encodePacked(msg.sender, description, block.timestamp));
        
        tasks[taskId] = Task({
            id: taskId,
            creator: msg.sender,
            agentId: bytes32(0),
            taskType: taskType,
            description: description,
            reward: reward,
            requiredSkill: requiredSkill,
            status: TaskStatus.Open,
            proof: "",
            createdAt: block.timestamp,
            completedAt: 0
        });
        
        taskIds.push(taskId);
        tasksByCreator[msg.sender].push(taskId);

        emit TaskCreated(taskId, msg.sender, description, reward);
    }

    function acceptTask(bytes32 taskId, bytes32 agentId) external {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Open, "Task not open");
        
        task.agentId = agentId;
        task.status = TaskStatus.Accepted;
        
        tasksByAgent[agentId].push(taskId);

        emit TaskAccepted(taskId, agentId);
    }

    function completeTask(bytes32 taskId, string memory proof) external {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Accepted, "Task not accepted");
        
        task.status = TaskStatus.Completed;
        task.proof = proof;
        task.completedAt = block.timestamp;
        
        payable(owner()).transfer(task.reward);

        emit TaskCompleted(taskId, proof);
    }

    function disputeTask(bytes32 taskId) external {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.Accepted, "Task not accepted");
        
        task.status = TaskStatus.Disputed;

        emit TaskDisputed(taskId);
    }

    function getTask(bytes32 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }

    function getOpenTasks() external view returns (bytes32[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < taskIds.length; i++) {
            if (tasks[taskIds[i]].status == TaskStatus.Open) {
                count++;
            }
        }
        
        bytes32[] memory openTasks = new bytes32[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < taskIds.length; i++) {
            if (tasks[taskIds[i]].status == TaskStatus.Open) {
                openTasks[index] = taskIds[i];
                index++;
            }
        }
        
        return openTasks;
    }

    function getTasksByStatus(TaskStatus status) external view returns (bytes32[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < taskIds.length; i++) {
            if (tasks[taskIds[i]].status == status) {
                count++;
            }
        }
        
        bytes32[] memory filtered = new bytes32[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < taskIds.length; i++) {
            if (tasks[taskIds[i]].status == status) {
                filtered[index] = taskIds[i];
                index++;
            }
        }
        
        return filtered;
    }
}
