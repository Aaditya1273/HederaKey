import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Eye,
  FileText,
  Activity,
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
  margin-bottom: 20px;
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

const RefreshButton = styled.button`
  padding: 10px 20px;
  border: 2px solid #4f46e5;
  border-radius: 8px;
  background: white;
  color: #4f46e5;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    background: #4f46e5;
    color: white;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled(motion.div)`
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #4f46e5;
    box-shadow: 0 8px 25px rgba(79, 70, 229, 0.1);
  }
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.color || 'linear-gradient(135deg, #4f46e5, #7c3aed)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 10px;
`;

const StatTrend = styled.div`
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
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ActivitySection = styled.div`
  background: white;
  border-radius: 12px;
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

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid ${props => {
    switch (props.type) {
      case 'KYC_APPROVED': return '#10b981';
      case 'AML_FLAGGED': return '#ef4444';
      case 'NFC_VERIFICATION': return '#3b82f6';
      default: return '#64748b';
    }
  }};
`;

const ActivityIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${props => {
    switch (props.type) {
      case 'KYC_APPROVED': return 'linear-gradient(135deg, #10b981, #059669)';
      case 'AML_FLAGGED': return 'linear-gradient(135deg, #ef4444, #dc2626)';
      case 'NFC_VERIFICATION': return 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
      default: return 'linear-gradient(135deg, #64748b, #475569)';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const ActivityDetails = styled.div`
  flex: 1;
`;

const ActivityType = styled.div`
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
`;

const ActivityDID = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  font-family: 'Courier New', monospace;
`;

const ActivityTime = styled.div`
  font-size: 0.75rem;
  color: #64748b;
`;

const AlertsSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 2px solid #e2e8f0;
`;

const AlertsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const AlertItem = styled.div`
  padding: 15px;
  border-radius: 8px;
  border: 2px solid ${props => {
    switch (props.severity) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f59e0b';
      case 'MEDIUM': return '#3b82f6';
      default: return '#64748b';
    }
  }};
  background: ${props => {
    switch (props.severity) {
      case 'CRITICAL': return '#fef2f2';
      case 'HIGH': return '#fffbeb';
      case 'MEDIUM': return '#eff6ff';
      default: return '#f8fafc';
    }
  }};
`;

const AlertHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const AlertSeverity = styled.div`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    switch (props.severity) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f59e0b';
      case 'MEDIUM': return '#3b82f6';
      default: return '#64748b';
    }
  }};
  color: white;
`;

const AlertMessage = styled.div`
  color: #374151;
  margin-bottom: 8px;
`;

const AlertTime = styled.div`
  font-size: 0.75rem;
  color: #64748b;
`;

const RiskChart = styled.div`
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 2px solid #e2e8f0;
  margin-top: 25px;
`;

const RiskDistribution = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-top: 20px;
`;

const RiskLevel = styled.div`
  text-align: center;
  padding: 15px;
  border-radius: 8px;
  background: ${props => {
    switch (props.level) {
      case 'low': return 'linear-gradient(135deg, #10b981, #059669)';
      case 'medium': return 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
      case 'high': return 'linear-gradient(135deg, #f59e0b, #d97706)';
      case 'critical': return 'linear-gradient(135deg, #ef4444, #dc2626)';
      default: return 'linear-gradient(135deg, #64748b, #475569)';
    }
  }};
  color: white;
`;

const RiskCount = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 5px;
`;

const RiskLabel = styled.div`
  font-size: 0.875rem;
  text-transform: uppercase;
  font-weight: 600;
`;

const ComplianceDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/compliance/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        setLastUpdated(new Date().toISOString());
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'KYC_APPROVED': return CheckCircle;
      case 'AML_FLAGGED': return AlertTriangle;
      case 'NFC_VERIFICATION': return Shield;
      default: return Activity;
    }
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

  if (loading || !dashboardData) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #4f46e5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p>Loading compliance dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <Shield size={32} />
          Compliance Dashboard
        </Title>
        <RefreshButton onClick={loadDashboardData}>
          <Activity size={16} />
          Refresh
        </RefreshButton>
      </Header>

      <StatsGrid>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <StatHeader>
            <StatIcon color="linear-gradient(135deg, #10b981, #059669)">
              <Users size={24} />
            </StatIcon>
          </StatHeader>
          <StatValue>{dashboardData.summary.totalUsers.toLocaleString()}</StatValue>
          <StatLabel>Total Users</StatLabel>
          <StatTrend positive>
            <TrendingUp size={12} />
            {dashboardData.summary.complianceRate}% compliant
          </StatTrend>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StatHeader>
            <StatIcon color="linear-gradient(135deg, #3b82f6, #1d4ed8)">
              <CheckCircle size={24} />
            </StatIcon>
          </StatHeader>
          <StatValue>{dashboardData.kycStats.approved.toLocaleString()}</StatValue>
          <StatLabel>KYC Approved</StatLabel>
          <StatTrend positive>
            <TrendingUp size={12} />
            Avg: {dashboardData.kycStats.averageProcessingTime}
          </StatTrend>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <StatHeader>
            <StatIcon color="linear-gradient(135deg, #f59e0b, #d97706)">
              <Clock size={24} />
            </StatIcon>
          </StatHeader>
          <StatValue>{dashboardData.summary.pendingReviews}</StatValue>
          <StatLabel>Pending Reviews</StatLabel>
          <StatTrend>
            Manual review required
          </StatTrend>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <StatHeader>
            <StatIcon color="linear-gradient(135deg, #ef4444, #dc2626)">
              <AlertTriangle size={24} />
            </StatIcon>
          </StatHeader>
          <StatValue>{dashboardData.amlStats.flagged}</StatValue>
          <StatLabel>AML Flagged</StatLabel>
          <StatTrend>
            {dashboardData.amlStats.averageScreeningTime} avg
          </StatTrend>
        </StatCard>
      </StatsGrid>

      <MainContent>
        <ActivitySection>
          <SectionTitle>
            <Activity size={20} />
            Recent Activity
          </SectionTitle>
          
          <ActivityList>
            {dashboardData.recentActivity.map((activity, index) => {
              const IconComponent = getActivityIcon(activity.type);
              
              return (
                <ActivityItem key={activity.id} type={activity.type}>
                  <ActivityIcon type={activity.type}>
                    <IconComponent size={16} />
                  </ActivityIcon>
                  
                  <ActivityDetails>
                    <ActivityType>
                      {activity.type.replace('_', ' ')}
                    </ActivityType>
                    <ActivityDID>{activity.didId}</ActivityDID>
                  </ActivityDetails>
                  
                  <ActivityTime>
                    {formatTime(activity.timestamp)}
                  </ActivityTime>
                </ActivityItem>
              );
            })}
          </ActivityList>
        </ActivitySection>

        <AlertsSection>
          <SectionTitle>
            <AlertTriangle size={20} />
            Active Alerts
          </SectionTitle>
          
          <AlertsList>
            {dashboardData.alerts.map(alert => (
              <AlertItem key={alert.id} severity={alert.severity}>
                <AlertHeader>
                  <AlertSeverity severity={alert.severity}>
                    {alert.severity}
                  </AlertSeverity>
                </AlertHeader>
                
                <AlertMessage>{alert.message}</AlertMessage>
                <AlertTime>{formatTime(alert.timestamp)}</AlertTime>
              </AlertItem>
            ))}
          </AlertsList>
        </AlertsSection>
      </MainContent>

      <RiskChart>
        <SectionTitle>
          <BarChart3 size={20} />
          Risk Distribution
        </SectionTitle>
        
        <RiskDistribution>
          <RiskLevel level="low">
            <RiskCount>{dashboardData.riskDistribution.low}</RiskCount>
            <RiskLabel>Low Risk</RiskLabel>
          </RiskLevel>
          
          <RiskLevel level="medium">
            <RiskCount>{dashboardData.riskDistribution.medium}</RiskCount>
            <RiskLabel>Medium Risk</RiskLabel>
          </RiskLevel>
          
          <RiskLevel level="high">
            <RiskCount>{dashboardData.riskDistribution.high}</RiskCount>
            <RiskLabel>High Risk</RiskLabel>
          </RiskLevel>
          
          <RiskLevel level="critical">
            <RiskCount>{dashboardData.riskDistribution.critical}</RiskCount>
            <RiskLabel>Critical Risk</RiskLabel>
          </RiskLevel>
        </RiskDistribution>
      </RiskChart>
    </Container>
  );
};

export default ComplianceDashboard;
