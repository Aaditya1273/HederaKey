import crypto from 'crypto';
import logger from '../utils/logger';
import { calculateRWAPrice } from './oracle-pricing';
import { encryptGDPRData, DATA_CLASSIFICATION } from '../utils/encryption';

// Lending pool types
const LENDING_POOL_TYPES = {
  COLLATERALIZED: 'COLLATERALIZED',
  UNCOLLATERALIZED: 'UNCOLLATERALIZED',
  PEER_TO_PEER: 'PEER_TO_PEER',
  INSTITUTIONAL: 'INSTITUTIONAL'
};

// Loan status types
const LOAN_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  REPAID: 'REPAID',
  DEFAULTED: 'DEFAULTED',
  LIQUIDATED: 'LIQUIDATED'
};

// Risk tiers for lending
const RISK_TIERS = {
  AAA: { ltv: 0.8, interestRate: 0.05 },   // 80% LTV, 5% APR
  AA: { ltv: 0.75, interestRate: 0.07 },   // 75% LTV, 7% APR
  A: { ltv: 0.7, interestRate: 0.09 },     // 70% LTV, 9% APR
  BBB: { ltv: 0.65, interestRate: 0.12 },  // 65% LTV, 12% APR
  BB: { ltv: 0.6, interestRate: 0.15 },    // 60% LTV, 15% APR
  B: { ltv: 0.5, interestRate: 0.20 }      // 50% LTV, 20% APR
};

class RWALendingEngine {
  constructor() {
    this.lendingPools = new Map();
    this.loans = new Map();
    this.userPositions = new Map();
    this.liquidationQueue = new Map();
    this.interestAccrual = new Map();
    
    // Initialize default lending pools
    this.initializeDefaultPools();
    
    // Start interest accrual and liquidation monitoring
    this.startPeriodicTasks();
  }

  initializeDefaultPools() {
    const defaultPools = [
      {
        poolId: 'HBAR_LENDING_POOL',
        name: 'HBAR Lending Pool',
        asset: 'HBAR',
        type: LENDING_POOL_TYPES.COLLATERALIZED,
        totalSupply: 1000000,
        totalBorrowed: 0,
        utilizationRate: 0,
        baseInterestRate: 0.05,
        optimalUtilization: 0.8,
        maxUtilization: 0.95,
        liquidationThreshold: 0.85,
        liquidationPenalty: 0.1,
        active: true
      },
      {
        poolId: 'USDC_LENDING_POOL',
        name: 'USDC Lending Pool',
        asset: 'USDC',
        type: LENDING_POOL_TYPES.COLLATERALIZED,
        totalSupply: 500000,
        totalBorrowed: 0,
        utilizationRate: 0,
        baseInterestRate: 0.04,
        optimalUtilization: 0.85,
        maxUtilization: 0.95,
        liquidationThreshold: 0.85,
        liquidationPenalty: 0.05,
        active: true
      }
    ];

    defaultPools.forEach(pool => {
      this.lendingPools.set(pool.poolId, pool);
    });
  }

  startPeriodicTasks() {
    // Update interest accrual every minute
    setInterval(() => {
      this.updateInterestAccrual();
    }, 60000);

    // Check for liquidations every 5 minutes
    setInterval(() => {
      this.checkLiquidations();
    }, 300000);
  }

