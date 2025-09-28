import {
  Client,
  PrivateKey,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TokenAssociateTransaction,
  TransferTransaction,
  Hbar,
  AccountId,
  TokenId
} from '@hashgraph/sdk';
import crypto from 'crypto';
import logger from '../utils/logger';
import { hederaNetwork, hederaOperatorId, hederaOperatorKey } from '../config.json';

// Initialize Hedera client
const client = Client.forTestnet();
client.setOperator(hederaOperatorId, hederaOperatorKey);

// AMM Constants
const AMM_FEE_RATE = 0.003; // 0.3% trading fee
const MINIMUM_LIQUIDITY = 1000; // Minimum liquidity for pool creation
const SLIPPAGE_TOLERANCE = 0.05; // 5% default slippage tolerance

class AMMEngine {
  constructor() {
    this.liquidityPools = new Map();
    this.userPositions = new Map();
    this.tradingHistory = new Map();
    this.poolTokens = new Map(); // LP tokens for each pool
  }

  async createLiquidityPool(tokenA, tokenB, initialPriceRatio, creatorAccountId) {
    try {
      const poolId = crypto.randomUUID();
      
      logger.info('AMMEngine', 'createLiquidityPool', `Creating pool: ${tokenA}/${tokenB}`);

      // Create LP token for this pool
      const lpToken = await this.createLPToken(tokenA, tokenB, creatorAccountId);

      // Initialize pool with constant product formula (x * y = k)
      const pool = {
        poolId,
        tokenA,
        tokenB,
        reserveA: 0,
        reserveB: 0,
        totalLiquidity: 0,
        lpTokenId: lpToken.tokenId,
        feeRate: AMM_FEE_RATE,
        createdAt: new Date().toISOString(),
        creatorAccountId,
        active: true,
        priceHistory: [],
        volume24h: 0,
        fees24h: 0
      };

      this.liquidityPools.set(poolId, pool);

      return {
        poolId,
        tokenA,
        tokenB,
        lpTokenId: lpToken.tokenId,
        lpTokenSymbol: lpToken.symbol,
        initialPriceRatio,
        status: 'CREATED'
      };

    } catch (error) {
      logger.error('AMMEngine', 'createLiquidityPool', error.message);
      throw {
        errorCode: 500,
        error: error.message,
        tokenA,
        tokenB
      };
    }
  }

  async createLPToken(tokenA, tokenB, creatorAccountId) {
    try {
      const treasuryKey = PrivateKey.generateED25519();
      const treasuryId = AccountId.fromString(creatorAccountId);

      const symbol = `LP-${tokenA.split('.').pop()}-${tokenB.split('.').pop()}`;
      const name = `${tokenA}/${tokenB} Liquidity Pool Token`;

      const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(8)
        .setInitialSupply(0)
        .setTreasuryAccountId(treasuryId)
        .setSupplyType(TokenSupplyType.Infinite)
        .setAdminKey(treasuryKey)
        .setSupplyKey(treasuryKey)
        .setFreezeDefault(false)
        .setTokenMemo(`LP Token for ${tokenA}/${tokenB} pool`);

      const tokenCreateSign = await tokenCreateTx.sign(treasuryKey);
      const tokenCreateSubmit = await tokenCreateSign.execute(client);
      const tokenCreateReceipt = await tokenCreateSubmit.getReceipt(client);
      const tokenId = tokenCreateReceipt.tokenId;

      return {
        tokenId: tokenId.toString(),
        symbol,
        name,
        treasuryKey: treasuryKey.toString()
      };

    } catch (error) {
      logger.error('AMMEngine', 'createLPToken', error.message);
      throw new Error(`LP token creation failed: ${error.message}`);
    }
  }

