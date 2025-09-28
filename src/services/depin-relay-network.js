import {
  Client,
  PrivateKey,
  AccountCreateTransaction,
  TransferTransaction,
  Hbar,
  AccountId
} from '@hashgraph/sdk';
import crypto from 'crypto';
import logger from '../utils/logger';
import { hederaNetwork, hederaOperatorId, hederaOperatorKey } from '../config.json';
import { encryptGDPRData, DATA_CLASSIFICATION } from '../utils/encryption';

// Initialize Hedera client
const client = Client.forTestnet();
client.setOperator(hederaOperatorId, hederaOperatorKey);

// DePIN Network Constants
const DEPIN_CONFIG = {
  MIN_STAKE_AMOUNT: 1000, // Minimum HBAR to stake for relay node
  REWARD_RATE_PER_HOUR: 0.1, // HBAR per hour for active relay
  UPTIME_THRESHOLD: 0.95, // 95% uptime required for full rewards
  SLASH_PERCENTAGE: 0.1, // 10% stake slashed for poor performance
  NETWORK_FEE_PERCENTAGE: 0.02, // 2% network fee on rewards
  MAX_NODES_PER_CITY: 50, // Maximum relay nodes per city hub
  HEARTBEAT_INTERVAL: 30000, // 30 seconds heartbeat
  OFFLINE_THRESHOLD: 120000 // 2 minutes offline threshold
};

// Relay Node Status
const NODE_STATUS = {
  REGISTERING: 'REGISTERING',
  ACTIVE: 'ACTIVE',
  OFFLINE: 'OFFLINE',
  SLASHED: 'SLASHED',
  DEREGISTERING: 'DEREGISTERING'
};

// City Hub Locations (20 major cities)
const CITY_HUBS = [
  { id: 'NYC', name: 'New York', lat: 40.7128, lng: -74.0060, region: 'NA' },
  { id: 'LON', name: 'London', lat: 51.5074, lng: -0.1278, region: 'EU' },
  { id: 'TOK', name: 'Tokyo', lat: 35.6762, lng: 139.6503, region: 'APAC' },
  { id: 'SIN', name: 'Singapore', lat: 1.3521, lng: 103.8198, region: 'APAC' },
  { id: 'SYD', name: 'Sydney', lat: -33.8688, lng: 151.2093, region: 'APAC' },
  { id: 'TOR', name: 'Toronto', lat: 43.6532, lng: -79.3832, region: 'NA' },
  { id: 'BER', name: 'Berlin', lat: 52.5200, lng: 13.4050, region: 'EU' },
  { id: 'PAR', name: 'Paris', lat: 48.8566, lng: 2.3522, region: 'EU' },
  { id: 'HKG', name: 'Hong Kong', lat: 22.3193, lng: 114.1694, region: 'APAC' },
  { id: 'DXB', name: 'Dubai', lat: 25.2048, lng: 55.2708, region: 'ME' },
  { id: 'MUM', name: 'Mumbai', lat: 19.0760, lng: 72.8777, region: 'APAC' },
  { id: 'SAO', name: 'São Paulo', lat: -23.5505, lng: -46.6333, region: 'SA' },
  { id: 'MEX', name: 'Mexico City', lat: 19.4326, lng: -99.1332, region: 'NA' },
  { id: 'JNB', name: 'Johannesburg', lat: -26.2041, lng: 28.0473, region: 'AF' },
  { id: 'CAI', name: 'Cairo', lat: 30.0444, lng: 31.2357, region: 'AF' },
  { id: 'MOS', name: 'Moscow', lat: 55.7558, lng: 37.6176, region: 'EU' },
  { id: 'SEO', name: 'Seoul', lat: 37.5665, lng: 126.9780, region: 'APAC' },
  { id: 'BAN', name: 'Bangkok', lat: 13.7563, lng: 100.5018, region: 'APAC' },
  { id: 'IST', name: 'Istanbul', lat: 41.0082, lng: 28.9784, region: 'EU' },
  { id: 'LAG', name: 'Lagos', lat: 6.5244, lng: 3.3792, region: 'AF' }
];

class DePINRelayNetwork {
  constructor() {
    this.relayNodes = new Map();
    this.cityHubs = new Map();
    this.stakingPools = new Map();
    this.rewardDistribution = new Map();
    this.networkMetrics = {
      totalNodes: 0,
      activeNodes: 0,
      totalStaked: 0,
      totalRewardsDistributed: 0,
      networkUptime: 1.0,
      avgLatency: 0
    };
    
    // Initialize city hubs
    this.initializeCityHubs();
    
    // Start network monitoring
    this.startNetworkMonitoring();
  }

