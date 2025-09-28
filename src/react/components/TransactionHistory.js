import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ExternalLink,
  Filter,
  Calendar,
  Coins,
  Send,
  Plus,
  RefreshCw
} from 'lucide-react';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Controls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const FilterButton = styled.button`
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #64748b;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #4f46e5;
    color: #4f46e5;
  }
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
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #4f46e5;
    color: #4f46e5;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FilterPanel = styled(motion.div)`
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FilterLabel = styled.label`
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
`;

const TransactionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TransactionItem = styled(motion.div)`
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    border-color: #4f46e5;
    box-shadow: 0 5px 15px rgba(79, 70, 229, 0.1);
  }
`;

const TransactionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const TransactionType = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #1e293b;
`;

const TypeIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${props => {
    switch (props.type) {
      case 'send': return 'linear-gradient(135deg, #ef4444, #dc2626)';
      case 'receive': return 'linear-gradient(135deg, #10b981, #059669)';
      case 'mint': return 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
      case 'create': return 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
      default: return 'linear-gradient(135deg, #64748b, #475569)';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const TransactionStatus = styled.div`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    switch (props.status) {
      case 'SUCCESS': return 'linear-gradient(135deg, #10b981, #059669)';
      case 'PENDING': return 'linear-gradient(135deg, #f59e0b, #d97706)';
      case 'FAILED': return 'linear-gradient(135deg, #ef4444, #dc2626)';
      default: return 'linear-gradient(135deg, #64748b, #475569)';
    }
  }};
  color: white;
`;

const TransactionDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
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
  font-family: ${props => props.mono ? "'Courier New', monospace" : 'inherit'};
  font-size: ${props => props.mono ? '0.875rem' : '1rem'};
`;

const TransactionFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #f1f5f9;
`;

const Timestamp = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ExplorerLink = styled.button`
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #4f46e5;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  
  &:hover {
    background: #4f46e5;
    color: white;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #64748b;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px;
  color: #64748b;
`;

const Spinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const TransactionHistory = ({ transactions, account, connected }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    timeRange: 'all'
  });

  useEffect(() => {
    if (transactions) {
      applyFilters();
    }
  }, [transactions, filters]);

  const applyFilters = () => {
    let filtered = [...(transactions || [])];

    if (filters.type !== 'all') {
      filtered = filtered.filter(tx => tx.type === filters.type);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(tx => tx.status === filters.status);
    }

    if (filters.timeRange !== 'all') {
      const now = new Date();
      const timeRanges = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      
      const range = timeRanges[filters.timeRange];
      if (range) {
        filtered = filtered.filter(tx => {
          const txTime = new Date(tx.timestamp);
          return now - txTime <= range;
        });
      }
    }

    setFilteredTransactions(filtered);
  };

  const refreshTransactions = async () => {
    if (!account) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/hedera/account/${account.accountId}`);
      if (response.ok) {
        const data = await response.json();
        // Parent component should handle the transaction update
      }
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'send': return ArrowUpRight;
      case 'receive': return ArrowDownLeft;
      case 'mint': return Plus;
      case 'create': return Coins;
      default: return Send;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString();
  };

  const openInExplorer = (txId) => {
    if (txId) {
      window.open(`https://hashscan.io/testnet/transaction/${txId}`, '_blank');
    }
  };

  if (!connected) {
    return (
      <Container>
        <EmptyState>
          <History size={48} style={{ marginBottom: '20px', color: '#cbd5e1' }} />
          <h3>No Wallet Connected</h3>
          <p>Connect your wallet to view transaction history.</p>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <History size={24} />
          Transaction History
        </Title>
        
        <Controls>
          <FilterButton onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} />
            Filters
          </FilterButton>
          
          <RefreshButton onClick={refreshTransactions} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </RefreshButton>
        </Controls>
      </Header>

      <AnimatePresence>
        {showFilters && (
          <FilterPanel
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <FilterGrid>
              <FilterGroup>
                <FilterLabel>Transaction Type</FilterLabel>
                <FilterSelect
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="all">All Types</option>
                  <option value="send">Send</option>
                  <option value="receive">Receive</option>
                  <option value="mint">Mint Token</option>
                  <option value="create">Create Account</option>
                </FilterSelect>
              </FilterGroup>
              
              <FilterGroup>
                <FilterLabel>Status</FilterLabel>
                <FilterSelect
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="all">All Status</option>
                  <option value="SUCCESS">Success</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </FilterSelect>
              </FilterGroup>
              
              <FilterGroup>
                <FilterLabel>Time Range</FilterLabel>
                <FilterSelect
                  value={filters.timeRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
                >
                  <option value="all">All Time</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </FilterSelect>
              </FilterGroup>
            </FilterGrid>
          </FilterPanel>
        )}
      </AnimatePresence>

      {loading && (
        <LoadingState>
          <Spinner />
          <p>Loading transactions...</p>
        </LoadingState>
      )}

      {!loading && (!filteredTransactions || filteredTransactions.length === 0) && (
        <EmptyState>
          <History size={48} style={{ marginBottom: '20px', color: '#cbd5e1' }} />
          <h3>No Transactions Found</h3>
          <p>
            {filters.type !== 'all' || filters.status !== 'all' || filters.timeRange !== 'all'
              ? 'No transactions match your current filters.'
              : 'Start using your wallet to see transaction history here.'}
          </p>
        </EmptyState>
      )}

      {!loading && filteredTransactions && filteredTransactions.length > 0 && (
        <TransactionList>
          {filteredTransactions.map((tx, index) => {
            const IconComponent = getTransactionIcon(tx.type);
            
            return (
              <TransactionItem
                key={tx.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => openInExplorer(tx.txHash || tx.transactionId)}
              >
                <TransactionHeader>
                  <TransactionType>
                    <TypeIcon type={tx.type}>
                      <IconComponent size={16} />
                    </TypeIcon>
                    {tx.type?.charAt(0).toUpperCase() + tx.type?.slice(1) || 'Transaction'}
                  </TransactionType>
                  
                  <TransactionStatus status={tx.status || 'SUCCESS'}>
                    {tx.status || 'SUCCESS'}
                  </TransactionStatus>
                </TransactionHeader>

                <TransactionDetails>
                  {tx.amount && (
                    <DetailItem>
                      <DetailLabel>Amount</DetailLabel>
                      <DetailValue>{tx.amount} ℏ</DetailValue>
                    </DetailItem>
                  )}
                  
                  {tx.from && (
                    <DetailItem>
                      <DetailLabel>From</DetailLabel>
                      <DetailValue mono>{tx.from}</DetailValue>
                    </DetailItem>
                  )}
                  
                  {tx.to && (
                    <DetailItem>
                      <DetailLabel>To</DetailLabel>
                      <DetailValue mono>{tx.to}</DetailValue>
                    </DetailItem>
                  )}
                  
                  {tx.fee && (
                    <DetailItem>
                      <DetailLabel>Fee</DetailLabel>
                      <DetailValue>{tx.fee} ℏ</DetailValue>
                    </DetailItem>
                  )}
                </TransactionDetails>

                <TransactionFooter>
                  <Timestamp>
                    <Calendar size={14} />
                    {formatTimestamp(tx.timestamp || tx.consensusTimestamp)}
                  </Timestamp>
                  
                  <ExplorerLink onClick={(e) => {
                    e.stopPropagation();
                    openInExplorer(tx.txHash || tx.transactionId);
                  }}>
                    <ExternalLink size={14} />
                    Explorer
                  </ExplorerLink>
                </TransactionFooter>
              </TransactionItem>
            );
          })}
        </TransactionList>
      )}
    </Container>
  );
};

export default TransactionHistory;