  async addLiquidity(poolId, amountA, amountB, userAccountId, minLPTokens = 0) {
    try {
      const pool = this.liquidityPools.get(poolId);
      if (!pool) {
        throw new Error('Pool not found');
      }

      logger.info('AMMEngine', 'addLiquidity', `Adding liquidity to pool: ${poolId}`);

      // Calculate LP tokens to mint
      let lpTokensToMint;
      
      if (pool.totalLiquidity === 0) {
        // First liquidity provision
        lpTokensToMint = Math.sqrt(amountA * amountB);
        
        // Ensure minimum liquidity
        if (lpTokensToMint < MINIMUM_LIQUIDITY) {
          throw new Error('Insufficient liquidity amount');
        }
      } else {
        // Subsequent liquidity provision - maintain price ratio
        const lpTokensFromA = (amountA * pool.totalLiquidity) / pool.reserveA;
        const lpTokensFromB = (amountB * pool.totalLiquidity) / pool.reserveB;
        
        lpTokensToMint = Math.min(lpTokensFromA, lpTokensFromB);
        
        if (lpTokensToMint < minLPTokens) {
          throw new Error('Slippage tolerance exceeded');
        }
      }

      // Update pool reserves
      pool.reserveA += amountA;
      pool.reserveB += amountB;
      pool.totalLiquidity += lpTokensToMint;

      // Record user position
      const positionKey = `${userAccountId}-${poolId}`;
      const existingPosition = this.userPositions.get(positionKey) || {
        userAccountId,
        poolId,
        lpTokens: 0,
        shareA: 0,
        shareB: 0,
        addedAt: new Date().toISOString()
      };

      existingPosition.lpTokens += lpTokensToMint;
      existingPosition.shareA += amountA;
      existingPosition.shareB += amountB;
      existingPosition.updatedAt = new Date().toISOString();

      this.userPositions.set(positionKey, existingPosition);

      // Mint LP tokens to user (simulated)
      const mintResult = await this.mintLPTokens(pool.lpTokenId, lpTokensToMint, userAccountId);

      return {
        poolId,
        amountA,
        amountB,
        lpTokensMinted: lpTokensToMint,
        newReserveA: pool.reserveA,
        newReserveB: pool.reserveB,
        totalLiquidity: pool.totalLiquidity,
        txHash: mintResult.txHash,
        status: 'SUCCESS'
      };

    } catch (error) {
      logger.error('AMMEngine', 'addLiquidity', error.message);
      throw {
        errorCode: 500,
        error: error.message,
        poolId
      };
    }
  }

  async removeLiquidity(poolId, lpTokenAmount, userAccountId, minAmountA = 0, minAmountB = 0) {
    try {
      const pool = this.liquidityPools.get(poolId);
      if (!pool) {
        throw new Error('Pool not found');
      }

      const positionKey = `${userAccountId}-${poolId}`;
      const position = this.userPositions.get(positionKey);
      
      if (!position || position.lpTokens < lpTokenAmount) {
        throw new Error('Insufficient LP tokens');
      }

      logger.info('AMMEngine', 'removeLiquidity', `Removing liquidity from pool: ${poolId}`);

      // Calculate amounts to return
      const shareOfPool = lpTokenAmount / pool.totalLiquidity;
      const amountA = shareOfPool * pool.reserveA;
      const amountB = shareOfPool * pool.reserveB;

      if (amountA < minAmountA || amountB < minAmountB) {
        throw new Error('Slippage tolerance exceeded');
      }

      // Update pool reserves
      pool.reserveA -= amountA;
      pool.reserveB -= amountB;
      pool.totalLiquidity -= lpTokenAmount;

      // Update user position
      position.lpTokens -= lpTokenAmount;
      position.shareA -= amountA;
      position.shareB -= amountB;
      position.updatedAt = new Date().toISOString();

      // Burn LP tokens (simulated)
      const burnResult = await this.burnLPTokens(pool.lpTokenId, lpTokenAmount, userAccountId);

      return {
        poolId,
        lpTokensBurned: lpTokenAmount,
        amountA,
        amountB,
        newReserveA: pool.reserveA,
        newReserveB: pool.reserveB,
        totalLiquidity: pool.totalLiquidity,
        txHash: burnResult.txHash,
        status: 'SUCCESS'
      };

    } catch (error) {
      logger.error('AMMEngine', 'removeLiquidity', error.message);
      throw {
        errorCode: 500,
        error: error.message,
        poolId
      };
    }
  }