  initializeCityHubs() {
    CITY_HUBS.forEach(city => {
      this.cityHubs.set(city.id, {
        ...city,
        activeNodes: 0,
        totalStaked: 0,
        avgLatency: 0,
        load: 0,
        capacity: DEPIN_CONFIG.MAX_NODES_PER_CITY,
        lastUpdated: new Date().toISOString()
      });
    });

    logger.info('DePINRelayNetwork', 'initializeCityHubs', `Initialized ${CITY_HUBS.length} city hubs`);
  }

  async registerRelayNode(nodeConfig) {
    try {
      const nodeId = crypto.randomUUID();
      
      logger.info('DePINRelayNetwork', 'registerRelayNode', `Registering node: ${nodeId}`);

      // Validate staking amount
      if (nodeConfig.stakeAmount < DEPIN_CONFIG.MIN_STAKE_AMOUNT) {
        throw new Error(`Minimum stake required: ${DEPIN_CONFIG.MIN_STAKE_AMOUNT} HBAR`);
      }

      // Check city hub capacity
      const cityHub = this.cityHubs.get(nodeConfig.cityId);
      if (!cityHub) {
        throw new Error(`Invalid city hub: ${nodeConfig.cityId}`);
      }

      if (cityHub.activeNodes >= cityHub.capacity) {
        throw new Error(`City hub ${nodeConfig.cityId} at capacity`);
      }

      // Create relay node
      const relayNode = {
        nodeId,
        operatorId: nodeConfig.operatorId,
        cityId: nodeConfig.cityId,
        location: {
          lat: cityHub.lat + (Math.random() - 0.5) * 0.1, // Random offset within city
          lng: cityHub.lng + (Math.random() - 0.5) * 0.1
        },
        stakeAmount: nodeConfig.stakeAmount,
        status: NODE_STATUS.REGISTERING,
        registeredAt: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
        uptime: 1.0,
        totalRewards: 0,
        performance: {
          avgLatency: 0,
          successRate: 1.0,
          nfcTransactionsProcessed: 0,
          dataRelayed: 0
        },
        hardware: {
          nfcReaderModel: nodeConfig.hardware?.nfcReaderModel || 'Generic NFC Reader',
          cpuCores: nodeConfig.hardware?.cpuCores || 4,
          memory: nodeConfig.hardware?.memory || 8,
          storage: nodeConfig.hardware?.storage || 256,
          bandwidth: nodeConfig.hardware?.bandwidth || 100
        },
        networkConfig: {
          ipAddress: this.generateMockIP(),
          port: nodeConfig.networkConfig?.port || 8080,
          publicKey: this.generateNodePublicKey(),
          endpoints: {
            nfc: `/nfc/${nodeId}`,
            relay: `/relay/${nodeId}`,
            health: `/health/${nodeId}`
          }
        }
      };

      // Execute staking transaction (simulated)
      const stakingResult = await this.executeStaking(relayNode);
      
      if (stakingResult.success) {
        relayNode.status = NODE_STATUS.ACTIVE;
        relayNode.stakingTxHash = stakingResult.txHash;
        
        // Add to network
        this.relayNodes.set(nodeId, relayNode);
        
        // Update city hub
        cityHub.activeNodes++;
        cityHub.totalStaked += nodeConfig.stakeAmount;
        cityHub.lastUpdated = new Date().toISOString();
        
        // Update network metrics
        this.updateNetworkMetrics();
        
        logger.info('DePINRelayNetwork', 'registerRelayNode', `Node registered successfully: ${nodeId}`);
        
        return {
          nodeId,
          status: 'SUCCESS',
          stakingTxHash: stakingResult.txHash,
          cityHub: cityHub.name,
          endpoints: relayNode.networkConfig.endpoints,
          estimatedRewards: this.calculateEstimatedRewards(nodeConfig.stakeAmount)
        };
      } else {
        throw new Error('Staking transaction failed');
      }

    } catch (error) {
      logger.error('DePINRelayNetwork', 'registerRelayNode', error.message);
      throw {
        errorCode: 500,
        error: error.message,
        nodeConfig
      };
    }
  }

