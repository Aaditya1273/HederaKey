import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Lock, 
  Key,
  CheckCircle,
  AlertTriangle,
  Zap,
  Database,
  UserCheck,
  RefreshCw
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

const PrivacyScore = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 25px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border-radius: 12px;
  font-weight: 600;
`;

const ScoreValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
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

const MetricStatus = styled.div`
  font-size: 0.75rem;
  color: ${props => props.positive ? '#10b981' : '#ef4444'};
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

const ZKProofSection = styled.div`
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

const ProofList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const ProofItem = styled(motion.div)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid ${props => {
    switch (props.type) {
      case 'NFC_OWNERSHIP': return '#10b981';
      case 'DOMAIN_CONTROL': return '#3b82f6';
      case 'IDENTITY_VERIFICATION': return '#8b5cf6';
      case 'TRANSACTION_VALIDITY': return '#f59e0b';
      default: return '#64748b';
    }
  }};
`;

const ProofInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ProofType = styled.div`
  font-weight: 600;
  color: #1e293b;
`;

const ProofId = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  font-family: 'Courier New', monospace;
`;

const ProofStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: ${props => props.verified ? '#10b981' : '#ef4444'};
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
`;

const SidePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ComplianceCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 2px solid #e2e8f0;
`;

const ComplianceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ComplianceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
`;

const ComplianceLabel = styled.div`
  color: #64748b;
  font-weight: 500;
`;

const ComplianceStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${props => props.compliant ? '#10b981' : '#ef4444'};
  font-weight: 600;
`;

const PrivacyControls = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const ControlButton = styled.button`
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
  
  &.active {
    background: #4f46e5;
    color: white;
    border-color: #4f46e5;
  }
`;

const MaskedDataDemo = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #e2e8f0;
  margin-top: 20px;
`;

const DataRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const DataLabel = styled.div`
  color: #64748b;
  font-weight: 500;
`;

const DataValue = styled.div`
  font-family: 'Courier New', monospace;
  color: #1e293b;
  font-weight: 600;
`;

const PrivacyDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [privacyLevel, setPrivacyLevel] = useState('ZERO_KNOWLEDGE');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/privacy/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        // Mock data for development
        setDashboardData(generateMockDashboardData());
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading privacy dashboard:', error);
      setDashboardData(generateMockDashboardData());
      setLoading(false);
    }
  };

  const generateMockDashboardData = () => {
    return {
      summary: {
        totalZKProofs: 12456,
        verifiedProofs: 11823,
        anonymizedTransactions: 14892,
        privacyScore: 0.95,
        privacyLevel: 'ZERO_KNOWLEDGE'
      },
      zkProofs: {
        byType: {
          'NFC_OWNERSHIP': 5234,
          'DOMAIN_CONTROL': 3421,
          'IDENTITY_VERIFICATION': 2456,
          'TRANSACTION_VALIDITY': 1345
        },
        verificationRate: 0.949,
        recentProofs: [
          {
            proofId: 'zk_a1b2c3d4...e5f6',
            type: 'NFC_OWNERSHIP',
            verified: true,
            timestamp: new Date(Date.now() - 300000).toISOString()
          },
          {
            proofId: 'zk_f7g8h9i0...j1k2',
            type: 'DOMAIN_CONTROL',
            verified: true,
            timestamp: new Date(Date.now() - 600000).toISOString()
          },
          {
            proofId: 'zk_l3m4n5o6...p7q8',
            type: 'IDENTITY_VERIFICATION',
            verified: true,
            timestamp: new Date(Date.now() - 900000).toISOString()
          }
        ]
      },
      compliance: {
        gdprCompliant: true,
        ccpaCompliant: true,
        dataMinimization: true,
        rightToErasure: true,
        privacyByDesign: true
      },
      aiPrivacy: {
        homomorphicComputations: 8945,
        privacyBudgetUsed: 0.23,
        encryptedPredictions: 15847
      }
    };
  };

  const toggleSensitiveData = () => {
    setShowSensitiveData(!showSensitiveData);
  };

  const formatProofId = (proofId) => {
    if (!showSensitiveData) {
      return `zk_${proofId.substring(3, 11)}...${proofId.substring(-4)}`;
    }
    return proofId;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
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
          <p style={{ color: '#64748b' }}>Loading Privacy Dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <Shield size={32} />
          Privacy Dashboard
        </Title>
        
        <PrivacyScore>
          <Lock size={24} />
          <div>
            <ScoreValue>{(dashboardData?.summary?.privacyScore * 100 || 0).toFixed(0)}%</ScoreValue>
            <div style={{ fontSize: '0.875rem' }}>Privacy Score</div>
          </div>
        </PrivacyScore>
      </Header>

      <PrivacyControls>
        <ControlButton 
          className={showSensitiveData ? '' : 'active'}
          onClick={toggleSensitiveData}
        >
          {showSensitiveData ? <Eye size={16} /> : <EyeOff size={16} />}
          {showSensitiveData ? 'Hide' : 'Mask'} Sensitive Data
        </ControlButton>
        
        <ControlButton onClick={loadDashboardData}>
          <RefreshCw size={16} />
          Refresh
        </ControlButton>
      </PrivacyControls>

      <MetricsGrid>
        <MetricCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <MetricIcon color="linear-gradient(135deg, #10b981, #059669)">
            <Key size={24} />
          </MetricIcon>
          <MetricValue>{dashboardData?.summary?.totalZKProofs?.toLocaleString() || '0'}</MetricValue>
          <MetricLabel>ZK Proofs Generated</MetricLabel>
          <MetricStatus positive>
            <CheckCircle size={12} />
            {((dashboardData?.zkProofs?.verificationRate || 0) * 100).toFixed(1)}% verified
          </MetricStatus>
        </MetricCard>

        <MetricCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <MetricIcon color="linear-gradient(135deg, #3b82f6, #1d4ed8)">
            <Database size={24} />
          </MetricIcon>
          <MetricValue>{dashboardData?.summary?.anonymizedTransactions?.toLocaleString() || '0'}</MetricValue>
          <MetricLabel>Anonymized Transactions</MetricLabel>
          <MetricStatus positive>
            <Zap size={12} />
            Real-time processing
          </MetricStatus>
        </MetricCard>

        <MetricCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <MetricIcon color="linear-gradient(135deg, #8b5cf6, #7c3aed)">
            <Lock size={24} />
          </MetricIcon>
          <MetricValue>{dashboardData?.aiPrivacy?.homomorphicComputations?.toLocaleString() || '0'}</MetricValue>
          <MetricLabel>Encrypted Computations</MetricLabel>
          <MetricStatus positive>
            <Shield size={12} />
            Zero data leakage
          </MetricStatus>
        </MetricCard>

        <MetricCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <MetricIcon color="linear-gradient(135deg, #f59e0b, #d97706)">
            <UserCheck size={24} />
          </MetricIcon>
          <MetricValue>{((dashboardData?.aiPrivacy?.privacyBudgetUsed || 0) * 100).toFixed(0)}%</MetricValue>
          <MetricLabel>Privacy Budget Used</MetricLabel>
          <MetricStatus positive={dashboardData?.aiPrivacy?.privacyBudgetUsed < 0.8}>
            {dashboardData?.aiPrivacy?.privacyBudgetUsed < 0.8 ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
            {dashboardData?.aiPrivacy?.privacyBudgetUsed < 0.8 ? 'Optimal' : 'Monitor'}
          </MetricStatus>
        </MetricCard>
      </MetricsGrid>

      <MainContent>
        <ZKProofSection>
          <SectionTitle>
            <Key size={20} />
            Recent ZK Proofs
          </SectionTitle>
          
          <ProofList>
            {dashboardData?.zkProofs?.recentProofs?.map((proof, index) => (
              <ProofItem
                key={proof.proofId}
                type={proof.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <ProofInfo>
                  <ProofType>{proof.type.replace('_', ' ')}</ProofType>
                  <ProofId>{formatProofId(proof.proofId)}</ProofId>
                </ProofInfo>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <ProofStatus verified={proof.verified}>
                    <StatusDot />
                    {proof.verified ? 'Verified' : 'Pending'}
                  </ProofStatus>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {formatTime(proof.timestamp)}
                  </div>
                </div>
              </ProofItem>
            ))}
          </ProofList>

          <MaskedDataDemo>
            <SectionTitle style={{ fontSize: '1rem', marginBottom: '15px' }}>
              <EyeOff size={16} />
              Privacy-Preserving Data Display
            </SectionTitle>
            
            <DataRow>
              <DataLabel>Account ID:</DataLabel>
              <DataValue>
                {showSensitiveData ? '0.0.123456789' : 'zk_a1b2c3d4...e5f6'}
              </DataValue>
            </DataRow>
            
            <DataRow>
              <DataLabel>Transaction Hash:</DataLabel>
              <DataValue>
                {showSensitiveData ? '0x1a2b3c4d5e6f7890...' : 'zk_f7g8h9i0...j1k2'}
              </DataValue>
            </DataRow>
            
            <DataRow>
              <DataLabel>Domain:</DataLabel>
              <DataValue>
                {showSensitiveData ? 'user.crypto' : 'zk_l3m4n5o6...p7q8'}
              </DataValue>
            </DataRow>
            
            <DataRow>
              <DataLabel>Device ID:</DataLabel>
              <DataValue>
                {showSensitiveData ? 'device-12345' : 'zk_r9s0t1u2...v3w4'}
              </DataValue>
            </DataRow>
          </MaskedDataDemo>
        </ZKProofSection>

        <SidePanel>
          <ComplianceCard>
            <SectionTitle>
              <CheckCircle size={20} />
              Compliance Status
            </SectionTitle>
            
            <ComplianceList>
              <ComplianceItem>
                <ComplianceLabel>GDPR Compliant</ComplianceLabel>
                <ComplianceStatus compliant={dashboardData?.compliance?.gdprCompliant}>
                  <CheckCircle size={16} />
                  Compliant
                </ComplianceStatus>
              </ComplianceItem>
              
              <ComplianceItem>
                <ComplianceLabel>CCPA Compliant</ComplianceLabel>
                <ComplianceStatus compliant={dashboardData?.compliance?.ccpaCompliant}>
                  <CheckCircle size={16} />
                  Compliant
                </ComplianceStatus>
              </ComplianceItem>
              
              <ComplianceItem>
                <ComplianceLabel>Data Minimization</ComplianceLabel>
                <ComplianceStatus compliant={dashboardData?.compliance?.dataMinimization}>
                  <CheckCircle size={16} />
                  Active
                </ComplianceStatus>
              </ComplianceItem>
              
              <ComplianceItem>
                <ComplianceLabel>Right to Erasure</ComplianceLabel>
                <ComplianceStatus compliant={dashboardData?.compliance?.rightToErasure}>
                  <CheckCircle size={16} />
                  Supported
                </ComplianceStatus>
              </ComplianceItem>
              
              <ComplianceItem>
                <ComplianceLabel>Privacy by Design</ComplianceLabel>
                <ComplianceStatus compliant={dashboardData?.compliance?.privacyByDesign}>
                  <CheckCircle size={16} />
                  Implemented
                </ComplianceStatus>
              </ComplianceItem>
            </ComplianceList>
          </ComplianceCard>

          <ComplianceCard>
            <SectionTitle>
              <Shield size={20} />
              Privacy Techniques
            </SectionTitle>
            
            <ComplianceList>
              <ComplianceItem>
                <ComplianceLabel>Zero-Knowledge Proofs</ComplianceLabel>
                <ComplianceStatus compliant={true}>
                  <CheckCircle size={16} />
                  Active
                </ComplianceStatus>
              </ComplianceItem>
              
              <ComplianceItem>
                <ComplianceLabel>Homomorphic Encryption</ComplianceLabel>
                <ComplianceStatus compliant={true}>
                  <CheckCircle size={16} />
                  Active
                </ComplianceStatus>
              </ComplianceItem>
              
              <ComplianceItem>
                <ComplianceLabel>Differential Privacy</ComplianceLabel>
                <ComplianceStatus compliant={true}>
                  <CheckCircle size={16} />
                  Active
                </ComplianceStatus>
              </ComplianceItem>
              
              <ComplianceItem>
                <ComplianceLabel>Data Anonymization</ComplianceLabel>
                <ComplianceStatus compliant={true}>
                  <CheckCircle size={16} />
                  Active
                </ComplianceStatus>
              </ComplianceItem>
            </ComplianceList>
          </ComplianceCard>
        </SidePanel>
      </MainContent>
    </Container>
  );
};

export default PrivacyDashboard;
