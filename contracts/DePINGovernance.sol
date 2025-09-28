// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title DePINGovernance
 * @dev Governance contract for DePIN network with staking and rewards
 */
contract DePINGovernance is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    
    IERC20 public immutable stakingToken; // HBAR token
    
    // Node structure
    struct DePINNode {
        address operator;
        string nodeId;
        string city;
        string country;
        uint256 stakedAmount;
        uint256 rewardsEarned;
        uint256 uptime; // Percentage * 100 (9870 = 98.70%)
        uint256 lastPing;
        bool active;
        uint256 createdAt;
    }
    
    // Proposal structure
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        ProposalType proposalType;
        bytes proposalData;
    }
    
    enum ProposalType { PARAMETER_CHANGE, NODE_REMOVAL, REWARD_RATE_CHANGE, UPGRADE }
    
    // Counters
    Counters.Counter private _nodeIdCounter;
    Counters.Counter private _proposalIdCounter;
    
    // State variables
    mapping(uint256 => DePINNode) public nodes;
    mapping(address => uint256) public operatorToNode;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => uint256) public stakedBalance;
    
    // Network parameters
    uint256 public minimumStake = 1000 * 1e8; // 1000 HBAR
    uint256 public rewardRate = 87; // 87% APR
    uint256 public totalStaked;
    uint256 public totalNodes;
    uint256 public activeNodes;
    
    // Governance parameters
    uint256 public votingPeriod = 7 days;
    uint256 public proposalThreshold = 1000 * 1e8; // 1000 HBAR to propose
    uint256 public quorum = 5000; // 50% (basis points)
    
    // Events
    event NodeRegistered(uint256 indexed nodeId, address indexed operator, string city);
    event NodeStaked(uint256 indexed nodeId, uint256 amount);
    event NodeUnstaked(uint256 indexed nodeId, uint256 amount);
    event RewardsClaimed(uint256 indexed nodeId, uint256 amount);
    event NodePinged(uint256 indexed nodeId, uint256 uptime);
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    
    constructor(address _stakingToken) {
        stakingToken = IERC20(_stakingToken);
    }
    
    /**
     * @dev Register new DePIN node
     */
    function registerNode(
        string memory nodeId,
        string memory city,
        string memory country,
        uint256 stakeAmount
    ) external nonReentrant {
        require(operatorToNode[msg.sender] == 0, "Operator already has a node");
        require(stakeAmount >= minimumStake, "Insufficient stake amount");
        require(bytes(nodeId).length > 0, "Node ID required");
        
        // Transfer stake
        stakingToken.transferFrom(msg.sender, address(this), stakeAmount);
        
        uint256 nodeIdNum = _nodeIdCounter.current();
        _nodeIdCounter.increment();
        
        nodes[nodeIdNum] = DePINNode({
            operator: msg.sender,
            nodeId: nodeId,
            city: city,
            country: country,
            stakedAmount: stakeAmount,
            rewardsEarned: 0,
            uptime: 10000, // Start with 100% uptime
            lastPing: block.timestamp,
            active: true,
            createdAt: block.timestamp
        });
        
        operatorToNode[msg.sender] = nodeIdNum;
        stakedBalance[msg.sender] = stakeAmount;
        totalStaked += stakeAmount;
        totalNodes++;
        activeNodes++;
        
        emit NodeRegistered(nodeIdNum, msg.sender, city);
        emit NodeStaked(nodeIdNum, stakeAmount);
    }
    
    /**
     * @dev Add more stake to existing node
     */
    function addStake(uint256 amount) external nonReentrant {
        uint256 nodeId = operatorToNode[msg.sender];
        require(nodeId != 0, "No node found for operator");
        require(amount > 0, "Amount must be positive");
        
        stakingToken.transferFrom(msg.sender, address(this), amount);
        
        nodes[nodeId].stakedAmount += amount;
        stakedBalance[msg.sender] += amount;
        totalStaked += amount;
        
        emit NodeStaked(nodeId, amount);
    }
    
    /**
     * @dev Remove stake from node
     */
    function removeStake(uint256 amount) external nonReentrant {
        uint256 nodeId = operatorToNode[msg.sender];
        require(nodeId != 0, "No node found for operator");
        require(amount > 0, "Amount must be positive");
        require(nodes[nodeId].stakedAmount >= amount, "Insufficient staked amount");
        require(nodes[nodeId].stakedAmount - amount >= minimumStake, "Cannot go below minimum stake");
        
        nodes[nodeId].stakedAmount -= amount;
        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;
        
        stakingToken.transfer(msg.sender, amount);
        
        emit NodeUnstaked(nodeId, amount);
    }
    
    /**
     * @dev Ping node to update uptime
     */
    function pingNode(uint256 uptime) external {
        uint256 nodeId = operatorToNode[msg.sender];
        require(nodeId != 0, "No node found for operator");
        require(nodes[nodeId].active, "Node is not active");
        require(uptime <= 10000, "Invalid uptime percentage");
        
        DePINNode storage node = nodes[nodeId];
        
        // Calculate rewards based on uptime and stake
        uint256 timeSinceLastPing = block.timestamp - node.lastPing;
        uint256 reward = calculateReward(node.stakedAmount, timeSinceLastPing, uptime);
        
        node.uptime = uptime;
        node.lastPing = block.timestamp;
        node.rewardsEarned += reward;
        
        emit NodePinged(nodeId, uptime);
    }
    
    /**
     * @dev Claim accumulated rewards
     */
    function claimRewards() external nonReentrant {
        uint256 nodeId = operatorToNode[msg.sender];
        require(nodeId != 0, "No node found for operator");
        
        DePINNode storage node = nodes[nodeId];
        uint256 rewards = node.rewardsEarned;
        require(rewards > 0, "No rewards to claim");
        
        node.rewardsEarned = 0;
        
        // Mint rewards (in real implementation, this would be from a reward pool)
        stakingToken.transfer(msg.sender, rewards);
        
        emit RewardsClaimed(nodeId, rewards);
    }
    
    /**
     * @dev Create governance proposal
     */
    function createProposal(
        string memory title,
        string memory description,
        ProposalType proposalType,
        bytes memory proposalData
    ) external returns (uint256) {
        require(stakedBalance[msg.sender] >= proposalThreshold, "Insufficient stake to propose");
        require(bytes(title).length > 0, "Title required");
        
        uint256 proposalId = _proposalIdCounter.current();
        _proposalIdCounter.increment();
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            title: title,
            description: description,
            votesFor: 0,
            votesAgainst: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + votingPeriod,
            executed: false,
            proposalType: proposalType,
            proposalData: proposalData
        });
        
        emit ProposalCreated(proposalId, msg.sender, title);
        return proposalId;
    }
    
    /**
     * @dev Vote on proposal
     */
    function vote(uint256 proposalId, bool support) external {
        require(stakedBalance[msg.sender] > 0, "Must have stake to vote");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        require(block.timestamp <= proposals[proposalId].endTime, "Voting period ended");
        require(proposals[proposalId].startTime != 0, "Proposal does not exist");
        
        uint256 weight = stakedBalance[msg.sender];
        hasVoted[proposalId][msg.sender] = true;
        
        if (support) {
            proposals[proposalId].votesFor += weight;
        } else {
            proposals[proposalId].votesAgainst += weight;
        }
        
        emit VoteCast(proposalId, msg.sender, support, weight);
    }
    
    /**
     * @dev Execute proposal
     */
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        require(!proposal.executed, "Proposal already executed");
        require(proposal.votesFor > proposal.votesAgainst, "Proposal rejected");
        require((proposal.votesFor + proposal.votesAgainst) * 10000 >= totalStaked * quorum, "Quorum not reached");
        
        proposal.executed = true;
        
        // Execute proposal based on type
        if (proposal.proposalType == ProposalType.PARAMETER_CHANGE) {
            _executeParameterChange(proposal.proposalData);
        } else if (proposal.proposalType == ProposalType.REWARD_RATE_CHANGE) {
            _executeRewardRateChange(proposal.proposalData);
        }
        // Add more proposal types as needed
        
        emit ProposalExecuted(proposalId);
    }
    
    /**
     * @dev Calculate node rewards
     */
    function calculateReward(uint256 stakedAmount, uint256 timeElapsed, uint256 uptime) public view returns (uint256) {
        // Annual reward = stakedAmount * rewardRate / 100
        // Time-based reward = annual * timeElapsed / 365 days
        // Uptime adjustment = reward * uptime / 10000
        
        uint256 annualReward = (stakedAmount * rewardRate) / 100;
        uint256 timeBasedReward = (annualReward * timeElapsed) / 365 days;
        uint256 uptimeAdjustedReward = (timeBasedReward * uptime) / 10000;
        
        return uptimeAdjustedReward;
    }
    
    /**
     * @dev Get network statistics
     */
    function getNetworkStats() external view returns (
        uint256 _totalNodes,
        uint256 _activeNodes,
        uint256 _totalStaked,
        uint256 _averageUptime,
        uint256 _rewardRate
    ) {
        uint256 totalUptime = 0;
        uint256 nodeCount = 0;
        
        for (uint256 i = 0; i < _nodeIdCounter.current(); i++) {
            if (nodes[i].active) {
                totalUptime += nodes[i].uptime;
                nodeCount++;
            }
        }
        
        return (
            totalNodes,
            activeNodes,
            totalStaked,
            nodeCount > 0 ? totalUptime / nodeCount : 0,
            rewardRate
        );
    }
    
    /**
     * @dev Get node info
     */
    function getNodeInfo(uint256 nodeId) external view returns (DePINNode memory) {
        return nodes[nodeId];
    }
    
    /**
     * @dev Execute parameter change proposal
     */
    function _executeParameterChange(bytes memory data) private {
        // Decode and execute parameter changes
        // Implementation depends on specific parameters
    }
    
    /**
     * @dev Execute reward rate change proposal
     */
    function _executeRewardRateChange(bytes memory data) private {
        uint256 newRate = abi.decode(data, (uint256));
        require(newRate <= 200, "Reward rate too high"); // Max 200% APR
        rewardRate = newRate;
    }
    
    /**
     * @dev Emergency pause (owner only)
     */
    function emergencyPause() external onlyOwner {
        // Implement emergency pause logic
    }
}