  async deregisterRelayNode(nodeId, operatorId) {
    try {
      const node = this.relayNodes.get(nodeId);
      if (!node) {
        throw new Error('Relay node not found');
      }

      if (node.operatorId !== operatorId) {
        throw new Error('Unauthorized: Not the node operator');
      }

      logger.info('DePINRelayNetwork', 'deregisterRelayNode', `Deregistering node: ${nodeId}`);

      node.status = NODE_STATUS.DEREGISTERING;

      // Calculate final rewards
      const finalRewards = await this.calculateFinalRewards(node);

      // Execute unstaking and reward distribution
      const unstakingResult = await this.executeUnstaking(node, finalRewards);

      if (unstakingResult.success) {
        // Update city hub
        const cityHub = this.cityHubs.get(node.cityId);
        if (cityHub) {
          cityHub.activeNodes--;
          cityHub.totalStaked -= node.stakeAmount;
          cityHub.lastUpdated = new Date().toISOString();
        }

        // Remove from network
        this.relayNodes.delete(nodeId);
        
        // Update network metrics
        this.updateNetworkMetrics();

        return {
          nodeId,
          status: 'SUCCESS',
          unstakingTxHash: unstakingResult.txHash,
          finalRewards: finalRewards.totalRewards,
          stakeReturned: unstakingResult.stakeReturned
        };
      } else {
        throw new Error('Unstaking transaction failed');
      }

    } catch (error) {
      logger.error('DePINRelayNetwork', 'deregisterRelayNode', error.message);
      throw {
        errorCode: 500,
        error: error.message,
        nodeId
      };
    }
  }

  async processNFCRelay(nfcData, sourceNodeId, targetCityId) {
    try {
      const sourceNode = this.relayNodes.get(sourceNodeId);
      if (!sourceNode || sourceNode.status !== NODE_STATUS.ACTIVE) {
        throw new Error('Source relay node not available');
      }

      // Find optimal relay path
      const relayPath = await this.findOptimalRelayPath(sourceNode.cityId, targetCityId);
      
      // Process through relay network
      const relayResult = {
        relayId: crypto.randomUUID(),
        sourceNodeId,
        targetCityId,
        relayPath,
        nfcDataHash: crypto.createHash('sha256').update(JSON.stringify(nfcData)).digest('hex'),
        startTime: Date.now(),
        hops: relayPath.length,
        estimatedLatency: this.calculateRelayLatency(relayPath)
      };

      // Simulate relay processing
      for (const hop of relayPath) {
        const hopNode = this.getRandomNodeInCity(hop.cityId);
        if (hopNode) {
          hopNode.performance.nfcTransactionsProcessed++;
          hopNode.performance.dataRelayed += JSON.stringify(nfcData).length;
          hopNode.lastHeartbeat = new Date().toISOString();
        }
      }

      relayResult.endTime = Date.now();
      relayResult.actualLatency = relayResult.endTime - relayResult.startTime;
      relayResult.success = true;

      // Update source node performance
      sourceNode.performance.nfcTransactionsProcessed++;
      sourceNode.performance.dataRelayed += JSON.stringify(nfcData).length;

      logger.info('DePINRelayNetwork', 'processNFCRelay', 
        `NFC data relayed: ${relayResult.relayId} in ${relayResult.actualLatency}ms`);

      return relayResult;

    } catch (error) {
      logger.error('DePINRelayNetwork', 'processNFCRelay', error.message);
      throw {
        errorCode: 500,
        error: error.message,
        sourceNodeId,
        targetCityId
      };
    }
  }

  async findOptimalRelayPath(sourceCityId, targetCityId) {
    if (sourceCityId === targetCityId) {
      return [{ cityId: sourceCityId, distance: 0 }];
    }

    const sourceHub = this.cityHubs.get(sourceCityId);
    const targetHub = this.cityHubs.get(targetCityId);

    if (!sourceHub || !targetHub) {
      throw new Error('Invalid city hubs');
    }

    // Simple pathfinding - direct connection or through regional hub
    const distance = this.calculateDistance(sourceHub, targetHub);
    
    if (distance < 5000) { // Direct connection for nearby cities (<5000km)
      return [
        { cityId: sourceCityId, distance: 0 },
        { cityId: targetCityId, distance }
      ];
    } else {
      // Route through regional hub
      const regionalHub = this.findRegionalHub(sourceHub.region, targetHub.region);
      return [
        { cityId: sourceCityId, distance: 0 },
        { cityId: regionalHub, distance: this.calculateDistance(sourceHub, this.cityHubs.get(regionalHub)) },
        { cityId: targetCityId, distance: this.calculateDistance(this.cityHubs.get(regionalHub), targetHub) }
      ];
    }
  }

