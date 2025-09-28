import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  TrendingUp,
  Eye,
  RefreshCw,
  BarChart3
} from 'lucide-react';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;
  padding: 20px;
  background: #f8fafc;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const LiveIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: ${props => props.live ? 'linear-gradient(135deg, #10b981, #059669)' : '#64748b'};
  color: white;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
`;

const LiveDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
  animation: ${props => props.live ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
`;

const MetricCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 2px solid #e2e8f0;
  position: relative;
  overflow: hidden;
`;

const MetricIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.color || 'linear-gradient(135deg, #4f46e5, #7c3aed)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 15px;
`;

const MetricValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 5px;
`;

const MetricLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 10px;
`;

const MetricTrend = styled.div`
  font-size: 0.75rem;
  color: ${props => props.positive ? '#10b981' : props.negative ? '#ef4444' : '#64748b'};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 25px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const ChartSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 2px solid #e2e8f0;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LiveFeedSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 2px solid #e2e8f0;
  max-height: 600px;
  overflow-y: auto;
`;

const FeedItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  background: ${props => {
    switch (props.type) {
      case 'fraud': return '#fef2f2';
      case 'approved': return '#f0fdf4';
      case 'blocked': return '#fef2f2';
      case 'review': return '#fffbeb';
      default: return '#f8fafc';
    }
  }};
  border-left: 4px solid ${props => {
    switch (props.type) {
      case 'fraud': return '#ef4444';
      case 'approved': return '#10b981';
      case 'blocked': return '#ef4444';
      case 'review': return '#f59e0b';
      default: return '#64748b';
    }
  }};
`;

const FeedIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${props => {
    switch (props.type) {
      case 'fraud': return 'linear-gradient(135deg, #ef4444, #dc2626)';
      case 'approved': return 'linear-gradient(135deg, #10b981, #059669)';
      case 'blocked': return 'linear-gradient(135deg, #ef4444, #dc2626)';
      case 'review': return 'linear-gradient(135deg, #f59e0b, #d97706)';
      default: return 'linear-gradient(135deg, #64748b, #475569)';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const FeedContent = styled.div`
  flex: 1;
`;

const FeedTitle = styled.div`
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
`;

const FeedDetails = styled.div`
  font-size: 0.875rem;
  color: #64748b;
`;

const FeedTime = styled.div`
  font-size: 0.75rem;
  color: #64748b;
`;

const RiskChart = styled.div`
  height: 300px;
  background: #f8fafc;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 0.875rem;
  margin-top: 20px;
`;

const PerformanceGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
`;

const PerformanceCard = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #e2e8f0;
`;

const PerformanceLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 8px;
`;

const PerformanceValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
`;

const ControlPanel = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #64748b;
  font-weight: 600;
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

const AIDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [liveFeed, setLiveFeed] = useState([]);
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      if (isLive) {
        loadDashboardData();
        generateMockFeedItem();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  const loadDashboardData = async () => {
    try {
      // Load AI fraud detection metrics
      const metricsResponse = await fetch('/ai/fraud-detection/metrics');
      const pipelineResponse = await fetch('/ai/nfc-pipeline/metrics');
      
      if (metricsResponse.ok && pipelineResponse.ok) {
        const fraudMetrics = await metricsResponse.json();
        const pipelineMetrics = await pipelineResponse.json();
        
        setMetrics({
          ...fraudMetrics,
          ...pipelineMetrics,
          lastUpdated: new Date().toISOString()
        });
      } else {
        // Mock data for development
        setMetrics({
          totalPredictions: 15847,
          correctPredictions: 15123,
          accuracy: 0.954,
          precision: 0.923,
          recall: 0.967,
          f1Score: 0.944,
          avgLatency: 287,
          transactionsProcessed: 15847,
          fraudDetected: 234,
          autoApproved: 14892,
          autoBlocked: 189,
          manualReview: 532,
          fraudRate: 0.0148,
          autoProcessingRate: 0.951,
          activePipelines: 12,
          successRate: 0.987,
          lastUpdated: new Date().toISOString()
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const generateMockFeedItem = () => {
    const types = ['approved', 'blocked', 'review', 'fraud'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const newItem = {
      id: Date.now(),
      type,
      title: getFeedTitle(type),
      details: getFeedDetails(type),
      time: new Date().toLocaleTimeString(),
      timestamp: new Date().toISOString()
    };

    setLiveFeed(prev => [newItem, ...prev.slice(0, 19)]); // Keep last 20 items
  };

  const getFeedTitle = (type) => {
    const titles = {
      approved: 'Transaction Auto-Approved',
      blocked: 'Suspicious Transaction Blocked',
      review: 'Transaction Flagged for Review',
      fraud: 'Fraud Pattern Detected'
    };
    return titles[type];
  };

  const getFeedDetails = (type) => {
    const details = {
      approved: `NFC verified • Risk: 0.${Math.floor(Math.random() * 3)}${Math.floor(Math.random() * 10)} • Amount: $${Math.floor(Math.random() * 500) + 50}`,
      blocked: `High velocity • Risk: 0.${Math.floor(Math.random() * 3) + 7}${Math.floor(Math.random() * 10)} • Location anomaly`,
      review: `Medium risk • Amount: $${Math.floor(Math.random() * 5000) + 1000} • Manual verification needed`,
      fraud: `Pattern match • Risk: 0.${Math.floor(Math.random() * 2) + 8}${Math.floor(Math.random() * 10)} • Multiple red flags`
    };
    return details[type];
  };

  const getFeedIcon = (type) => {
    const icons = {
      approved: CheckCircle,
      blocked: XCircle,
      review: Clock,
      fraud: AlertTriangle
    };
    return icons[type];
  };

  const toggleLiveFeed = () => {
    setIsLive(!isLive);
  };

  if (loading) {
    return (
      <Container>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #4f46e5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#64748b' }}>Loading AI Dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <Brain size={32} />
          AI Fraud Detection Dashboard
        </Title>
        
        <ControlPanel>
          <LiveIndicator live={isLive}>
            <LiveDot live={isLive} />
            {isLive ? 'LIVE' : 'PAUSED'}
          </LiveIndicator>
          
          <Button onClick={toggleLiveFeed}>
            <Eye size={16} />
            {isLive ? 'Pause' : 'Resume'}
          </Button>
          
          <Button onClick={loadDashboardData}>
            <RefreshCw size={16} />
            Refresh
          </Button>
        </ControlPanel>
      </Header>

      <MetricsGrid>
        <MetricCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <MetricIcon color="linear-gradient(135deg, #10b981, #059669)">
            <CheckCircle size={24} />
          </MetricIcon>
          <MetricValue>{metrics?.transactionsProcessed?.toLocaleString() || '0'}</MetricValue>
          <MetricLabel>Transactions Processed</MetricLabel>
          <MetricTrend positive>
            <TrendingUp size={12} />
            {((metrics?.autoProcessingRate || 0) * 100).toFixed(1)}% auto-processed
          </MetricTrend>
        </MetricCard>

        <MetricCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <MetricIcon color="linear-gradient(135deg, #ef4444, #dc2626)">
            <Shield size={24} />
          </MetricIcon>
          <MetricValue>{metrics?.fraudDetected || '0'}</MetricValue>
          <MetricLabel>Fraud Cases Detected</MetricLabel>
          <MetricTrend>
            <AlertTriangle size={12} />
            {((metrics?.fraudRate || 0) * 100).toFixed(2)}% fraud rate
          </MetricTrend>
        </MetricCard>

        <MetricCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <MetricIcon color="linear-gradient(135deg, #3b82f6, #1d4ed8)">
            <Zap size={24} />
          </MetricIcon>
          <MetricValue>{metrics?.avgLatency || '0'}ms</MetricValue>
          <MetricLabel>Average Latency</MetricLabel>
          <MetricTrend positive={metrics?.avgLatency < 500}>
            <Activity size={12} />
            {metrics?.avgLatency < 500 ? 'Within target' : 'Above target'}
          </MetricTrend>
        </MetricCard>

        <MetricCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <MetricIcon color="linear-gradient(135deg, #8b5cf6, #7c3aed)">
            <Brain size={24} />
          </MetricIcon>
          <MetricValue>{((metrics?.accuracy || 0) * 100).toFixed(1)}%</MetricValue>
          <MetricLabel>AI Model Accuracy</MetricLabel>
          <MetricTrend positive={metrics?.accuracy > 0.9}>
            <BarChart3 size={12} />
            F1: {((metrics?.f1Score || 0) * 100).toFixed(1)}%
          </MetricTrend>
        </MetricCard>
      </MetricsGrid>

      <MainContent>
        <ChartSection>
          <SectionTitle>
            <BarChart3 size={20} />
            Real-Time Analytics
          </SectionTitle>
          
          <PerformanceGrid>
            <PerformanceCard>
              <PerformanceLabel>Auto Approved</PerformanceLabel>
              <PerformanceValue style={{ color: '#10b981' }}>
                {metrics?.autoApproved?.toLocaleString() || '0'}
              </PerformanceValue>
            </PerformanceCard>
            
            <PerformanceCard>
              <PerformanceLabel>Auto Blocked</PerformanceLabel>
              <PerformanceValue style={{ color: '#ef4444' }}>
                {metrics?.autoBlocked?.toLocaleString() || '0'}
              </PerformanceValue>
            </PerformanceCard>
            
            <PerformanceCard>
              <PerformanceLabel>Manual Review</PerformanceLabel>
              <PerformanceValue style={{ color: '#f59e0b' }}>
                {metrics?.manualReview?.toLocaleString() || '0'}
              </PerformanceValue>
            </PerformanceCard>
            
            <PerformanceCard>
              <PerformanceLabel>Active Pipelines</PerformanceLabel>
              <PerformanceValue style={{ color: '#3b82f6' }}>
                {metrics?.activePipelines || '0'}
              </PerformanceValue>
            </PerformanceCard>
          </PerformanceGrid>

          <RiskChart>
            Real-time risk distribution chart would be rendered here
            <br />
            (Integration with Chart.js or D3.js for production)
          </RiskChart>
        </ChartSection>

        <LiveFeedSection>
          <SectionTitle>
            <Activity size={20} />
            Live Detection Feed
          </SectionTitle>
          
          {liveFeed.map((item, index) => {
            const IconComponent = getFeedIcon(item.type);
            
            return (
              <FeedItem
                key={item.id}
                type={item.type}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <FeedIcon type={item.type}>
                  <IconComponent size={16} />
                </FeedIcon>
                
                <FeedContent>
                  <FeedTitle>{item.title}</FeedTitle>
                  <FeedDetails>{item.details}</FeedDetails>
                </FeedContent>
                
                <FeedTime>{item.time}</FeedTime>
              </FeedItem>
            );
          })}
          
          {liveFeed.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#64748b' 
            }}>
              <Activity size={32} style={{ marginBottom: '10px' }} />
              <p>Waiting for fraud detection events...</p>
            </div>
          )}
        </LiveFeedSection>
      </MainContent>
    </Container>
  );
};

export default AIDashboard;
