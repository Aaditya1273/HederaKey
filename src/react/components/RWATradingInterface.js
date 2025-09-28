import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  TrendingUp, 
  Coins, 
  ArrowUpDown, 
  DollarSign,
  PiggyBank,
  Zap,
  BarChart3,
  RefreshCw
} from 'lucide-react';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 25px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 2px solid #e2e8f0;
`;

const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const TokenGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
`;

const TokenCard = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #4f46e5;
    box-shadow: 0 5px 15px rgba(79, 70, 229, 0.1);
  }
`;

const TokenHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const TokenName = styled.div`
  font-weight: 700;
  color: #1e293b;
  font-size: 1.1rem;
`;

const TokenPrice = styled.div`
  font-weight: 600;
  color: #10b981;
  font-size: 1rem;
`;

const TokenDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 15px;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DetailLabel = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 600;
`;

const DetailValue = styled.div`
  font-weight: 600;
  color: #1e293b;
`;

const ActionButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const Button = styled.button`
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const PrimaryButton = styled(Button)`
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  
  &:hover {
    box-shadow: 0 5px 15px rgba(79, 70, 229, 0.3);
  }
`;

const SecondaryButton = styled(Button)`
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  
  &:hover {
    box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);
  }
`;

const SwapInterface = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #e2e8f0;
`;

const SwapRow = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
`;

const TokenSelect = styled.select`
  flex: 1;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 600;
`;

const AmountInput = styled.input`
  flex: 2;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
`;

const SwapButton = styled(Button)`
  width: 100%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  margin-top: 15px;
`;

const LendingPools = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const PoolCard = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #e2e8f0;
`;

const PoolHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const PoolName = styled.div`
  font-weight: 700;
  color: #1e293b;
`;

const PoolAPY = styled.div`
  font-weight: 600;
  color: #10b981;
  font-size: 1.1rem;
`;

const PoolStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 15px;
`;

const RWATradingInterface = ({ account, connected }) => {
  const [tokenizedAssets, setTokenizedAssets] = useState([]);
  const [liquidityPools, setLiquidityPools] = useState([]);
  const [lendingPools, setLendingPools] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [swapData, setSwapData] = useState({
    tokenIn: '',
    amountIn: '',
    tokenOut: '',
    quote: null
  });

  useEffect(() => {
    if (connected && account) {
      loadRWAData();
      loadPrices();
    }
  }, [connected, account]);

  const loadRWAData = async () => {
    try {
      setLoading(true);
      
      // Load user's RWA dashboard
      const response = await fetch(`/rwa/dashboard/${account.accountId}`);
      if (response.ok) {
        const data = await response.json();
        setTokenizedAssets(data.tokenizedAssets || []);
        setLiquidityPools(data.availablePools?.amm || []);
        setLendingPools(data.availablePools?.lending || []);
      }
    } catch (error) {
      console.error('Error loading RWA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrices = async () => {
    try {
      const response = await fetch('/oracle/prices');
      if (response.ok) {
        const data = await response.json();
        setPrices(data);
      }
    } catch (error) {
      console.error('Error loading prices:', error);
    }
  };

  const handleLendShare = async (tokenId, amount) => {
    try {
      const response = await fetch('/rwa/lending/lend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lenderAccountId: account.accountId,
          poolId: 'HBAR_LENDING_POOL',
          amount: parseFloat(amount)
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully lent ${amount} tokens! APY: ${result.currentAPY}%`);
        loadRWAData();
      } else {
        throw new Error('Lending failed');
      }
    } catch (error) {
      toast.error(`Lending failed: ${error.message}`);
    }
  };

  const handleSwap = async () => {
    try {
      const response = await fetch('/rwa/amm/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: 'default-pool',
          tokenIn: swapData.tokenIn,
          amountIn: parseFloat(swapData.amountIn),
          tokenOut: swapData.tokenOut,
          minAmountOut: 0,
          userAccountId: account.accountId
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Swap successful! Received ${result.amountOut} ${swapData.tokenOut}`);
        setSwapData({ tokenIn: '', amountIn: '', tokenOut: '', quote: null });
        loadRWAData();
      } else {
        throw new Error('Swap failed');
      }
    } catch (error) {
      toast.error(`Swap failed: ${error.message}`);
    }
  };

  const getSwapQuote = async () => {
    if (!swapData.tokenIn || !swapData.amountIn || !swapData.tokenOut) return;

    try {
      const response = await fetch(`/rwa/amm/quote?poolId=default-pool&tokenIn=${swapData.tokenIn}&amountIn=${swapData.amountIn}&tokenOut=${swapData.tokenOut}`);
      if (response.ok) {
        const quote = await response.json();
        setSwapData(prev => ({ ...prev, quote }));
      }
    } catch (error) {
      console.error('Error getting quote:', error);
    }
  };

  if (!connected) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <TrendingUp size={48} style={{ marginBottom: '20px', color: '#4f46e5' }} />
          <h3>Connect Wallet to Trade RWA Tokens</h3>
          <p>Access tokenized real-world assets, liquidity pools, and lending markets.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <TrendingUp size={28} />
          RWA Trading & Lending
        </Title>
        <Button onClick={loadRWAData}>
          <RefreshCw size={16} />
          Refresh
        </Button>
      </Header>

      <MainGrid>
        <Card
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CardTitle>
            <Coins size={20} />
            Your Tokenized Assets
          </CardTitle>
          
          <TokenGrid>
            {tokenizedAssets.map((asset, index) => (
              <TokenCard key={asset.tokenizationId || index}>
                <TokenHeader>
                  <TokenName>{asset.tokenName || 'RWA Token'}</TokenName>
                  <TokenPrice>${(asset.pricePerToken || 100).toFixed(2)}</TokenPrice>
                </TokenHeader>
                
                <TokenDetails>
                  <DetailItem>
                    <DetailLabel>Supply</DetailLabel>
                    <DetailValue>{asset.totalSupply || 1000}</DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>Type</DetailLabel>
                    <DetailValue>{asset.assetType || 'FARM_SHARE'}</DetailValue>
                  </DetailItem>
                </TokenDetails>
                
                <ActionButtons>
                  <PrimaryButton onClick={() => handleSwap()}>
                    <ArrowUpDown size={16} />
                    Trade
                  </PrimaryButton>
                  <SecondaryButton onClick={() => handleLendShare(asset.tokenId, 100)}>
                    <PiggyBank size={16} />
                    Lend Share
                  </SecondaryButton>
                </ActionButtons>
              </TokenCard>
            ))}
          </TokenGrid>
        </Card>

        <Card
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <CardTitle>
            <ArrowUpDown size={20} />
            Token Swap
          </CardTitle>
          
          <SwapInterface>
            <SwapRow>
              <TokenSelect 
                value={swapData.tokenIn}
                onChange={(e) => setSwapData(prev => ({ ...prev, tokenIn: e.target.value }))}
              >
                <option value="">Select Token</option>
                <option value="HBAR">HBAR</option>
                <option value="USDC">USDC</option>
                {tokenizedAssets.map(asset => (
                  <option key={asset.tokenId} value={asset.tokenSymbol}>
                    {asset.tokenSymbol}
                  </option>
                ))}
              </TokenSelect>
              <AmountInput
                type="number"
                placeholder="0.0"
                value={swapData.amountIn}
                onChange={(e) => setSwapData(prev => ({ ...prev, amountIn: e.target.value }))}
                onBlur={getSwapQuote}
              />
            </SwapRow>
            
            <div style={{ textAlign: 'center', margin: '10px 0' }}>
              <ArrowUpDown size={20} color="#64748b" />
            </div>
            
            <SwapRow>
              <TokenSelect
                value={swapData.tokenOut}
                onChange={(e) => setSwapData(prev => ({ ...prev, tokenOut: e.target.value }))}
              >
                <option value="">Select Token</option>
                <option value="HBAR">HBAR</option>
                <option value="USDC">USDC</option>
              </TokenSelect>
              <AmountInput
                type="number"
                placeholder="0.0"
                value={swapData.quote?.amountOut || ''}
                readOnly
              />
            </SwapRow>
            
            {swapData.quote && (
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '10px' }}>
                Rate: 1 {swapData.tokenIn} = {swapData.quote.exchangeRate?.toFixed(4)} {swapData.tokenOut}
              </div>
            )}
            
            <SwapButton onClick={handleSwap}>
              <Zap size={16} />
              Swap Tokens
            </SwapButton>
          </SwapInterface>
        </Card>
      </MainGrid>

      <Card
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <CardTitle>
          <DollarSign size={20} />
          Lending Pools
        </CardTitle>
        
        <LendingPools>
          {lendingPools.map((pool, index) => (
            <PoolCard key={pool.poolId || index}>
              <PoolHeader>
                <PoolName>{pool.name || 'Lending Pool'}</PoolName>
                <PoolAPY>{(pool.currentAPY * 100 || 5).toFixed(2)}% APY</PoolAPY>
              </PoolHeader>
              
              <PoolStats>
                <DetailItem>
                  <DetailLabel>Total Supply</DetailLabel>
                  <DetailValue>{(pool.totalSupply || 0).toLocaleString()}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Available</DetailLabel>
                  <DetailValue>{(pool.availableLiquidity || 0).toLocaleString()}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Utilization</DetailLabel>
                  <DetailValue>{(pool.utilizationRate * 100 || 0).toFixed(1)}%</DetailValue>
                </DetailItem>
              </PoolStats>
              
              <ActionButtons>
                <PrimaryButton onClick={() => handleLendShare(pool.poolId, 1000)}>
                  <PiggyBank size={16} />
                  Lend to Pool
                </PrimaryButton>
                <SecondaryButton>
                  <BarChart3 size={16} />
                  View Details
                </SecondaryButton>
              </ActionButtons>
            </PoolCard>
          ))}
        </LendingPools>
      </Card>
    </Container>
  );
};

export default RWATradingInterface;
