import * as DePINService from '../services/depin-relay-network';
import * as TokenService from '../services/token';
import * as NFCPipelineService from '../services/nfc-ai-pipeline';

// DePIN Network Management Controllers
const registerRelayNode = async (req, res) => {
  try {
    const nodeConfig = req.body;
    const result = await DePINService.registerRelayNode(nodeConfig);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const deregisterRelayNode = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { operatorId } = req.body;
    const result = await DePINService.deregisterRelayNode(nodeId, operatorId);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const getNetworkStatus = async (req, res) => {
  try {
    const result = await DePINService.getNetworkStatus();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

const getNodeDetails = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const result = await DePINService.getNodeDetails(nodeId);
    
    if (!result) {
      return res.status(404).send({ error: 'Node not found' });
    }
    
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

const getNodesByOperator = async (req, res) => {
  try {
    const { operatorId } = req.params;
    const result = await DePINService.getNodesByOperator(operatorId);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

const getCityHubDetails = async (req, res) => {
  try {
    const { cityId } = req.params;
    const result = await DePINService.getCityHubDetails(cityId);
    
    if (!result) {
      return res.status(404).send({ error: 'City hub not found' });
    }
    
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

const simulateNetworkLoad = async (req, res) => {
  try {
    const { loadLevel } = req.body;
    await DePINService.simulateNetworkLoad(loadLevel);
    
    res.send({
      success: true,
      message: `Network load simulated at ${loadLevel} level`,
      loadLevel,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Integrated NFC-DePIN Flow
const processNFCThroughDePIN = async (req, res) => {
  try {
    const { nfcData, userContext, targetCityId } = req.body;
    
    // Step 1: Find nearest relay node
    const nearestNode = await findNearestRelayNode(userContext.location);
    if (!nearestNode) {
      throw new Error('No relay nodes available in your area');
    }

    // Step 2: Process through DePIN relay network
    const relayResult = await DePINService.processNFCRelay(
      nfcData, 
      nearestNode.nodeId, 
      targetCityId || nearestNode.cityId
    );

    // Step 3: Process through AI pipeline
    const aiResult = await NFCPipelineService.processNFCScan(nfcData, {
      ...userContext,
      relayNodeId: nearestNode.nodeId,
      relayPath: relayResult.relayPath
    });

    // Step 4: If approved, process HTS token transaction
    let tokenResult = null;
    if (aiResult.decision === 'AUTO_APPROVE' && nfcData.transactionData?.type === 'mint') {
      tokenResult = await TokenService.processNFCTokenMint({
        ...nfcData.transactionData,
        relayVerified: true,
        relayNodeId: nearestNode.nodeId
      });
    }

    const response = {
      pipelineId: aiResult.pipelineId,
      relayId: relayResult.relayId,
      decision: aiResult.decision,
      relayLatency: relayResult.actualLatency,
      aiLatency: aiResult.processingTime,
      totalLatency: relayResult.actualLatency + aiResult.processingTime,
      relayPath: relayResult.relayPath,
      relayNodeId: nearestNode.nodeId,
      tokenResult,
      success: true,
      timestamp: new Date().toISOString()
    };

    res.send(response);
  } catch (error) {
    res.status(error.errorCode || 500).send({
      error: error.message,
      success: false,
      timestamp: new Date().toISOString()
    });
  }
};

// Staking and Rewards Controllers
const stakeForNode = async (req, res) => {
  try {
    const { operatorId, stakeAmount, nodeConfig } = req.body;
    
    // Validate minimum stake
    if (stakeAmount < DePINService.DEPIN_CONFIG.MIN_STAKE_AMOUNT) {
      throw new Error(`Minimum stake required: ${DePINService.DEPIN_CONFIG.MIN_STAKE_AMOUNT} HBAR`);
    }

    // Create staking transaction
    const stakingResult = await executeStakingTransaction(operatorId, stakeAmount);
    
    if (stakingResult.success) {
      // Register relay node
      const nodeResult = await DePINService.registerRelayNode({
        ...nodeConfig,
        operatorId,
        stakeAmount,
        stakingTxHash: stakingResult.txHash
      });

      res.send({
        ...nodeResult,
        stakingTxHash: stakingResult.txHash,
        stakeAmount,
        message: 'Node registered and stake locked successfully'
      });
    } else {
      throw new Error('Staking transaction failed');
    }
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const claimRewards = async (req, res) => {
  try {
    const { nodeId, operatorId } = req.body;
    
    const node = await DePINService.getNodeDetails(nodeId);
    if (!node) {
      throw new Error('Node not found');
    }

    if (node.operatorId !== operatorId) {
      throw new Error('Unauthorized: Not the node operator');
    }

    // Calculate pending rewards
    const pendingRewards = calculatePendingRewards(node);
    
    if (pendingRewards <= 0) {
      return res.send({
        message: 'No rewards available to claim',
        pendingRewards: 0,
        nodeId
      });
    }

    // Execute reward claim transaction
    const claimResult = await executeRewardClaimTransaction(operatorId, pendingRewards);
    
    if (claimResult.success) {
      // Update node rewards
      node.totalRewards += pendingRewards;
      node.lastRewardClaim = new Date().toISOString();

      res.send({
        nodeId,
        rewardsClaimed: pendingRewards,
        totalRewards: node.totalRewards,
        txHash: claimResult.txHash,
        message: 'Rewards claimed successfully'
      });
    } else {
      throw new Error('Reward claim transaction failed');
    }
  } catch (error) {
    res.status(error.errorCode || 500).send({
      error: error.message,
      nodeId: req.body.nodeId
    });
  }
};

const getRewardsSummary = async (req, res) => {
  try {
    const { operatorId } = req.params;
    
    const nodes = await DePINService.getNodesByOperator(operatorId);
    
    const summary = {
      operatorId,
      totalNodes: nodes.length,
      activeNodes: nodes.filter(n => n.status === 'ACTIVE').length,
      totalStaked: nodes.reduce((sum, n) => sum + n.stakeAmount, 0),
      totalRewards: nodes.reduce((sum, n) => sum + n.totalRewards, 0),
      pendingRewards: nodes.reduce((sum, n) => sum + calculatePendingRewards(n), 0),
      avgUptime: nodes.length > 0 ? 
        nodes.reduce((sum, n) => sum + n.uptime, 0) / nodes.length : 0,
      estimatedDailyRewards: nodes.reduce((sum, n) => 
        sum + (DePINService.DEPIN_CONFIG.REWARD_RATE_PER_HOUR * 24 * n.uptime), 0
      ),
      nodes: nodes.map(node => ({
        nodeId: node.nodeId,
        cityId: node.cityId,
        status: node.status,
        stakeAmount: node.stakeAmount,
        totalRewards: node.totalRewards,
        pendingRewards: calculatePendingRewards(node),
        uptime: node.uptime,
        performance: node.performance
      }))
    };

    res.send(summary);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// Network Analytics and Monitoring
const getNetworkAnalytics = async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    const networkStatus = await DePINService.getNetworkStatus();
    
    // Generate analytics data (in production, this would come from time-series database)
    const analytics = {
      timeRange,
      networkMetrics: networkStatus,
      performance: {
        avgLatency: networkStatus.avgLatency,
        throughput: calculateNetworkThroughput(networkStatus),
        reliability: networkStatus.networkUptime,
        efficiency: calculateNetworkEfficiency(networkStatus)
      },
      economics: {
        totalValueLocked: networkStatus.totalStaked,
        rewardsDistributed: networkStatus.totalRewardsDistributed,
        apr: calculateNetworkAPR(networkStatus),
        tokenomics: {
          stakingRatio: networkStatus.totalStaked / 10000000, // Assume 10M total supply
          rewardPool: networkStatus.totalRewardsDistributed * 0.1, // 10% reserve
          burnRate: 0.02 // 2% annual burn
        }
      },
      geographic: {
        regionDistribution: calculateRegionDistribution(networkStatus.cityHubs),
        latencyMap: generateLatencyMap(networkStatus.cityHubs),
        coverageScore: calculateCoverageScore(networkStatus.cityHubs)
      },
      trends: generateTrendData(timeRange),
      generatedAt: new Date().toISOString()
    };

    res.send(analytics);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

const getDePINDashboard = async (req, res) => {
  try {
    const { operatorId } = req.query;
    
    // Get network status
    const networkStatus = await DePINService.getNetworkStatus();
    
    // Get operator-specific data if provided
    let operatorData = null;
    if (operatorId) {
      const nodes = await DePINService.getNodesByOperator(operatorId);
      operatorData = {
        nodes,
        totalStaked: nodes.reduce((sum, n) => sum + n.stakeAmount, 0),
        totalRewards: nodes.reduce((sum, n) => sum + n.totalRewards, 0),
        avgUptime: nodes.length > 0 ? 
          nodes.reduce((sum, n) => sum + n.uptime, 0) / nodes.length : 0
      };
    }

    const dashboard = {
      network: networkStatus,
      operator: operatorData,
      alerts: generateNetworkAlerts(networkStatus),
      recommendations: generateRecommendations(networkStatus, operatorData),
      marketData: {
        hbarPrice: 0.0523, // Mock price
        stakingAPR: calculateNetworkAPR(networkStatus),
        networkGrowth: 0.15, // 15% monthly growth
        demandScore: 0.78
      },
      recentActivity: generateRecentActivity(),
      generatedAt: new Date().toISOString()
    };

    res.send(dashboard);
  } catch (error) {
    res.status(500).send({
      error: error.message,
      dashboard: {
        network: { totalNodes: 0, activeNodes: 0 },
        generatedAt: new Date().toISOString()
      }
    });
  }
};

// Helper functions
const findNearestRelayNode = async (userLocation) => {
  if (!userLocation) return null;
  
  const networkStatus = await DePINService.getNetworkStatus();
  let nearestNode = null;
  let minDistance = Infinity;

  for (const city of networkStatus.cityHubs) {
    if (city.activeNodes > 0) {
      const distance = calculateDistance(userLocation, city);
      if (distance < minDistance) {
        minDistance = distance;
        nearestNode = {
          nodeId: `${city.id}-relay-1`, // Simplified node selection
          cityId: city.id,
          distance
        };
      }
    }
  }

  return nearestNode;
};

const calculateDistance = (loc1, loc2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLng = toRad(loc2.lng - loc1.lng);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(loc1.lat)) * Math.cos(toRad(loc2.lat)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const toRad = (deg) => deg * (Math.PI/180);

const calculatePendingRewards = (node) => {
  const hoursActive = (Date.now() - new Date(node.lastRewardClaim || node.registeredAt).getTime()) / (1000 * 60 * 60);
  const hourlyReward = DePINService.DEPIN_CONFIG.REWARD_RATE_PER_HOUR * node.uptime;
  return hoursActive * hourlyReward;
};

const executeStakingTransaction = async (operatorId, amount) => {
  // Simulate staking transaction
  return {
    success: true,
    txHash: `stake-${crypto.randomUUID()}`,
    amount,
    operatorId,
    timestamp: new Date().toISOString()
  };
};

const executeRewardClaimTransaction = async (operatorId, amount) => {
  // Simulate reward claim transaction
  return {
    success: true,
    txHash: `claim-${crypto.randomUUID()}`,
    amount,
    operatorId,
    timestamp: new Date().toISOString()
  };
};

const calculateNetworkThroughput = (networkStatus) => {
  // Simplified throughput calculation
  return networkStatus.activeNodes * 100; // 100 tx/hour per node
};

const calculateNetworkEfficiency = (networkStatus) => {
  // Network efficiency based on uptime and latency
  const latencyScore = Math.max(0, 1 - (networkStatus.avgLatency / 1000));
  return (networkStatus.networkUptime + latencyScore) / 2;
};

const calculateNetworkAPR = (networkStatus) => {
  if (networkStatus.totalStaked === 0) return 0;
  const dailyRewards = networkStatus.activeNodes * DePINService.DEPIN_CONFIG.REWARD_RATE_PER_HOUR * 24;
  const annualRewards = dailyRewards * 365;
  return (annualRewards / networkStatus.totalStaked) * 100;
};

const calculateRegionDistribution = (cityHubs) => {
  const regions = {};
  cityHubs.forEach(city => {
    regions[city.region] = (regions[city.region] || 0) + city.activeNodes;
  });
  return regions;
};

const generateLatencyMap = (cityHubs) => {
  return cityHubs.map(city => ({
    cityId: city.id,
    name: city.name,
    lat: city.lat,
    lng: city.lng,
    avgLatency: city.avgLatency || 100 + Math.random() * 50
  }));
};

const calculateCoverageScore = (cityHubs) => {
  // Simplified coverage calculation based on active nodes and geographic distribution
  const totalNodes = cityHubs.reduce((sum, city) => sum + city.activeNodes, 0);
  const activeHubs = cityHubs.filter(city => city.activeNodes > 0).length;
  return Math.min(1, (activeHubs / cityHubs.length) * (totalNodes / 500));
};

const generateTrendData = (timeRange) => {
  // Mock trend data - in production, query from time-series database
  const points = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
  return Array.from({ length: points }, (_, i) => ({
    timestamp: new Date(Date.now() - (points - i) * 3600000).toISOString(),
    nodes: 300 + Math.floor(Math.random() * 50),
    latency: 100 + Math.random() * 50,
    uptime: 0.95 + Math.random() * 0.05
  }));
};

const generateNetworkAlerts = (networkStatus) => {
  const alerts = [];
  
  if (networkStatus.avgLatency > 200) {
    alerts.push({
      type: 'WARNING',
      message: 'Network latency above optimal threshold',
      severity: 'MEDIUM'
    });
  }
  
  if (networkStatus.networkUptime < 0.95) {
    alerts.push({
      type: 'ALERT',
      message: 'Network uptime below 95%',
      severity: 'HIGH'
    });
  }
  
  return alerts;
};

const generateRecommendations = (networkStatus, operatorData) => {
  const recommendations = [];
  
  if (operatorData && operatorData.avgUptime < 0.9) {
    recommendations.push({
      type: 'PERFORMANCE',
      message: 'Consider upgrading hardware to improve node uptime',
      priority: 'HIGH'
    });
  }
  
  if (networkStatus.activeNodes < 200) {
    recommendations.push({
      type: 'EXPANSION',
      message: 'Network could benefit from more relay nodes',
      priority: 'MEDIUM'
    });
  }
  
  return recommendations;
};

const generateRecentActivity = () => {
  return [
    {
      type: 'NODE_REGISTERED',
      message: 'New relay node registered in Tokyo',
      timestamp: new Date(Date.now() - 300000).toISOString()
    },
    {
      type: 'REWARDS_DISTRIBUTED',
      message: '1,250 HBAR distributed to node operators',
      timestamp: new Date(Date.now() - 600000).toISOString()
    },
    {
      type: 'NETWORK_UPGRADE',
      message: 'Latency optimization deployed',
      timestamp: new Date(Date.now() - 1800000).toISOString()
    }
  ];
};

export {
  // Node Management
  registerRelayNode,
  deregisterRelayNode,
  getNetworkStatus,
  getNodeDetails,
  getNodesByOperator,
  getCityHubDetails,
  simulateNetworkLoad,
  
  // Integrated Flow
  processNFCThroughDePIN,
  
  // Staking & Rewards
  stakeForNode,
  claimRewards,
  getRewardsSummary,
  
  // Analytics & Dashboard
  getNetworkAnalytics,
  getDePINDashboard
};