  async createLoan(borrowerAccountId, collateralTokenId, collateralAmount, borrowAsset, borrowAmount, loanTermDays = 30) {
    try {
      const loanId = crypto.randomUUID();
      
      logger.info('RWALendingEngine', 'createLoan', `Creating loan: ${loanId}`);

      // Get collateral valuation
      const collateralPrice = await this.getCollateralValue(collateralTokenId, collateralAmount);
      
      // Calculate loan-to-value ratio
      const loanValue = borrowAmount;
      const ltv = loanValue / collateralPrice.totalValue;

      // Determine risk tier and interest rate
      const riskAssessment = await this.assessLoanRisk(borrowerAccountId, collateralTokenId, ltv);
      
      if (!riskAssessment.approved) {
        throw new Error(`Loan not approved: ${riskAssessment.reason}`);
      }

      // Get lending pool
      const poolId = `${borrowAsset}_LENDING_POOL`;
      const pool = this.lendingPools.get(poolId);
      
      if (!pool || !pool.active) {
        throw new Error('Lending pool not available');
      }

      // Check pool liquidity
      const availableLiquidity = pool.totalSupply - pool.totalBorrowed;
      if (borrowAmount > availableLiquidity) {
        throw new Error('Insufficient pool liquidity');
      }

      // Create loan record
      const loan = {
        loanId,
        borrowerAccountId,
        poolId,
        collateral: {
          tokenId: collateralTokenId,
          amount: collateralAmount,
          valueAtOrigination: collateralPrice.totalValue,
          pricePerToken: collateralPrice.pricePerToken
        },
        borrow: {
          asset: borrowAsset,
          amount: borrowAmount,
          interestRate: riskAssessment.interestRate,
          accruedInterest: 0
        },
        terms: {
          loanTermDays,
          ltv,
          liquidationThreshold: riskAssessment.liquidationThreshold,
          liquidationPenalty: riskAssessment.liquidationPenalty
        },
        riskTier: riskAssessment.tier,
        status: LOAN_STATUS.ACTIVE,
        createdAt: new Date().toISOString(),
        maturityDate: new Date(Date.now() + loanTermDays * 24 * 60 * 60 * 1000).toISOString(),
        lastInterestUpdate: new Date().toISOString()
      };

      // Update pool utilization
      pool.totalBorrowed += borrowAmount;
      pool.utilizationRate = pool.totalBorrowed / pool.totalSupply;

      // Store loan
      this.loans.set(loanId, loan);

      // Update user positions
      await this.updateUserPosition(borrowerAccountId, loanId, 'BORROW');

      // Execute collateral lock and fund transfer (simulated)
      const executionResult = await this.executeLoanTransaction(loan);

      logger.info('RWALendingEngine', 'createLoan', `Loan created successfully: ${loanId}`);

      return {
        loanId,
        borrowerAccountId,
        collateralLocked: collateralAmount,
        borrowedAmount: borrowAmount,
        interestRate: riskAssessment.interestRate,
        ltv,
        riskTier: riskAssessment.tier,
        maturityDate: loan.maturityDate,
        txHash: executionResult.txHash,
        status: 'SUCCESS'
      };

    } catch (error) {
      logger.error('RWALendingEngine', 'createLoan', error.message);
      throw {
        errorCode: 500,
        error: error.message,
        borrowerAccountId
      };
    }
  }

  async repayLoan(loanId, repaymentAmount, repayerAccountId) {
    try {
      const loan = this.loans.get(loanId);
      if (!loan) {
        throw new Error('Loan not found');
      }

      if (loan.borrowerAccountId !== repayerAccountId) {
        throw new Error('Unauthorized: Not the borrower');
      }

      if (loan.status !== LOAN_STATUS.ACTIVE) {
        throw new Error('Loan is not active');
      }

      logger.info('RWALendingEngine', 'repayLoan', `Processing repayment for loan: ${loanId}`);

      // Calculate current debt including accrued interest
      const currentDebt = await this.calculateCurrentDebt(loanId);
      
      if (repaymentAmount < currentDebt.totalDebt) {
        // Partial repayment
        const interestPortion = Math.min(repaymentAmount, currentDebt.accruedInterest);
        const principalPortion = repaymentAmount - interestPortion;

        loan.borrow.accruedInterest -= interestPortion;
        loan.borrow.amount -= principalPortion;
        
        // Update last interest calculation
        loan.lastInterestUpdate = new Date().toISOString();
      } else {
        // Full repayment
        loan.status = LOAN_STATUS.REPAID;
        loan.repaidAt = new Date().toISOString();
        
        // Update pool utilization
        const pool = this.lendingPools.get(loan.poolId);
        if (pool) {
          pool.totalBorrowed -= loan.borrow.amount;
          pool.utilizationRate = pool.totalBorrowed / pool.totalSupply;
        }
      }

      // Execute repayment transaction (simulated)
      const executionResult = await this.executeRepaymentTransaction(loan, repaymentAmount);

      // If fully repaid, release collateral
      let collateralReleased = null;
      if (loan.status === LOAN_STATUS.REPAID) {
        collateralReleased = await this.releaseCollateral(loan);
      }

      return {
        loanId,
        repaymentAmount,
        remainingDebt: loan.status === LOAN_STATUS.REPAID ? 0 : await this.calculateCurrentDebt(loanId),
        collateralReleased,
        loanStatus: loan.status,
        txHash: executionResult.txHash,
        status: 'SUCCESS'
      };

    } catch (error) {
      logger.error('RWALendingEngine', 'repayLoan', error.message);
      throw {
        errorCode: 500,
        error: error.message,
        loanId
      };
    }
  }