  async swapTokens(poolId, tokenIn, amountIn, tokenOut, minAmountOut, userAccountId) {
    try {
      const pool = this.liquidityPools.get(poolId);
      if (!pool) {
        throw new Error('Pool not found');
      }

      logger.info('AMMEngine', 'swapTokens', `Swapping ${amountIn} ${tokenIn} for ${tokenOut}`);

      // Determine which token is being swapped
      let reserveIn, reserveOut, isTokenAIn;
      
      if (tokenIn === pool.tokenA && tokenOut === pool.tokenB) {
        reserveIn = pool.reserveA;
        reserveOut = pool.reserveB;
        isTokenAIn = true;
      } else if (tokenIn === pool.tokenB && tokenOut === pool.tokenA) {
        reserveIn = pool.reserveB;
        reserveOut = pool.reserveA;
        isTokenAIn = false;
      } else {
        throw new Error('Invalid token pair for this pool');
      }

      // Calculate output amount using constant product formula
      // amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
      // Apply trading fee
      const amountInWithFee = amountIn * (1 - pool.feeRate);
      const amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);

      if (amountOut < minAmountOut) {
        throw new Error('Slippage tolerance exceeded');
      }

      // Calculate price impact
      const priceImpact = this.calculatePriceImpact(reserveIn, reserveOut, amountIn, amountOut);

      // Update pool reserves
      if (isTokenAIn) {
        pool.reserveA += amountIn;
        pool.reserveB -= amountOut;
      } else {
        pool.reserveB += amountIn;
        pool.reserveA -= amountOut;
      }

      // Calculate and distribute fees
      const feeAmount = amountIn * pool.feeRate;
      pool.fees24h += feeAmount;
      pool.volume24h += amountIn;

      // Record trade
      const trade = {
        tradeId: crypto.randomUUID(),
        poolId,
        userAccountId,
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        feeAmount,
        priceImpact,
        timestamp: new Date().toISOString()
      };

      const userTrades = this.tradingHistory.get(userAccountId) || [];
      userTrades.push(trade);
      this.tradingHistory.set(userAccountId, userTrades);

      // Update price history
      const currentPrice = isTokenAIn ? pool.reserveB / pool.reserveA : pool.reserveA / pool.reserveB;
      pool.priceHistory.push({
        price: currentPrice,
        timestamp: new Date().toISOString()
      });

      // Keep only last 100 price points
      if (pool.priceHistory.length > 100) {
        pool.priceHistory = pool.priceHistory.slice(-100);
      }

      // Execute the swap transaction (simulated)
      const swapResult = await this.executeSwapTransaction(trade);

      return {
        tradeId: trade.tradeId,
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        feeAmount,
        priceImpact,
        newPrice: currentPrice,
        txHash: swapResult.txHash,
        status: 'SUCCESS'
      };

    } catch (error) {
      logger.error('AMMEngine', 'swapTokens', error.message);
      throw {
        errorCode: 500,
        error: error.message,
        poolId
      };
    }
  }

  calculatePriceImpact(reserveIn, reserveOut, amountIn, amountOut) {
    const priceBeforeSwap = reserveOut / reserveIn;
    const priceAfterSwap = (reserveOut - amountOut) / (reserveIn + amountIn);
    const priceImpact = Math.abs((priceAfterSwap - priceBeforeSwap) / priceBeforeSwap);
    
    return priceImpact;
  }

  async getSwapQuote(poolId, tokenIn, amountIn, tokenOut) {
    try {
      const pool = this.liquidityPools.get(poolId);
      if (!pool) {
        throw new Error('Pool not found');
      }

      let reserveIn, reserveOut;
      
      if (tokenIn === pool.tokenA && tokenOut === pool.tokenB) {
        reserveIn = pool.reserveA;
        reserveOut = pool.reserveB;
      } else if (tokenIn === pool.tokenB && tokenOut === pool.tokenA) {
        reserveIn = pool.reserveB;
        reserveOut = pool.reserveA;
      } else {
        throw new Error('Invalid token pair for this pool');
      }

      const amountInWithFee = amountIn * (1 - pool.feeRate);
      const amountOut = (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);
      const priceImpact = this.calculatePriceImpact(reserveIn, reserveOut, amountIn, amountOut);
      const feeAmount = amountIn * pool.feeRate;

      return {
        amountIn,
        amountOut,
        feeAmount,
        priceImpact,
        exchangeRate: amountOut / amountIn,
        minimumReceived: amountOut * (1 - SLIPPAGE_TOLERANCE)
      };

    } catch (error) {
      logger.error('AMMEngine', 'getSwapQuote', error.message);
      throw {
        errorCode: 500,
        error: error.message,
        poolId
      };
    }
  }

  async getPoolInfo(poolId) {
    const pool = this.liquidityPools.get(poolId);
    if (!pool) {
      throw new Error('Pool not found');
    }

    const currentPrice = pool.reserveB / pool.reserveA;
    const tvl = pool.reserveA + pool.reserveB; // Simplified TVL calculation

    return {
      poolId,
      tokenA: pool.tokenA,
      tokenB: pool.tokenB,
      reserveA: pool.reserveA,
      reserveB: pool.reserveB,
      totalLiquidity: pool.totalLiquidity,
      currentPrice,
      tvl,
      volume24h: pool.volume24h,
      fees24h: pool.fees24h,
      feeRate: pool.feeRate,
      lpTokenId: pool.lpTokenId,
      active: pool.active,
      createdAt: pool.createdAt
    };
  }

  async getUserPositions(userAccountId) {
    const positions = Array.from(this.userPositions.values())
      .filter(position => position.userAccountId === userAccountId);

    const enrichedPositions = await Promise.all(
      positions.map(async (position) => {
        const pool = this.liquidityPools.get(position.poolId);
        if (!pool) return position;

        const shareOfPool = position.lpTokens / pool.totalLiquidity;
        const currentValueA = shareOfPool * pool.reserveA;
        const currentValueB = shareOfPool * pool.reserveB;

        return {
          ...position,
          currentValueA,
          currentValueB,
          shareOfPool: shareOfPool * 100, // Percentage
          poolInfo: {
            tokenA: pool.tokenA,
            tokenB: pool.tokenB,
            currentPrice: pool.reserveB / pool.reserveA
          }
        };
      })
    );

    return enrichedPositions;
  }

  async mintLPTokens(lpTokenId, amount, userAccountId) {
    // Simulated LP token minting
    return {
      txHash: `mint-${crypto.randomUUID()}`,
      amount,
      recipient: userAccountId,
      status: 'SUCCESS'
    };
  }

  async burnLPTokens(lpTokenId, amount, userAccountId) {
    // Simulated LP token burning
    return {
      txHash: `burn-${crypto.randomUUID()}`,
      amount,
      from: userAccountId,
      status: 'SUCCESS'
    };
  }

  async executeSwapTransaction(trade) {
    // Simulated swap transaction execution
    return {
      txHash: `swap-${crypto.randomUUID()}`,
      tradeId: trade.tradeId,
      status: 'SUCCESS'
    };
  }

  async getAllPools() {
    const pools = Array.from(this.liquidityPools.values());
    
    return pools.map(pool => ({
      poolId: pool.poolId,
      tokenA: pool.tokenA,
      tokenB: pool.tokenB,
      reserveA: pool.reserveA,
      reserveB: pool.reserveB,
      currentPrice: pool.reserveB / pool.reserveA,
      tvl: pool.reserveA + pool.reserveB,
      volume24h: pool.volume24h,
      feeRate: pool.feeRate,
      active: pool.active
    }));
  }
}

