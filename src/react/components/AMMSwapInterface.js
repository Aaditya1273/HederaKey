import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown,
  Zap, 
  Info,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  DollarSign
} from 'lucide-react';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
`;

const SwapCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 2px solid #e2e8f0;
`;

const SwapHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
`;

const SwapTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RefreshButton = styled.button`
  padding: 8px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #4f46e5;
    color: #4f46e5;
  }
`;

const TokenInput = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #e2e8f0;
  margin-bottom: 15px;
  transition: all 0.3s ease;
  
  &:focus-within {
    border-color: #4f46e5;
    background: white;
  }
`;

const TokenHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const TokenLabel = styled.div`
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 600;
`;

const TokenBalance = styled.div`
  color: #64748b;
  font-size: 0.875rem;
`;

const TokenRow = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const TokenSelect = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background: white;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  cursor: pointer;
  min-width: 120px;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #4f46e5;
  }
`;

const TokenIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.color || 'linear-gradient(135deg, #4f46e5, #7c3aed)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
`;

const TokenInfo = styled.div`
  flex: 1;
`;

const TokenSymbol = styled.div`
  font-weight: 700;
  color: #1e293b;
`;

const TokenName = styled.div`
  font-size: 0.75rem;
  color: #64748b;
`;

const AmountInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  text-align: right;
  outline: none;
  
  &::placeholder {
    color: #cbd5e1;
  }
`;

const SwapButton = styled(motion.div)`
  display: flex;
  justify-content: center;
  margin: -10px 0;
  z-index: 10;
  position: relative;
`;

const SwapIcon = styled(motion.button)`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border: 4px solid white;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  
  &:hover {
    transform: rotate(180deg);
  }
`;

const PriceInfo = styled.div`
  background: #f0f9ff;
  border-radius: 12px;
  padding: 15px;
  margin: 20px 0;
  border-left: 4px solid #3b82f6;