  async lendToPool(lenderAccountId, poolId, amount) {
    try {
      const pool = this.lendingPools.get(poolId);
      if (!pool || !pool.active) {
        throw new Error('Lending pool not found or inactive');
      }

      logger.info('RWALendingEngine', 'lendToPool', `Adding liquidity to pool: ${poolId}`);

      // Calculate lending shares (LP tokens for lending)
      const totalShares = pool.totalSupply;
      const newShares = amount; // Simplified 1:1 ratio

      // Update pool
      pool.totalSupply += amount;
      pool.utilizationRate = pool.totalBorrowed / pool.totalSupply;

      // Create lending position
      const positionId = crypto.randomUUID();
      const position = {
        positionId,
        lenderAccountId,
        poolId,
        asset: pool.asset,
        amount,
        shares: newShares,
        depositedAt: new Date().toISOString(),
        accruedInterest: 0,
        status: 'ACTIVE'
      };

      // Store position
      const userPositions = this.userPositions.get(lenderAccountId) || [];
      userPositions.push(position);
      this.userPositions.set(lenderAccountId, userPositions);

      // Execute deposit transaction (simulated)
      const executionResult = await this.executeLendingTransaction(position);

      return {
        positionId,
        poolId,
        amount,
        shares: newShares,
        currentAPY: this.calculateLendingAPY(pool),
        txHash: executionResult.txHash,
        status: 'SUCCESS'
      };

    } catch (error) {
      logger.error('RWALendingEngine', 'lendToPool', error.message);
      throw {
        errorCode: 500,
        error: error.message,
        poolId
      };
    }
  }

  async withdrawFromPool(lenderAccountId, positionId, amount) {
    try {
      const userPositions = this.userPositions.get(lenderAccountId) || [];
      const position = userPositions.find(p => p.positionId === positionId);
      
      if (!position) {
        throw new Error('Lending position not found');
      }

      const pool = this.lendingPools.get(position.poolId);
      if (!pool) {
        throw new Error('Pool not found');
      }

      logger.info('RWALendingEngine', 'withdrawFromPool', `Withdrawing from pool: ${position.poolId}`);

      // Check available liquidity
      const availableLiquidity = pool.totalSupply - pool.totalBorrowed;
      if (amount > availableLiquidity) {
        throw new Error('Insufficient pool liquidity for withdrawal');
      }

      // Calculate accrued interest
      const accruedInterest = await this.calculateLendingInterest(position);

      // Update position
      if (amount >= position.amount) {
        // Full withdrawal
        position.status = 'WITHDRAWN';
        position.withdrawnAt = new Date().toISOString();
      } else {
        // Partial withdrawal
        position.amount -= amount;
        position.shares = position.amount; // Simplified 1:1 ratio
      }

      // Update pool
      pool.totalSupply -= amount;
      pool.utilizationRate = pool.totalBorrowed / pool.totalSupply;

      // Execute withdrawal transaction (simulated)
      const executionResult = await this.executeWithdrawalTransaction(position, amount);

      return {
        positionId,
        withdrawnAmount: amount,
        accruedInterest: accruedInterest.totalInterest,
        totalReceived: amount + accruedInterest.totalInterest,
        remainingPosition: position.status === 'WITHDRAWN' ? 0 : position.amount,
        txHash: executionResult.txHash,
        status: 'SUCCESS'
      };

    } catch (error) {
      logger.error('RWALendingEngine', 'withdrawFromPool', error.message);
      throw {
        errorCode: 500,
        error: error.message,
        positionId
      };
    }
  }