  calculateRelayLatency(relayPath) {
    // Base latency + hop latency + distance latency
    const baseLatency = 50; // 50ms base
    const hopLatency = relayPath.length * 25; // 25ms per hop
    const distanceLatency = relayPath.reduce((total, hop) => total + (hop.distance / 1000), 0); // 1ms per 1000km
    
    return baseLatency + hopLatency + distanceLatency;
  }

  startNetworkMonitoring() {
    // Heartbeat monitoring
    setInterval(() => {
      this.processHeartbeats();
    }, DEPIN_CONFIG.HEARTBEAT_INTERVAL);

    // Reward distribution
    setInterval(() => {
      this.distributeRewards();
    }, 3600000); // Every hour

    // Network metrics update
    setInterval(() => {
      this.updateNetworkMetrics();
    }, 60000); // Every minute

    // Performance monitoring
    setInterval(() => {
      this.monitorNodePerformance();
    }, 300000); // Every 5 minutes
  }

  processHeartbeats() {
    const now = Date.now();
    
    for (const [nodeId, node] of this.relayNodes.entries()) {
      const lastHeartbeat = new Date(node.lastHeartbeat).getTime();
      const timeSinceHeartbeat = now - lastHeartbeat;

      if (timeSinceHeartbeat > DEPIN_CONFIG.OFFLINE_THRESHOLD && node.status === NODE_STATUS.ACTIVE) {
        node.status = NODE_STATUS.OFFLINE;
        logger.warn('DePINRelayNetwork', 'processHeartbeats', `Node ${nodeId} went offline`);
      }

      // Update uptime
      const totalTime = now - new Date(node.registeredAt).getTime();
      const offlineTime = Math.max(0, timeSinceHeartbeat - DEPIN_CONFIG.OFFLINE_THRESHOLD);
      node.uptime = Math.max(0, (totalTime - offlineTime) / totalTime);
    }
  }

  async distributeRewards() {
    try {
      logger.info('DePINRelayNetwork', 'distributeRewards', 'Starting hourly reward distribution');

      const rewardDistribution = [];

      for (const [nodeId, node] of this.relayNodes.entries()) {
        if (node.status === NODE_STATUS.ACTIVE && node.uptime >= DEPIN_CONFIG.UPTIME_THRESHOLD) {
          const hourlyReward = this.calculateHourlyReward(node);
          
          if (hourlyReward > 0) {
            // Execute reward transaction (simulated)
            const rewardTx = await this.executeRewardTransaction(node, hourlyReward);
            
            if (rewardTx.success) {
              node.totalRewards += hourlyReward;
              rewardDistribution.push({
                nodeId,
                operatorId: node.operatorId,
                reward: hourlyReward,
                txHash: rewardTx.txHash
              });
            }
          }
        }
      }

      // Update network metrics
      const totalRewardsThisHour = rewardDistribution.reduce((sum, r) => sum + r.reward, 0);
      this.networkMetrics.totalRewardsDistributed += totalRewardsThisHour;

      logger.info('DePINRelayNetwork', 'distributeRewards', 
        `Distributed ${totalRewardsThisHour} HBAR to ${rewardDistribution.length} nodes`);

      return rewardDistribution;

    } catch (error) {
      logger.error('DePINRelayNetwork', 'distributeRewards', error.message);
    }
  }

  calculateHourlyReward(node) {
    let baseReward = DEPIN_CONFIG.REWARD_RATE_PER_HOUR;
    
    // Performance multiplier
    const performanceMultiplier = (node.performance.successRate + node.uptime) / 2;
    
    // Stake multiplier (higher stake = higher rewards)
    const stakeMultiplier = Math.min(node.stakeAmount / DEPIN_CONFIG.MIN_STAKE_AMOUNT, 3); // Max 3x multiplier
    
    // Network load multiplier
    const cityHub = this.cityHubs.get(node.cityId);
    const loadMultiplier = Math.max(0.5, Math.min(2, cityHub.load)); // 0.5x to 2x based on load
    
    const totalReward = baseReward * performanceMultiplier * stakeMultiplier * loadMultiplier;
    
    // Apply network fee
    return totalReward * (1 - DEPIN_CONFIG.NETWORK_FEE_PERCENTAGE);
  }