// Create singleton instance
const ammEngine = new AMMEngine();

// Export functions
const createLiquidityPool = async (tokenA, tokenB, initialPriceRatio, creatorAccountId) => {
  return await ammEngine.createLiquidityPool(tokenA, tokenB, initialPriceRatio, creatorAccountId);
};

const addLiquidity = async (poolId, amountA, amountB, userAccountId, minLPTokens) => {
  return await ammEngine.addLiquidity(poolId, amountA, amountB, userAccountId, minLPTokens);
};

const removeLiquidity = async (poolId, lpTokenAmount, userAccountId, minAmountA, minAmountB) => {
  return await ammEngine.removeLiquidity(poolId, lpTokenAmount, userAccountId, minAmountA, minAmountB);
};

const swapTokens = async (poolId, tokenIn, amountIn, tokenOut, minAmountOut, userAccountId) => {
  return await ammEngine.swapTokens(poolId, tokenIn, amountIn, tokenOut, minAmountOut, userAccountId);
};

const getSwapQuote = async (poolId, tokenIn, amountIn, tokenOut) => {
  return await ammEngine.getSwapQuote(poolId, tokenIn, amountIn, tokenOut);
};

const getPoolInfo = async (poolId) => {
  return await ammEngine.getPoolInfo(poolId);
};

const getUserPositions = async (userAccountId) => {
  return await ammEngine.getUserPositions(userAccountId);
};

const getAllPools = async () => {
  return await ammEngine.getAllPools();
};

export {
  AMM_FEE_RATE,
  MINIMUM_LIQUIDITY,
  SLIPPAGE_TOLERANCE,
  AMMEngine,
  createLiquidityPool,
  addLiquidity,
  removeLiquidity,
  swapTokens,
  getSwapQuote,
  getPoolInfo,
  getUserPositions,
  getAllPools
};