  async getCollateralValue(tokenId, amount) {
    try {
      // Get current price from oracle
      const priceData = await calculateRWAPrice(tokenId, { valuation: 1000 }); // Mock asset data
      
      return {
        tokenId,
        amount,
        pricePerToken: priceData.adjustedPrice,
        totalValue: amount * priceData.adjustedPrice,
        confidence: priceData.confidence,
        lastUpdated: priceData.calculatedAt
      };

    } catch (error) {
      // Fallback to default valuation
      return {
        tokenId,
        amount,
        pricePerToken: 100, // Default $100 per token
        totalValue: amount * 100,
        confidence: 0.5,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  async assessLoanRisk(borrowerAccountId, collateralTokenId, ltv) {
    try {
      // Risk assessment based on multiple factors
      let riskScore = 0;

      // LTV risk
      if (ltv > 0.8) riskScore += 0.4;
      else if (ltv > 0.7) riskScore += 0.3;
      else if (ltv > 0.6) riskScore += 0.2;
      else riskScore += 0.1;

      // Collateral type risk (simplified)
      const collateralRisk = 0.2; // Assume moderate risk for RWA
      riskScore += collateralRisk;

      // Borrower history risk (simplified)
      const borrowerRisk = 0.1; // Assume good borrower
      riskScore += borrowerRisk;

      // Determine risk tier
      let tier, approved = true, reason = '';

      if (riskScore <= 0.2) {
        tier = 'AAA';
      } else if (riskScore <= 0.3) {
        tier = 'AA';
      } else if (riskScore <= 0.4) {
        tier = 'A';
      } else if (riskScore <= 0.5) {
        tier = 'BBB';
      } else if (riskScore <= 0.6) {
        tier = 'BB';
      } else if (riskScore <= 0.7) {
        tier = 'B';
      } else {
        approved = false;
        reason = 'Risk score too high';
        tier = 'REJECTED';
      }

      const riskParams = RISK_TIERS[tier] || { ltv: 0, interestRate: 0 };

      return {
        approved,
        reason,
        tier,
        riskScore,
        interestRate: riskParams.interestRate,
        liquidationThreshold: 0.85,
        liquidationPenalty: 0.1,
        maxLTV: riskParams.ltv
      };

    } catch (error) {
      return {
        approved: false,
        reason: 'Risk assessment failed',
        tier: 'REJECTED',
        riskScore: 1.0
      };
    }
  }

  async calculateCurrentDebt(loanId) {
    const loan = this.loans.get(loanId);
    if (!loan) {
      throw new Error('Loan not found');
    }

    // Calculate time elapsed since last interest update
    const lastUpdate = new Date(loan.lastInterestUpdate);
    const now = new Date();
    const timeElapsed = (now - lastUpdate) / (1000 * 60 * 60 * 24 * 365); // Years

    // Calculate compound interest
    const interestRate = loan.borrow.interestRate;
    const principal = loan.borrow.amount;
    const previousInterest = loan.borrow.accruedInterest;

    const newInterest = principal * interestRate * timeElapsed;
    const totalAccruedInterest = previousInterest + newInterest;
    const totalDebt = principal + totalAccruedInterest;

    return {
      principal,
      accruedInterest: totalAccruedInterest,
      newInterest,
      totalDebt,
      interestRate,
      timeElapsed
    };
  }

  calculateLendingAPY(pool) {
    // Simplified APY calculation based on utilization
    const baseRate = pool.baseInterestRate;
    const utilizationRate = pool.utilizationRate;
    const optimalUtilization = pool.optimalUtilization;

    let apy;
    if (utilizationRate <= optimalUtilization) {
      apy = baseRate * (utilizationRate / optimalUtilization);
    } else {
      const excessUtilization = utilizationRate - optimalUtilization;
      const maxExcess = 1 - optimalUtilization;
      apy = baseRate + (baseRate * 2 * (excessUtilization / maxExcess));
    }

    return Math.min(apy, 0.5); // Cap at 50% APY
  }

  async calculateLendingInterest(position) {
    const pool = this.lendingPools.get(position.poolId);
    if (!pool) {
      return { totalInterest: 0 };
    }

    const depositTime = new Date(position.depositedAt);
    const now = new Date();
    const timeElapsed = (now - depositTime) / (1000 * 60 * 60 * 24 * 365); // Years

    const apy = this.calculateLendingAPY(pool);
    const interest = position.amount * apy * timeElapsed;

    return {
      totalInterest: interest,
      apy,
      timeElapsed,
      principal: position.amount
    };
  }

  async updateInterestAccrual() {
    try {
      // Update interest for all active loans
      for (const [loanId, loan] of this.loans.entries()) {
        if (loan.status === LOAN_STATUS.ACTIVE) {
          const debtInfo = await this.calculateCurrentDebt(loanId);
          loan.borrow.accruedInterest = debtInfo.accruedInterest;
          loan.lastInterestUpdate = new Date().toISOString();
        }
      }
    } catch (error) {
      logger.error('RWALendingEngine', 'updateInterestAccrual', error.message);
    }
  }

  async checkLiquidations() {
    try {
      for (const [loanId, loan] of this.loans.entries()) {
        if (loan.status === LOAN_STATUS.ACTIVE) {
          const shouldLiquidate = await this.shouldLiquidate(loan);
          if (shouldLiquidate.liquidate) {
            await this.liquidateLoan(loanId, shouldLiquidate.reason);
          }
        }
      }
    } catch (error) {
      logger.error('RWALendingEngine', 'checkLiquidations', error.message);
    }
  }

  async shouldLiquidate(loan) {
    try {
      // Get current collateral value
      const currentCollateralValue = await this.getCollateralValue(
        loan.collateral.tokenId,
        loan.collateral.amount
      );

      // Get current debt
      const currentDebt = await this.calculateCurrentDebt(loan.loanId);

      // Calculate current LTV
      const currentLTV = currentDebt.totalDebt / currentCollateralValue.totalValue;

      // Check if liquidation threshold is breached
      const liquidate = currentLTV >= loan.terms.liquidationThreshold;

      return {
        liquidate,
        currentLTV,
        liquidationThreshold: loan.terms.liquidationThreshold,
        collateralValue: currentCollateralValue.totalValue,
        debtValue: currentDebt.totalDebt,
        reason: liquidate ? 'LTV threshold breached' : null
      };

    } catch (error) {
      return {
        liquidate: true,
        reason: 'Error calculating liquidation status'
      };
    }
  }

  async liquidateLoan(loanId, reason) {
    try {
      const loan = this.loans.get(loanId);
      if (!loan) return;

      logger.warn('RWALendingEngine', 'liquidateLoan', `Liquidating loan: ${loanId} - ${reason}`);

      loan.status = LOAN_STATUS.LIQUIDATED;
      loan.liquidatedAt = new Date().toISOString();
      loan.liquidationReason = reason;

      // Update pool
      const pool = this.lendingPools.get(loan.poolId);
      if (pool) {
        pool.totalBorrowed -= loan.borrow.amount;
        pool.utilizationRate = pool.totalBorrowed / pool.totalSupply;
      }

      // Execute liquidation (simulated)
      const liquidationResult = await this.executeLiquidation(loan);

      return liquidationResult;

    } catch (error) {
      logger.error('RWALendingEngine', 'liquidateLoan', error.message);
    }
  }

  async updateUserPosition(userAccountId, loanId, type) {
    // Update user position tracking
    const positions = this.userPositions.get(userAccountId) || [];
    positions.push({
      loanId,
      type,
      createdAt: new Date().toISOString()
    });
    this.userPositions.set(userAccountId, positions);
  }

  // Simulated transaction execution methods
  async executeLoanTransaction(loan) {
    return {
      txHash: `loan-${crypto.randomUUID()}`,
      status: 'SUCCESS'
    };
  }

  async executeRepaymentTransaction(loan, amount) {
    return {
      txHash: `repay-${crypto.randomUUID()}`,
      status: 'SUCCESS'
    };
  }

  async executeLendingTransaction(position) {
    return {
      txHash: `lend-${crypto.randomUUID()}`,
      status: 'SUCCESS'
    };
  }

  async executeWithdrawalTransaction(position, amount) {
    return {
      txHash: `withdraw-${crypto.randomUUID()}`,
      status: 'SUCCESS'
    };
  }

  async releaseCollateral(loan) {
    return {
      tokenId: loan.collateral.tokenId,
      amount: loan.collateral.amount,
      txHash: `release-${crypto.randomUUID()}`,
      status: 'SUCCESS'
    };
  }

  async executeLiquidation(loan) {
    return {
      loanId: loan.loanId,
      collateralSeized: loan.collateral.amount,
      txHash: `liquidate-${crypto.randomUUID()}`,
      status: 'SUCCESS'
    };
  }

  // Public query methods
  async getLoanDetails(loanId) {
    const loan = this.loans.get(loanId);
    if (!loan) {
      throw new Error('Loan not found');
    }

    const currentDebt = await this.calculateCurrentDebt(loanId);
    const collateralValue = await this.getCollateralValue(
      loan.collateral.tokenId,
      loan.collateral.amount
    );

    return {
      ...loan,
      currentDebt,
      collateralValue,
      currentLTV: currentDebt.totalDebt / collateralValue.totalValue
    };
  }

  async getUserLoans(userAccountId) {
    const userLoans = Array.from(this.loans.values())
      .filter(loan => loan.borrowerAccountId === userAccountId);

    return Promise.all(
      userLoans.map(loan => this.getLoanDetails(loan.loanId))
    );
  }

  async getPoolInfo(poolId) {
    const pool = this.lendingPools.get(poolId);
    if (!pool) {
      throw new Error('Pool not found');
    }

    return {
      ...pool,
      currentAPY: this.calculateLendingAPY(pool),
      availableLiquidity: pool.totalSupply - pool.totalBorrowed
    };
  }

  async getAllPools() {
    const pools = Array.from(this.lendingPools.values());
    return pools.map(pool => ({
      ...pool,
      currentAPY: this.calculateLendingAPY(pool),
      availableLiquidity: pool.totalSupply - pool.totalBorrowed
    }));
  }
}

// Create singleton instance
const rwaLendingEngine = new RWALendingEngine();

// Export functions
const createLoan = async (borrowerAccountId, collateralTokenId, collateralAmount, borrowAsset, borrowAmount, loanTermDays) => {
  return await rwaLendingEngine.createLoan(borrowerAccountId, collateralTokenId, collateralAmount, borrowAsset, borrowAmount, loanTermDays);
};

const repayLoan = async (loanId, repaymentAmount, repayerAccountId) => {
  return await rwaLendingEngine.repayLoan(loanId, repaymentAmount, repayerAccountId);
};

const lendToPool = async (lenderAccountId, poolId, amount) => {
  return await rwaLendingEngine.lendToPool(lenderAccountId, poolId, amount);
};

const withdrawFromPool = async (lenderAccountId, positionId, amount) => {
  return await rwaLendingEngine.withdrawFromPool(lenderAccountId, positionId, amount);
};

const getLoanDetails = async (loanId) => {
  return await rwaLendingEngine.getLoanDetails(loanId);
};

const getUserLoans = async (userAccountId) => {
  return await rwaLendingEngine.getUserLoans(userAccountId);
};

const getPoolInfo = async (poolId) => {
  return await rwaLendingEngine.getPoolInfo(poolId);
};

const getAllPools = async () => {
  return await rwaLendingEngine.getAllPools();
};

export {
  LENDING_POOL_TYPES,
  LOAN_STATUS,
  RISK_TIERS,
  RWALendingEngine,
  createLoan,
  repayLoan,
  lendToPool,
  withdrawFromPool,
  getLoanDetails,
  getUserLoans,
  getPoolInfo,
  getAllPools
};