  monitorNodePerformance() {
    for (const [nodeId, node] of this.relayNodes.entries()) {
      // Check if node should be slashed for poor performance
      if (node.uptime < 0.8 || node.performance.successRate < 0.9) {
        this.slashNode(nodeId, 'Poor performance');
      }

      // Update performance metrics
      node.performance.avgLatency = Math.random() * 100 + 50; // Mock latency 50-150ms
      node.performance.successRate = Math.max(0.85, Math.random()); // Mock success rate 85-100%
    }
  }

  async slashNode(nodeId, reason) {
    try {
      const node = this.relayNodes.get(nodeId);
      if (!node || node.status === NODE_STATUS.SLASHED) return;

      const slashAmount = node.stakeAmount * DEPIN_CONFIG.SLASH_PERCENTAGE;
      
      logger.warn('DePINRelayNetwork', 'slashNode', `Slashing node ${nodeId}: ${reason} (${slashAmount} HBAR)`);

      node.status = NODE_STATUS.SLASHED;
      node.stakeAmount -= slashAmount;
      node.slashHistory = node.slashHistory || [];
      node.slashHistory.push({
        reason,
        amount: slashAmount,
        timestamp: new Date().toISOString()
      });

      // Execute slashing transaction (simulated)
      await this.executeSlashingTransaction(node, slashAmount);

    } catch (error) {
      logger.error('DePINRelayNetwork', 'slashNode', error.message);
    }
  }

  updateNetworkMetrics() {
    const activeNodes = Array.from(this.relayNodes.values()).filter(n => n.status === NODE_STATUS.ACTIVE);
    
    this.networkMetrics = {
      totalNodes: this.relayNodes.size,
      activeNodes: activeNodes.length,
      totalStaked: Array.from(this.relayNodes.values()).reduce((sum, n) => sum + n.stakeAmount, 0),
      totalRewardsDistributed: this.networkMetrics.totalRewardsDistributed,
      networkUptime: activeNodes.length > 0 ? 
        activeNodes.reduce((sum, n) => sum + n.uptime, 0) / activeNodes.length : 0,
      avgLatency: activeNodes.length > 0 ?
        activeNodes.reduce((sum, n) => sum + n.performance.avgLatency, 0) / activeNodes.length : 0
    };
  }

