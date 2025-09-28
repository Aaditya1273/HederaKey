const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting HederaKey NFC Smart Contract Deployment...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  
  // Deploy AssetRegistry
  console.log("\n📋 Deploying AssetRegistry...");
  const AssetRegistry = await ethers.getContractFactory("AssetRegistry");
  const assetRegistry = await AssetRegistry.deploy();
  await assetRegistry.deployed();
  console.log("✅ AssetRegistry deployed to:", assetRegistry.address);
  
  // Deploy mock HBAR token for testing (ERC20)
  console.log("\n💰 Deploying Mock HBAR Token...");
  const MockHBAR = await ethers.getContractFactory("MockERC20");
  const mockHBAR = await MockHBAR.deploy(
    "Wrapped HBAR",
    "WHBAR",
    ethers.utils.parseEther("1000000") // 1M WHBAR
  );
  await mockHBAR.deployed();
  console.log("✅ Mock HBAR deployed to:", mockHBAR.address);
  
  // Deploy mock RWA token
  console.log("\n🌾 Deploying Mock RWA Token...");
  const mockRWA = await MockHBAR.deploy(
    "Farm Share Token",
    "FARM",
    ethers.utils.parseEther("100000") // 100K FARM
  );
  await mockRWA.deployed();
  console.log("✅ Mock RWA Token deployed to:", mockRWA.address);
  
  // Deploy LiquidityPool
  console.log("\n🏊 Deploying Liquidity Pool...");
  const LiquidityPool = await ethers.getContractFactory("LiquidityPool");
  const liquidityPool = await LiquidityPool.deploy(
    mockRWA.address,
    mockHBAR.address,
    "HederaKey LP Token",
    "HKLP"
  );
  await liquidityPool.deployed();
  console.log("✅ Liquidity Pool deployed to:", liquidityPool.address);
  
  // Deploy DePIN Governance
  console.log("\n🏛️ Deploying DePIN Governance...");
  const DePINGovernance = await ethers.getContractFactory("DePINGovernance");
  const depinGovernance = await DePINGovernance.deploy(mockHBAR.address);
  await depinGovernance.deployed();
  console.log("✅ DePIN Governance deployed to:", depinGovernance.address);
  
  // Setup initial data
  console.log("\n⚙️ Setting up initial configuration...");
  
  // Add some initial liquidity
  const liquidityAmount = ethers.utils.parseEther("1000");
  await mockRWA.approve(liquidityPool.address, liquidityAmount);
  await mockHBAR.approve(liquidityPool.address, liquidityAmount);
  
  // Mint some test assets
  console.log("🎨 Minting test assets...");
  await assetRegistry.mintAsset(
    deployer.address,
    0, // FARM_SHARE
    "Organic Farm Share #001",
    "Premium organic farm share in Lagos, Nigeria",
    ethers.utils.parseEther("5000"),
    "Lagos, Nigeria",
    "nfc_farm_001",
    "https://ipfs.io/ipfs/QmTest1"
  );
  
  await assetRegistry.mintAsset(
    deployer.address,
    1, // REAL_ESTATE
    "Downtown Apartment Unit",
    "Modern apartment in Nairobi city center",
    ethers.utils.parseEther("250000"),
    "Nairobi, Kenya",
    "nfc_re_001",
    "https://ipfs.io/ipfs/QmTest2"
  );
  
  // Register test DePIN node
  console.log("🌐 Registering test DePIN node...");
  const stakeAmount = ethers.utils.parseEther("1000");
  await mockHBAR.approve(depinGovernance.address, stakeAmount);
  await depinGovernance.registerNode(
    "node_lagos_001",
    "Lagos",
    "Nigeria",
    stakeAmount
  );
  
  // Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      AssetRegistry: assetRegistry.address,
      MockHBAR: mockHBAR.address,
      MockRWA: mockRWA.address,
      LiquidityPool: liquidityPool.address,
      DePINGovernance: depinGovernance.address
    },
    testData: {
      testAssets: 2,
      testNodes: 1,
      initialLiquidity: liquidityAmount.toString()
    }
  };
  
  const deploymentPath = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(deploymentPath, `${hre.network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("📄 Deployment info saved to:", `deployments/${hre.network.name}.json`);
  
  // Verification instructions
  console.log("\n📋 Contract Verification Commands:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${assetRegistry.address}`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${mockHBAR.address} "Wrapped HBAR" "WHBAR" "1000000000000000000000000"`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${liquidityPool.address} ${mockRWA.address} ${mockHBAR.address} "MindKey LP Token" "MKLP"`);
  console.log(`npx hardhat verify --network ${hre.network.name} ${depinGovernance.address} ${mockHBAR.address}`);
  
  console.log("\n🚀 Ready for integration with backend services!");
}

// Mock ERC20 contract for testing
const MockERC20Source = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }
    
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
`;

// Write MockERC20 contract
fs.writeFileSync(
  path.join(__dirname, "../contracts/MockERC20.sol"),
  MockERC20Source
);

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
