const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

class ContractService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.deploymentInfo = null;
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize provider based on network
      const network = process.env.HEDERA_NETWORK || 'testnet';
      const rpcUrl = network === 'mainnet' 
        ? 'https://mainnet.hashio.io/api'
        : 'https://testnet.hashio.io/api';
      
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      
      // Initialize signer if private key is available
      if (process.env.HEDERA_PRIVATE_KEY) {
        this.signer = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, this.provider);
        console.log('✅ Contract service initialized with signer:', this.signer.address);
      } else {
        console.log('⚠️ Contract service initialized without signer (read-only mode)');
      }
      
      // Load deployment info
      await this.loadDeploymentInfo();
      
      // Initialize contract instances
      await this.initializeContracts();
      
    } catch (error) {
      console.error('❌ Contract service initialization failed:', error.message);
    }
  }

  async loadDeploymentInfo() {
    try {
      const network = process.env.HEDERA_NETWORK || 'testnet';
      const deploymentPath = path.join(__dirname, '../../deployments', `${network}.json`);
      
      if (fs.existsSync(deploymentPath)) {
        this.deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        console.log('✅ Loaded deployment info for network:', network);
      } else {
        console.log('⚠️ No deployment info found for network:', network);
        // Use mock addresses for development
        this.deploymentInfo = {
          contracts: {
            AssetRegistry: '0x0000000000000000000000000000000000000001',
            MockHBAR: '0x0000000000000000000000000000000000000002',
            MockRWA: '0x0000000000000000000000000000000000000003',
            LiquidityPool: '0x0000000000000000000000000000000000000004',
            DePINGovernance: '0x0000000000000000000000000000000000000005'
          }
        };
      }
    } catch (error) {
      console.error('❌ Failed to load deployment info:', error.message);
    }
  }

  async initializeContracts() {
    try {
      // Load contract ABIs
      const assetRegistryABI = this.loadABI('AssetRegistry');
      const liquidityPoolABI = this.loadABI('LiquidityPool');
      const depinGovernanceABI = this.loadABI('DePINGovernance');
      const erc20ABI = this.loadABI('MockERC20');

      // Initialize contract instances
      if (this.deploymentInfo?.contracts) {
        this.contracts.assetRegistry = new ethers.Contract(
          this.deploymentInfo.contracts.AssetRegistry,
          assetRegistryABI,
          this.signer || this.provider
        );

        this.contracts.liquidityPool = new ethers.Contract(
          this.deploymentInfo.contracts.LiquidityPool,
          liquidityPoolABI,
          this.signer || this.provider
        );

        this.contracts.depinGovernance = new ethers.Contract(
          this.deploymentInfo.contracts.DePINGovernance,
          depinGovernanceABI,
          this.signer || this.provider
        );

        this.contracts.hbarToken = new ethers.Contract(
          this.deploymentInfo.contracts.MockHBAR,
          erc20ABI,
          this.signer || this.provider
        );

        this.contracts.rwaToken = new ethers.Contract(
          this.deploymentInfo.contracts.MockRWA,
          erc20ABI,
          this.signer || this.provider
        );

        console.log('✅ Contract instances initialized');
      }
    } catch (error) {
      console.error('❌ Failed to initialize contracts:', error.message);
    }
  }

  loadABI(contractName) {
    try {
      const artifactPath = path.join(__dirname, '../../artifacts/contracts', `${contractName}.sol`, `${contractName}.json`);
      if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        return artifact.abi;
      }
    } catch (error) {
      console.error(`❌ Failed to load ABI for ${contractName}:`, error.message);
    }
    
    // Return minimal ABI for development
    return this.getMinimalABI(contractName);
  }

  getMinimalABI(contractName) {
    const minimalABIs = {
      AssetRegistry: [
        "function mintAsset(address to, uint8 assetType, string name, string description, uint256 valuation, string location, string nfcTagId, string tokenURI) returns (uint256)",
        "function getAssetByNFC(string nfcTagId) view returns (tuple(uint256 tokenId, uint8 assetType, string name, string description, uint256 valuation, string location, string nfcTagId, address owner, bool verified, uint256 createdAt, uint256 lastUpdated))",
        "function verifyAsset(uint256 tokenId)",
        "function getStats() view returns (uint256, uint256, uint256, uint256, uint256)"
      ],
      LiquidityPool: [
        "function addLiquidity(uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to) returns (uint256, uint256, uint256)",
        "function swap(uint256 amountAOut, uint256 amountBOut, address to)",
        "function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) view returns (uint256)",
        "function getReserves() view returns (uint256, uint256)",
        "function calculatePriceImpact(uint256 amountIn, bool isTokenA) view returns (uint256)"
      ],
      DePINGovernance: [
        "function registerNode(string nodeId, string city, string country, uint256 stakeAmount)",
        "function pingNode(uint256 uptime)",
        "function claimRewards()",
        "function getNetworkStats() view returns (uint256, uint256, uint256, uint256, uint256)",
        "function getNodeInfo(uint256 nodeId) view returns (tuple(address operator, string nodeId, string city, string country, uint256 stakedAmount, uint256 rewardsEarned, uint256 uptime, uint256 lastPing, bool active, uint256 createdAt))"
      ],
      MockERC20: [
        "function balanceOf(address owner) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function transferFrom(address from, address to, uint256 amount) returns (bool)",
        "function mint(address to, uint256 amount)"
      ]
    };

    return minimalABIs[contractName] || [];
  }

  // Asset Registry Methods
  async mintAsset(assetData) {
    try {
      if (!this.contracts.assetRegistry || !this.signer) {
        throw new Error('Asset registry not available or no signer');
      }

      const tx = await this.contracts.assetRegistry.mintAsset(
        assetData.to || this.signer.address,
        assetData.assetType || 0,
        assetData.name,
        assetData.description || '',
        ethers.utils.parseEther(assetData.valuation.toString()),
        assetData.location || '',
        assetData.nfcTagId,
        assetData.tokenURI || ''
      );

      const receipt = await tx.wait();
      
      return {
        success: true,
        tokenId: receipt.events?.find(e => e.event === 'AssetMinted')?.args?.tokenId?.toString(),
        txHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      throw new Error(`Asset minting failed: ${error.message}`);
    }
  }

  async getAssetByNFC(nfcTagId) {
    try {
      if (!this.contracts.assetRegistry) {
        throw new Error('Asset registry not available');
      }

      const asset = await this.contracts.assetRegistry.getAssetByNFC(nfcTagId);
      
      return {
        tokenId: asset.tokenId.toString(),
        assetType: asset.assetType,
        name: asset.name,
        description: asset.description,
        valuation: ethers.utils.formatEther(asset.valuation),
        location: asset.location,
        nfcTagId: asset.nfcTagId,
        owner: asset.owner,
        verified: asset.verified,
        createdAt: new Date(asset.createdAt.toNumber() * 1000).toISOString()
      };
    } catch (error) {
      throw new Error(`Asset lookup failed: ${error.message}`);
    }
  }

  // Liquidity Pool Methods
  async executeSwap(swapData) {
    try {
      if (!this.contracts.liquidityPool || !this.signer) {
        throw new Error('Liquidity pool not available or no signer');
      }

      const { fromToken, toToken, amountIn } = swapData;
      const isTokenA = fromToken === 'RWA';
      
      // Get reserves
      const [reserveA, reserveB] = await this.contracts.liquidityPool.getReserves();
      
      // Calculate output amount
      const reserveIn = isTokenA ? reserveA : reserveB;
      const reserveOut = isTokenA ? reserveB : reserveA;
      const amountOut = await this.contracts.liquidityPool.getAmountOut(
        ethers.utils.parseEther(amountIn.toString()),
        reserveIn,
        reserveOut
      );

      // Execute swap
      const tx = await this.contracts.liquidityPool.swap(
        isTokenA ? 0 : amountOut,
        isTokenA ? amountOut : 0,
        this.signer.address
      );

      const receipt = await tx.wait();

      return {
        success: true,
        amountOut: ethers.utils.formatEther(amountOut),
        txHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      throw new Error(`Swap execution failed: ${error.message}`);
    }
  }

  // DePIN Methods
  async registerDePINNode(nodeData) {
    try {
      if (!this.contracts.depinGovernance || !this.signer) {
        throw new Error('DePIN governance not available or no signer');
      }

      // Approve staking tokens
      const stakeAmount = ethers.utils.parseEther(nodeData.stakeAmount.toString());
      await this.contracts.hbarToken.approve(this.contracts.depinGovernance.address, stakeAmount);

      const tx = await this.contracts.depinGovernance.registerNode(
        nodeData.nodeId,
        nodeData.city,
        nodeData.country,
        stakeAmount
      );

      const receipt = await tx.wait();

      return {
        success: true,
        nodeId: receipt.events?.find(e => e.event === 'NodeRegistered')?.args?.nodeId?.toString(),
        txHash: receipt.transactionHash
      };
    } catch (error) {
      throw new Error(`Node registration failed: ${error.message}`);
    }
  }

  async getDePINNetworkStats() {
    try {
      if (!this.contracts.depinGovernance) {
        throw new Error('DePIN governance not available');
      }

      const [totalNodes, activeNodes, totalStaked, averageUptime, rewardRate] = 
        await this.contracts.depinGovernance.getNetworkStats();

      return {
        totalNodes: totalNodes.toNumber(),
        activeNodes: activeNodes.toNumber(),
        totalStaked: ethers.utils.formatEther(totalStaked),
        averageUptime: averageUptime.toNumber() / 100, // Convert from basis points
        rewardRate: rewardRate.toNumber()
      };
    } catch (error) {
      throw new Error(`Network stats query failed: ${error.message}`);
    }
  }

  // Utility Methods
  async getContractAddresses() {
    return this.deploymentInfo?.contracts || {};
  }

  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      return {
        chainId: network.chainId,
        name: network.name,
        blockNumber,
        connected: true
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  isReady() {
    return !!(this.provider && this.deploymentInfo && this.contracts.assetRegistry);
  }
}

module.exports = new ContractService();
