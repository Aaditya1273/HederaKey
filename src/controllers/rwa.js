import * as RWATokenizationService from '../services/rwa-tokenization';
import * as AMMService from '../services/amm-liquidity';
import * as LendingService from '../services/rwa-lending';
import * as OracleService from '../services/oracle-pricing';

// RWA Tokenization Controllers
const tokenizeAsset = async (req, res) => {
  try {
    const { assetData, nfcData, ownerAccountId } = req.body;
    const result = await RWATokenizationService.tokenizeAsset(assetData, nfcData, ownerAccountId);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const processNFCTokenization = async (req, res) => {
  try {
    const { nfcData, userAccountId } = req.body;
    const result = await RWATokenizationService.processNFCTokenization(nfcData, userAccountId);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const getTokenizationDetails = async (req, res) => {
  try {
    const { tokenizationId } = req.params;
    const result = await RWATokenizationService.getTokenizationDetails(tokenizationId);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const listTokenizedAssets = async (req, res) => {
  try {
    const filters = req.query;
    const result = await RWATokenizationService.listTokenizedAssets(filters);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

// AMM Liquidity Controllers
const createLiquidityPool = async (req, res) => {
  try {
    const { tokenA, tokenB, initialPriceRatio, creatorAccountId } = req.body;
    const result = await AMMService.createLiquidityPool(tokenA, tokenB, initialPriceRatio, creatorAccountId);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const addLiquidity = async (req, res) => {
  try {
    const { poolId, amountA, amountB, userAccountId, minLPTokens } = req.body;
    const result = await AMMService.addLiquidity(poolId, amountA, amountB, userAccountId, minLPTokens);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const removeLiquidity = async (req, res) => {
  try {
    const { poolId, lpTokenAmount, userAccountId, minAmountA, minAmountB } = req.body;
    const result = await AMMService.removeLiquidity(poolId, lpTokenAmount, userAccountId, minAmountA, minAmountB);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const swapTokens = async (req, res) => {
  try {
    const { poolId, tokenIn, amountIn, tokenOut, minAmountOut, userAccountId } = req.body;
    const result = await AMMService.swapTokens(poolId, tokenIn, amountIn, tokenOut, minAmountOut, userAccountId);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const getSwapQuote = async (req, res) => {
  try {
    const { poolId, tokenIn, amountIn, tokenOut } = req.query;
    const result = await AMMService.getSwapQuote(poolId, tokenIn, parseFloat(amountIn), tokenOut);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const getPoolInfo = async (req, res) => {
  try {
    const { poolId } = req.params;
    const result = await AMMService.getPoolInfo(poolId);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const getUserPositions = async (req, res) => {
  try {
    const { userAccountId } = req.params;
    const result = await AMMService.getUserPositions(userAccountId);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const getAllPools = async (req, res) => {
  try {
    const result = await AMMService.getAllPools();
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

// Lending Controllers
const createLoan = async (req, res) => {
  try {
    const { borrowerAccountId, collateralTokenId, collateralAmount, borrowAsset, borrowAmount, loanTermDays } = req.body;
    const result = await LendingService.createLoan(borrowerAccountId, collateralTokenId, collateralAmount, borrowAsset, borrowAmount, loanTermDays);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const repayLoan = async (req, res) => {
  try {
    const { loanId, repaymentAmount, repayerAccountId } = req.body;
    const result = await LendingService.repayLoan(loanId, repaymentAmount, repayerAccountId);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const lendToPool = async (req, res) => {
  try {
    const { lenderAccountId, poolId, amount } = req.body;
    const result = await LendingService.lendToPool(lenderAccountId, poolId, amount);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const withdrawFromPool = async (req, res) => {
  try {
    const { lenderAccountId, positionId, amount } = req.body;
    const result = await LendingService.withdrawFromPool(lenderAccountId, positionId, amount);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const getLoanDetails = async (req, res) => {
  try {
    const { loanId } = req.params;
    const result = await LendingService.getLoanDetails(loanId);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const getUserLoans = async (req, res) => {
  try {
    const { userAccountId } = req.params;
    const result = await LendingService.getUserLoans(userAccountId);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const getLendingPoolInfo = async (req, res) => {
  try {
    const { poolId } = req.params;
    const result = await LendingService.getPoolInfo(poolId);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const getAllLendingPools = async (req, res) => {
  try {
    const result = await LendingService.getAllPools();
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

// Oracle Pricing Controllers
const getPrice = async (req, res) => {
  try {
    const { symbol } = req.params;
    const result = await OracleService.getPrice(symbol);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const getPriceHistory = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { timeframe } = req.query;
    const result = await OracleService.getPriceHistory(symbol, timeframe);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const getMultiplePrices = async (req, res) => {
  try {
    const { symbols } = req.body;
    const result = await OracleService.getMultiplePrices(symbols);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const calculateRWAPrice = async (req, res) => {
  try {
    const { tokenId, assetData, marketFactors } = req.body;
    const result = await OracleService.calculateRWAPrice(tokenId, assetData, marketFactors);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const getAllPrices = async (req, res) => {
  try {
    const result = await OracleService.getAllPrices();
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const getMarketSummary = async (req, res) => {
  try {
    const result = await OracleService.getMarketSummary();
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

// Combined RWA Dashboard
const getRWADashboard = async (req, res) => {
  try {
    const { userAccountId } = req.params;
    
    // Get user's tokenized assets
    const tokenizedAssets = await RWATokenizationService.listTokenizedAssets({ 
      ownerAccountId: userAccountId 
    });
    
    // Get user's liquidity positions
    const liquidityPositions = await AMMService.getUserPositions(userAccountId);
    
    // Get user's loans
    const loans = await LendingService.getUserLoans(userAccountId);
    
    // Get market summary
    const marketSummary = await OracleService.getMarketSummary();
    
    // Get all pools for overview
    const ammPools = await AMMService.getAllPools();
    const lendingPools = await LendingService.getAllPools();

    const dashboard = {
      userAccountId,
      summary: {
        totalTokenizedAssets: tokenizedAssets.totalCount,
        totalLiquidityPositions: liquidityPositions.length,
        totalLoans: loans.length,
        totalPortfolioValue: 0 // Would calculate based on current prices
      },
      tokenizedAssets: tokenizedAssets.assets,
      liquidityPositions,
      loans,
      marketSummary,
      availablePools: {
        amm: ammPools,
        lending: lendingPools
      },
      generatedAt: new Date().toISOString()
    };

    res.send(dashboard);
  } catch (error) {
    res.status(error.errorCode || 500).send({
      errorCode: 500,
      error: error.message,
      userAccountId: req.params.userAccountId
    });
  }
};

export {
  // RWA Tokenization
  tokenizeAsset,
  processNFCTokenization,
  getTokenizationDetails,
  listTokenizedAssets,
  
  // AMM Liquidity
  createLiquidityPool,
  addLiquidity,
  removeLiquidity,
  swapTokens,
  getSwapQuote,
  getPoolInfo,
  getUserPositions,
  getAllPools,
  
  // Lending
  createLoan,
  repayLoan,
  lendToPool,
  withdrawFromPool,
  getLoanDetails,
  getUserLoans,
  getLendingPoolInfo,
  getAllLendingPools,
  
  // Oracle Pricing
  getPrice,
  getPriceHistory,
  getMultiplePrices,
  calculateRWAPrice,
  getAllPrices,
  getMarketSummary,
  
  // Dashboard
  getRWADashboard
};