  // Helper methods
  calculateDistance(hub1, hub2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(hub2.lat - hub1.lat);
    const dLng = this.toRad(hub2.lng - hub1.lng);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(hub1.lat)) * Math.cos(this.toRad(hub2.lat)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI/180);
  }

  findRegionalHub(sourceRegion, targetRegion) {
    // Regional hub mapping for optimal routing
    const regionalHubs = {
      'NA': 'NYC',
      'EU': 'LON', 
      'APAC': 'SIN',
      'ME': 'DXB',
      'SA': 'SAO',
      'AF': 'JNB'
    };
    
    return regionalHubs[targetRegion] || regionalHubs[sourceRegion] || 'LON';
  }

  getRandomNodeInCity(cityId) {
    const cityNodes = Array.from(this.relayNodes.values())
      .filter(n => n.cityId === cityId && n.status === NODE_STATUS.ACTIVE);
    
    return cityNodes.length > 0 ? cityNodes[Math.floor(Math.random() * cityNodes.length)] : null;
  }

  generateMockIP() {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  generateNodePublicKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  calculateEstimatedRewards(stakeAmount) {
    const dailyReward = DEPIN_CONFIG.REWARD_RATE_PER_HOUR * 24;
    const stakeMultiplier = Math.min(stakeAmount / DEPIN_CONFIG.MIN_STAKE_AMOUNT, 3);
    return dailyReward * stakeMultiplier * (1 - DEPIN_CONFIG.NETWORK_FEE_PERCENTAGE);
  }

  // Simulated blockchain transactions
  async executeStaking(node) {
    // Simulate staking transaction
    return {
      success: true,
      txHash: `stake-${crypto.randomUUID()}`,
      amount: node.stakeAmount,
      timestamp: new Date().toISOString()
    };
  }

  async executeUnstaking(node, rewards) {
    // Simulate unstaking transaction
    return {
      success: true,
      txHash: `unstake-${crypto.randomUUID()}`,
      stakeReturned: node.stakeAmount,
      rewardsDistributed: rewards.totalRewards,
      timestamp: new Date().toISOString()
    };
  }

  async executeRewardTransaction(node, amount) {
    // Simulate reward distribution transaction
    return {
      success: true,
      txHash: `reward-${crypto.randomUUID()}`,
      amount,
      recipient: node.operatorId,
      timestamp: new Date().toISOString()
    };
  }

  async executeSlashingTransaction(node, amount) {
    // Simulate slashing transaction
    return {
      success: true,
      txHash: `slash-${crypto.randomUUID()}`,
      amount,
      nodeId: node.nodeId,
      timestamp: new Date().toISOString()
    };
  }

  calculateFinalRewards(node) {
    const hoursActive = (Date.now() - new Date(node.registeredAt).getTime()) / (1000 * 60 * 60);
    const totalEarned = hoursActive * this.calculateHourlyReward(node);
    
    return {
      hoursActive,
      totalRewards: totalEarned,
      averageHourlyReward: totalEarned / hoursActive
    };
  }

  // Public API methods
  getNetworkStatus() {
    return {
      ...this.networkMetrics,
      cityHubs: Array.from(this.cityHubs.values()),
      totalCities: this.cityHubs.size,
      lastUpdated: new Date().toISOString()
    };
  }

  getNodeDetails(nodeId) {
    return this.relayNodes.get(nodeId) || null;
  }

  getNodesByOperator(operatorId) {
    return Array.from(this.relayNodes.values())
      .filter(node => node.operatorId === operatorId);
  }

  getCityHubDetails(cityId) {
    const hub = this.cityHubs.get(cityId);
    if (!hub) return null;

    const cityNodes = Array.from(this.relayNodes.values())
      .filter(node => node.cityId === cityId);

    return {
      ...hub,
      nodes: cityNodes,
      nodeCount: cityNodes.length,
      avgUptime: cityNodes.length > 0 ? 
        cityNodes.reduce((sum, n) => sum + n.uptime, 0) / cityNodes.length : 0
    };
  }

  simulateNetworkLoad(loadLevel = 'medium') {
    const loadMultipliers = {
      low: 0.3,
      medium: 0.7,
      high: 1.2,
      extreme: 2.0
    };

    const multiplier = loadMultipliers[loadLevel] || 0.7;

    // Update city hub loads
    for (const [cityId, hub] of this.cityHubs.entries()) {
      hub.load = Math.random() * multiplier;
      hub.avgLatency = 50 + (hub.load * 100); // Base 50ms + load-based latency
    }

    // Simulate heartbeats for active nodes
    for (const [nodeId, node] of this.relayNodes.entries()) {
      if (node.status === NODE_STATUS.ACTIVE) {
        node.lastHeartbeat = new Date().toISOString();
        node.performance.avgLatency = 50 + (Math.random() * 100 * multiplier);
      }
    }

    logger.info('DePINRelayNetwork', 'simulateNetworkLoad', `Network load simulated at ${loadLevel} level`);
  }
}

// Create singleton instance
const dePINRelayNetwork = new DePINRelayNetwork();

// Export functions
const registerRelayNode = async (nodeConfig) => {
  return await dePINRelayNetwork.registerRelayNode(nodeConfig);
};

const deregisterRelayNode = async (nodeId, operatorId) => {
  return await dePINRelayNetwork.deregisterRelayNode(nodeId, operatorId);
};

const processNFCRelay = async (nfcData, sourceNodeId, targetCityId) => {
  return await dePINRelayNetwork.processNFCRelay(nfcData, sourceNodeId, targetCityId);
};

const getNetworkStatus = () => {
  return dePINRelayNetwork.getNetworkStatus();
};

const getNodeDetails = (nodeId) => {
  return dePINRelayNetwork.getNodeDetails(nodeId);
};

const getNodesByOperator = (operatorId) => {
  return dePINRelayNetwork.getNodesByOperator(operatorId);
};

const getCityHubDetails = (cityId) => {
  return dePINRelayNetwork.getCityHubDetails(cityId);
};

const simulateNetworkLoad = (loadLevel) => {
  return dePINRelayNetwork.simulateNetworkLoad(loadLevel);
};

export {
  DEPIN_CONFIG,
  NODE_STATUS,
  CITY_HUBS,
  DePINRelayNetwork,
  registerRelayNode,
  deregisterRelayNode,
  processNFCRelay,
  getNetworkStatus,
  getNodeDetails,
  getNodesByOperator,
  getCityHubDetails,
  simulateNetworkLoad
};
