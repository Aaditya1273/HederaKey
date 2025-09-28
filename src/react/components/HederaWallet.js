import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  Wallet, 
  Send, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Copy,
  TrendingUp,
  Coins,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const BalanceCard = styled(motion.div)`
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  padding: 30px;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  }
`;

const BalanceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const BalanceTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  opacity: 0.9;
  margin: 0;
`;

const BalanceActions = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button`
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const BalanceAmount = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const BalanceLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-top: 20px;
`;

const QuickActionButton = styled(motion.button)`
  padding: 15px 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
`;

const TokensList = styled.div`
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
`;

const TokensHeader = styled.div`
  padding: 20px;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  justify-content: between;
  align-items: center;
`;

const TokenItem = styled.div`
  padding: 15px 20px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: #f8fafc;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const TokenInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TokenName = styled.div`
  font-weight: 600;
  color: #1e293b;
`;

const TokenSymbol = styled.div`
  font-size: 0.875rem;
  color: #64748b;
`;

const TokenBalance = styled.div`
  font-weight: 600;
  color: #1e293b;
  text-align: right;
`;

const SendForm = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #e2e8f0;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(79, 70, 229, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 20px;
`;

const StatCard = styled.div`
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
`;

const HederaWallet = ({ account, balance, tokens, connected, onTransaction }) => {
  const [showBalance, setShowBalance] = useState(true);
  const [showSendForm, setShowSendForm] = useState(false);
  const [sendData, setSendData] = useState({
    destination: '',
    amount: ''
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalTokens: 0,
    accountAge: 0
  });

  useEffect(() => {
    if (connected && account) {
      loadAccountStats();
    }
  }, [connected, account]);

  const loadAccountStats = async () => {
    try {
      const response = await fetch(`/hedera/account/${account.accountId}`);
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalTransactions: data.transactions?.count || 0,
          totalTokens: tokens?.length || 0,
          accountAge: calculateAccountAge(data.createdTimestamp)
        });
      }
    } catch (error) {
      console.error('Error loading account stats:', error);
    }
  };

  const calculateAccountAge = (timestamp) => {
    if (!timestamp) return 0;
    const created = new Date(parseInt(timestamp) * 1000);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const copyAccountId = () => {
    if (account?.accountId) {
      navigator.clipboard.writeText(account.accountId);
      toast.success('Account ID copied to clipboard');
    }
  };

  const refreshBalance = async () => {
    if (!account) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/getBalance/${account.accountId}`);
      if (response.ok) {
        const data = await response.json();
        toast.success('Balance refreshed');
        // The parent component should handle the balance update
      } else {
        throw new Error('Failed to refresh balance');
      }
    } catch (error) {
      toast.error('Failed to refresh balance');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!sendData.destination || !sendData.amount) {
      toast.error('Please fill in all fields');
      return;
    }

    if (parseFloat(sendData.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      
      await onTransaction({
        type: 'transfer',
        destination: sendData.destination,
        amount: sendData.amount
      });
      
      setSendData({ destination: '', amount: '' });
      setShowSendForm(false);
      
    } catch (error) {
      toast.error('Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance) => {
    if (!balance || balance === '0') return '0.00';
    
    // Convert from tinybars to HBAR
    const hbarBalance = parseFloat(balance) / 100000000;
    return hbarBalance.toFixed(2);
  };

  if (!connected) {
    return (
      <Container>
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#64748b',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '2px dashed #cbd5e1'
        }}>
          <Wallet size={48} style={{ marginBottom: '20px', color: '#4f46e5' }} />
          <h3>No Wallet Connected</h3>
          <p>Connect your Hedera wallet to view balance and manage transactions.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <BalanceCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <BalanceHeader>
          <BalanceTitle>Hedera Account Balance</BalanceTitle>
          <BalanceActions>
            <ActionButton onClick={() => setShowBalance(!showBalance)}>
              {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
            </ActionButton>
            <ActionButton onClick={copyAccountId}>
              <Copy size={16} />
            </ActionButton>
            <ActionButton onClick={refreshBalance} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </ActionButton>
          </BalanceActions>
        </BalanceHeader>
        
        <BalanceAmount>
          {showBalance ? `${formatBalance(balance)}` : '••••••'}
          <span style={{ fontSize: '1.5rem', opacity: 0.8 }}>ℏ</span>
        </BalanceAmount>
        
        <BalanceLabel>
          Account: {account?.accountId}
        </BalanceLabel>
        
        <QuickActions>
          <QuickActionButton
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowSendForm(!showSendForm)}
          >
            <Send size={18} />
            Send HBAR
          </QuickActionButton>
          
          <QuickActionButton
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.open(`https://hashscan.io/testnet/account/${account.accountId}`, '_blank')}
          >
            <TrendingUp size={18} />
            View Explorer
          </QuickActionButton>
        </QuickActions>
      </BalanceCard>

      {showSendForm && (
        <SendForm>
          <h4 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Send size={20} />
            Send HBAR
          </h4>
          
          <form onSubmit={handleSend}>
            <FormGroup>
              <Label>Destination Account ID</Label>
              <Input
                type="text"
                placeholder="0.0.123456"
                value={sendData.destination}
                onChange={(e) => setSendData(prev => ({ ...prev, destination: e.target.value }))}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Amount (HBAR)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={sendData.amount}
                onChange={(e) => setSendData(prev => ({ ...prev, amount: e.target.value }))}
              />
            </FormGroup>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button type="submit" disabled={loading}>
                <Send size={16} />
                {loading ? 'Sending...' : 'Send Transaction'}
              </Button>
              <Button 
                type="button" 
                onClick={() => setShowSendForm(false)}
                style={{ background: '#64748b' }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </SendForm>
      )}

      <StatsGrid>
        <StatCard>
          <StatValue>{stats.totalTransactions}</StatValue>
          <StatLabel>Total Transactions</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>{stats.totalTokens}</StatValue>
          <StatLabel>Token Holdings</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>{stats.accountAge}</StatValue>
          <StatLabel>Days Active</StatLabel>
        </StatCard>
      </StatsGrid>

      {tokens && tokens.length > 0 && (
        <TokensList>
          <TokensHeader>
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Coins size={20} />
              Token Holdings
            </h4>
          </TokensHeader>
          
          {tokens.map((token, index) => (
            <TokenItem key={index}>
              <TokenInfo>
                <TokenName>{token.name || `Token ${token.token_id}`}</TokenName>
                <TokenSymbol>{token.symbol || token.token_id}</TokenSymbol>
              </TokenInfo>
              <TokenBalance>{token.balance || '0'}</TokenBalance>
            </TokenItem>
          ))}
        </TokensList>
      )}
    </Container>
  );
};

export default HederaWallet;