`;

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const PriceLabel = styled.div`
  color: #64748b;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const PriceValue = styled.div`
  color: #1e293b;
  font-weight: 600;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ExecuteButton = styled(motion.button)`
  width: 100%;
  padding: 16px 24px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const LivePriceDisplay = styled.div`
  background: linear-gradient(135deg, #1e293b, #334155);
  border-radius: 12px;
  padding: 20px;
  color: white;
  margin-bottom: 20px;
`;

const LivePriceHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 15px;
`;

const LivePriceTitle = styled.div`
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PriceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
`;

const PriceItem = styled.div`
  text-align: center;
`;

const PriceSymbol = styled.div`
  font-size: 0.75rem;
  color: #94a3b8;
  margin-bottom: 4px;
`;

const PriceAmount = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 4px;
`;

const PriceChange = styled.div`
  font-size: 0.75rem;
  color: ${props => props.positive ? '#10b981' : '#ef4444'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
`;

const AlertBox = styled(motion.div)`
  background: ${props => {
    switch (props.type) {
      case 'warning': return '#fef3c7';
      case 'error': return '#fee2e2';
      case 'success': return '#d1fae5';
      default: return '#dbeafe';
    }
  }};
  border: 2px solid ${props => {
    switch (props.type) {
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'success': return '#10b981';
      default: return '#3b82f6';
    }
  }};
  border-radius: 8px;
  padding: 12px 15px;
  margin: 15px 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const AlertText = styled.div`
  color: ${props => {
    switch (props.type) {
      case 'warning': return '#92400e';
      case 'error': return '#991b1b';
      case 'success': return '#065f46';
      default: return '#1e40af';
    }
  }};
  font-size: 0.875rem;
  font-weight: 500;
`;

const AMMSwapInterface = ({ onSwapComplete }) => {
  const [fromToken, setFromToken] = useState({ symbol: 'FARM001', name: 'Farm Share', balance: 1000 });
  const [toToken, setToToken] = useState({ symbol: 'HBAR', name: 'Hedera', balance: 523.45 });
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [priceImpact, setPriceImpact] = useState(0);
  const [slippage, setSlippage] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);
  const [livePrices, setLivePrices] = useState({});
  const [swapRate, setSwapRate] = useState(0.00523);

  const tokens = [
    { symbol: 'FARM001', name: 'Farm Share', color: '#10b981', balance: 1000 },
    { symbol: 'HBAR', name: 'Hedera', color: '#4f46e5', balance: 523.45 },
    { symbol: 'USDC', name: 'USD Coin', color: '#2563eb', balance: 2500 },
    { symbol: 'BTC', name: 'Bitcoin', color: '#f59e0b', balance: 0.125 }
  ];

  useEffect(() => {
    loadLivePrices();
    const interval = setInterval(loadLivePrices, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (fromAmount && fromToken && toToken) {
      calculateSwap();
    }
  }, [fromAmount, fromToken, toToken, swapRate]);

  const loadLivePrices = async () => {
    try {
      const response = await fetch('/oracle/prices');
      if (response.ok) {
        const data = await response.json();
        setLivePrices(data);
        
        // Update swap rate based on live prices
        if (data['HBAR/USD']) {
          setSwapRate(data['HBAR/USD'].price);
        }
      }
    } catch (error) {
      // Mock prices for demo
      setLivePrices({
        'HBAR/USD': { price: 0.0523, priceChangePercent: 2.3 },
        'BTC/USD': { price: 43250, priceChangePercent: -1.2 },
        'ETH/USD': { price: 2650, priceChangePercent: 0.8 },
        'USDC/USD': { price: 1.00, priceChangePercent: 0.0 }
      });
    }
  };

  const calculateSwap = () => {
    if (!fromAmount || isNaN(fromAmount)) {
      setToAmount('');
      setPriceImpact(0);
      return;
    }

    const amount = parseFloat(fromAmount);
    let rate = swapRate;
    
    // Adjust rate based on token pair
    if (fromToken.symbol === 'FARM001' && toToken.symbol === 'HBAR') {
      rate = 0.00523; // 1 FARM001 = 0.00523 HBAR
    } else if (fromToken.symbol === 'HBAR' && toToken.symbol === 'FARM001') {
      rate = 191.2; // 1 HBAR = 191.2 FARM001
    }

    // Calculate price impact based on amount
    const impact = Math.min((amount / 10000) * 100, 15); // Max 15% impact
    const adjustedRate = rate * (1 - impact / 100);
    
    const outputAmount = amount * adjustedRate;
    setToAmount(outputAmount.toFixed(6));
    setPriceImpact(impact);
  };

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleExecuteSwap = async () => {
    if (!fromAmount || !toAmount) return;
    
    setIsLoading(true);
    
    try {
      // Simulate swap execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const swapResult = {
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        fromAmount: parseFloat(fromAmount),
        toAmount: parseFloat(toAmount),
        priceImpact,
        txHash: `0x${Math.random().toString(16).substring(2, 10)}`,
        timestamp: new Date().toISOString()
      };
      
      if (onSwapComplete) {
        onSwapComplete(swapResult);
      }
      
      // Reset form
      setFromAmount('');
      setToAmount('');
      setPriceImpact(0);
      
    } catch (error) {
      console.error('Swap failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTokenBySymbol = (symbol) => {
    return tokens.find(t => t.symbol === symbol) || tokens[0];
  };

  const canExecuteSwap = () => {
    return fromAmount && 
           toAmount && 
           parseFloat(fromAmount) > 0 && 
           parseFloat(fromAmount) <= fromToken.balance &&
           !isLoading;
  };

  const getAlertType = () => {
    if (priceImpact > 10) return 'error';
    if (priceImpact > 5) return 'warning';
    return 'info';
  };

  return (
    <Container>
      <LivePriceDisplay>
        <LivePriceHeader>
          <LivePriceTitle>
            <TrendingUp size={20} />
            Live Market Prices
          </LivePriceTitle>
        </LivePriceHeader>
        
        <PriceGrid>
          {Object.entries(livePrices).slice(0, 4).map(([pair, data]) => (
            <PriceItem key={pair}>
              <PriceSymbol>{pair}</PriceSymbol>
              <PriceAmount>
                ${typeof data.price === 'number' ? 
                  data.price.toFixed(data.price < 1 ? 4 : 2) : 
                  data.price}
              </PriceAmount>
              <PriceChange positive={data.priceChangePercent > 0}>
                {data.priceChangePercent > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(data.priceChangePercent).toFixed(1)}%
              </PriceChange>
            </PriceItem>
          ))}
        </PriceGrid>
      </LivePriceDisplay>

      <SwapCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SwapHeader>
          <SwapTitle>
            <ArrowUpDown size={24} />
            Token Swap
          </SwapTitle>
          <RefreshButton onClick={loadLivePrices}>
            <RefreshCw size={16} />
          </RefreshButton>
        </SwapHeader>

        <TokenInput>
          <TokenHeader>
            <TokenLabel>From</TokenLabel>
            <TokenBalance>Balance: {fromToken.balance.toLocaleString()}</TokenBalance>
          </TokenHeader>
          <TokenRow>
            <TokenSelect>
              <TokenIcon color={getTokenBySymbol(fromToken.symbol).color}>
                {fromToken.symbol.substring(0, 2)}
              </TokenIcon>
              <TokenInfo>
                <TokenSymbol>{fromToken.symbol}</TokenSymbol>
                <TokenName>{fromToken.name}</TokenName>
              </TokenInfo>
            </TokenSelect>
            <AmountInput
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
            />
          </TokenRow>
        </TokenInput>

        <SwapButton>
          <SwapIcon
            onClick={handleSwapTokens}
            whileHover={{ rotate: 180 }}
            whileTap={{ scale: 0.9 }}
          >
            <ArrowUpDown size={20} />
          </SwapIcon>
        </SwapButton>

        <TokenInput>
          <TokenHeader>
            <TokenLabel>To</TokenLabel>
            <TokenBalance>Balance: {toToken.balance.toLocaleString()}</TokenBalance>
          </TokenHeader>
          <TokenRow>
            <TokenSelect>
              <TokenIcon color={getTokenBySymbol(toToken.symbol).color}>
                {toToken.symbol.substring(0, 2)}
              </TokenIcon>
              <TokenInfo>
                <TokenSymbol>{toToken.symbol}</TokenSymbol>
                <TokenName>{toToken.name}</TokenName>
              </TokenInfo>
            </TokenSelect>
            <AmountInput
              type="number"
              placeholder="0.0"
              value={toAmount}
              readOnly
            />
          </TokenRow>
        </TokenInput>

        {fromAmount && toAmount && (
          <PriceInfo>
            <PriceRow>
              <PriceLabel>
                <DollarSign size={14} />
                Exchange Rate
              </PriceLabel>
              <PriceValue>
                1 {fromToken.symbol} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken.symbol}
              </PriceValue>
            </PriceRow>
            <PriceRow>
              <PriceLabel>
                <Info size={14} />
                Price Impact
              </PriceLabel>
              <PriceValue style={{ color: priceImpact > 5 ? '#ef4444' : '#10b981' }}>
                {priceImpact.toFixed(2)}%
              </PriceValue>
            </PriceRow>
            <PriceRow>
              <PriceLabel>Slippage Tolerance</PriceLabel>
              <PriceValue>{slippage}%</PriceValue>
            </PriceRow>
          </PriceInfo>
        )}

        {priceImpact > 3 && (
          <AlertBox type={getAlertType()}>
            <AlertTriangle size={16} />
            <AlertText type={getAlertType()}>
              {priceImpact > 10 ? 
                'High price impact! Consider reducing swap amount.' :
                'Moderate price impact detected. Proceed with caution.'
              }
            </AlertText>
          </AlertBox>
        )}

        <ExecuteButton
          onClick={handleExecuteSwap}
          disabled={!canExecuteSwap()}
          whileHover={{ scale: canExecuteSwap() ? 1.02 : 1 }}
          whileTap={{ scale: canExecuteSwap() ? 0.98 : 1 }}
        >
          {isLoading ? (
            <>
              <RefreshCw size={20} className="animate-spin" />
              Executing Swap...
            </>
          ) : (
            <>
              <Zap size={20} />
              {canExecuteSwap() ? 'Execute Swap' : 'Enter Amount'}
            </>
          )}
        </ExecuteButton>
      </SwapCard>
    </Container>
  );
};

export default AMMSwapInterface;
