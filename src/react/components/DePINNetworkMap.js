import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Wifi, 
  Zap, 
  DollarSign,
  Activity,
  MapPin,
  Users,
  Server,
  TrendingUp,
  AlertCircle,
  CheckCircle,
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

const NetworkStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
`;

const StatCard = styled(motion.div)`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 15px;
`;

const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${props => props.color || 'linear-gradient(135deg, #4f46e5, #7c3aed)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
`;

const MapContainer = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 25px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const WorldMap = styled.div`
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 2px solid #e2e8f0;
  position: relative;
  height: 600px;
  overflow: hidden;
`;

const MapSVG = styled.svg`
  width: 100%;
  height: 100%;
`;

const CityHub = styled(motion.circle)`
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    r: 8;
  }
`;

const RelayNode = styled(motion.circle)`
  cursor: pointer;
  opacity: 0.7;
  
  &:hover {
    opacity: 1;
  }
`;

const ConnectionLine = styled(motion.line)`
  stroke: #4f46e5;
  stroke-width: 1;
  opacity: 0.3;
  
  &.active {
    opacity: 0.8;
    stroke-width: 2;
  }
`;

const SidePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const PanelCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 2px solid #e2e8f0;
`;

const PanelTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
`;

const CityItem = styled(motion.div)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: ${props => props.selected ? '#f0f9ff' : '#f8fafc'};
  border: 2px solid ${props => props.selected ? '#0ea5e9' : '#e2e8f0'};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #0ea5e9;
    background: #f0f9ff;
  }
`;

const CityInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CityName = styled.div`
  font-weight: 600;
  color: #1e293b;
`;

const CityStats = styled.div`
  font-size: 0.75rem;
  color: #64748b;
`;

const NodeStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: ${props => {
    switch (props.status) {
      case 'active': return '#10b981';
      case 'offline': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#64748b';
    }
  }};
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
`;

const ControlPanel = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
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
  
  &.active {
    background: #4f46e5;
    color: white;
    border-color: #4f46e5;
  }
`;

const LoadSimulator = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const LoadButton = styled(Button)`
  font-size: 0.875rem;
  padding: 6px 12px;
`;

const Tooltip = styled(motion.div)`
  position: absolute;
  background: #1e293b;
  color: white;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 0.875rem;
  pointer-events: none;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const DePINNetworkMap = () => {
  const [networkData, setNetworkData] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showConnections, setShowConnections] = useState(true);
  const [loadLevel, setLoadLevel] = useState('medium');
  const [tooltip, setTooltip] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    loadNetworkData();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      loadNetworkData();
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const loadNetworkData = async () => {
    try {
      const response = await fetch('/depin/network/status');
      if (response.ok) {
        const data = await response.json();
        setNetworkData(data);
      } else {
        // Mock data for development
        setNetworkData(generateMockNetworkData());
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading network data:', error);
      setNetworkData(generateMockNetworkData());
      setLoading(false);
    }
  };

  const generateMockNetworkData = () => {
    const cities = [
      { id: 'NYC', name: 'New York', lat: 40.7128, lng: -74.0060, region: 'NA', activeNodes: 45, totalStaked: 125000, load: 0.7 },
      { id: 'LON', name: 'London', lat: 51.5074, lng: -0.1278, region: 'EU', activeNodes: 38, totalStaked: 98000, load: 0.6 },
      { id: 'TOK', name: 'Tokyo', lat: 35.6762, lng: 139.6503, region: 'APAC', activeNodes: 42, totalStaked: 110000, load: 0.8 },
      { id: 'SIN', name: 'Singapore', lat: 1.3521, lng: 103.8198, region: 'APAC', activeNodes: 35, totalStaked: 89000, load: 0.5 },
      { id: 'SYD', name: 'Sydney', lat: -33.8688, lng: 151.2093, region: 'APAC', activeNodes: 28, totalStaked: 72000, load: 0.4 },
      { id: 'TOR', name: 'Toronto', lat: 43.6532, lng: -79.3832, region: 'NA', activeNodes: 31, totalStaked: 78000, load: 0.6 },
      { id: 'BER', name: 'Berlin', lat: 52.5200, lng: 13.4050, region: 'EU', activeNodes: 33, totalStaked: 85000, load: 0.5 },
      { id: 'PAR', name: 'Paris', lat: 48.8566, lng: 2.3522, region: 'EU', activeNodes: 36, totalStaked: 92000, load: 0.7 },
      { id: 'HKG', name: 'Hong Kong', lat: 22.3193, lng: 114.1694, region: 'APAC', activeNodes: 29, totalStaked: 75000, load: 0.6 },
      { id: 'DXB', name: 'Dubai', lat: 25.2048, lng: 55.2708, region: 'ME', activeNodes: 26, totalStaked: 68000, load: 0.4 }
    ];

    return {
      totalNodes: cities.reduce((sum, city) => sum + city.activeNodes, 0),
      activeNodes: cities.reduce((sum, city) => sum + city.activeNodes, 0),
      totalStaked: cities.reduce((sum, city) => sum + city.totalStaked, 0),
      networkUptime: 0.987,
      avgLatency: 125,
      totalRewardsDistributed: 45678,
      cityHubs: cities
    };
  };

  const handleCityClick = (city) => {
    setSelectedCity(selectedCity?.id === city.id ? null : city);
  };

  const handleMouseEnter = (event, city) => {
    const rect = mapRef.current.getBoundingClientRect();
    setTooltip({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      content: (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{city.name}</div>
          <div>Nodes: {city.activeNodes}</div>
          <div>Staked: {city.totalStaked?.toLocaleString()} HBAR</div>
          <div>Load: {(city.load * 100).toFixed(0)}%</div>
        </div>
      )
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const simulateLoad = async (level) => {
    setLoadLevel(level);
    try {
      await fetch('/depin/network/simulate-load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loadLevel: level })
      });
      loadNetworkData();
    } catch (error) {
      console.error('Error simulating load:', error);
    }
  };

  const convertToMapCoordinates = (lat, lng) => {
    // Simple projection for demo (Mercator-like)
    const x = ((lng + 180) / 360) * 800;
    const y = ((90 - lat) / 180) * 400;
    return { x, y };
  };

  const getNodeStatusColor = (load) => {
    if (load > 0.8) return '#ef4444'; // Red for high load
    if (load > 0.6) return '#f59e0b'; // Yellow for medium load
    return '#10b981'; // Green for low load
  };

  const getNodeStatus = (load) => {
    if (load > 0.8) return 'warning';
    if (load > 0.6) return 'active';
    return 'active';
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
          <p style={{ color: '#64748b' }}>Loading DePIN Network...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <Globe size={32} />
          DePIN Relay Network
        </Title>
        
        <ControlPanel>
          <Button 
            className={showConnections ? 'active' : ''}
            onClick={() => setShowConnections(!showConnections)}
          >
            <Wifi size={16} />
            Connections
          </Button>
          
          <Button onClick={loadNetworkData}>
            <RefreshCw size={16} />
            Refresh
          </Button>
        </ControlPanel>
      </Header>

      <NetworkStats>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <StatIcon color="linear-gradient(135deg, #10b981, #059669)">
            <Server size={20} />
          </StatIcon>
          <StatContent>
            <StatValue>{networkData?.activeNodes || 0}</StatValue>
            <StatLabel>Active Nodes</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StatIcon color="linear-gradient(135deg, #3b82f6, #1d4ed8)">
            <DollarSign size={20} />
          </StatIcon>
          <StatContent>
            <StatValue>{(networkData?.totalStaked || 0).toLocaleString()}</StatValue>
            <StatLabel>Total Staked (HBAR)</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <StatIcon color="linear-gradient(135deg, #8b5cf6, #7c3aed)">
            <Activity size={20} />
          </StatIcon>
          <StatContent>
            <StatValue>{((networkData?.networkUptime || 0) * 100).toFixed(1)}%</StatValue>
            <StatLabel>Network Uptime</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <StatIcon color="linear-gradient(135deg, #f59e0b, #d97706)">
            <Zap size={20} />
          </StatIcon>
          <StatContent>
            <StatValue>{networkData?.avgLatency || 0}ms</StatValue>
            <StatLabel>Avg Latency</StatLabel>
          </StatContent>
        </StatCard>
      </NetworkStats>

      <LoadSimulator>
        <span style={{ color: '#64748b', fontWeight: '600' }}>Simulate Load:</span>
        {['low', 'medium', 'high', 'extreme'].map(level => (
          <LoadButton
            key={level}
            className={loadLevel === level ? 'active' : ''}
            onClick={() => simulateLoad(level)}
          >
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </LoadButton>
        ))}
      </LoadSimulator>

      <MapContainer>
        <WorldMap ref={mapRef}>
          <MapSVG viewBox="0 0 800 400">
            {/* World map background (simplified) */}
            <rect width="800" height="400" fill="#f0f9ff" />
            
            {/* Continents (simplified shapes) */}
            <path d="M100 150 L300 120 L350 180 L250 220 Z" fill="#e2e8f0" /> {/* North America */}
            <path d="M200 250 L280 230 L320 280 L240 300 Z" fill="#e2e8f0" /> {/* South America */}
            <path d="M350 120 L500 100 L520 200 L380 180 Z" fill="#e2e8f0" /> {/* Europe */}
            <path d="M480 180 L650 160 L680 250 L520 240 Z" fill="#e2e8f0" /> {/* Asia */}
            <path d="M650 280 L750 270 L770 320 L680 330 Z" fill="#e2e8f0" /> {/* Australia */}
            <path d="M380 220 L480 200 L500 300 L400 320 Z" fill="#e2e8f0" /> {/* Africa */}

            {/* Connection lines */}
            {showConnections && networkData?.cityHubs && networkData.cityHubs.map((city, i) => 
              networkData.cityHubs.slice(i + 1).map((otherCity, j) => {
                const coord1 = convertToMapCoordinates(city.lat, city.lng);
                const coord2 = convertToMapCoordinates(otherCity.lat, otherCity.lng);
                
                return (
                  <ConnectionLine
                    key={`${city.id}-${otherCity.id}`}
                    x1={coord1.x}
                    y1={coord1.y}
                    x2={coord2.x}
                    y2={coord2.y}
                    className={city.load > 0.7 || otherCity.load > 0.7 ? 'active' : ''}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, delay: (i + j) * 0.1 }}
                  />
                );
              })
            )}

            {/* City hubs */}
            {networkData?.cityHubs?.map((city, index) => {
              const coord = convertToMapCoordinates(city.lat, city.lng);
              
              return (
                <g key={city.id}>
                  <CityHub
                    cx={coord.x}
                    cy={coord.y}
                    r={selectedCity?.id === city.id ? 8 : 6}
                    fill={getNodeStatusColor(city.load)}
                    stroke="white"
                    strokeWidth="2"
                    onClick={() => handleCityClick(city)}
                    onMouseEnter={(e) => handleMouseEnter(e, city)}
                    onMouseLeave={handleMouseLeave}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  />
                  
                  {/* City label */}
                  <text
                    x={coord.x}
                    y={coord.y - 12}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#1e293b"
                    fontWeight="600"
                  >
                    {city.name}
                  </text>
                </g>
              );
            })}
          </MapSVG>

          {/* Tooltip */}
          <AnimatePresence>
            {tooltip && (
              <Tooltip
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{
                  left: tooltip.x + 10,
                  top: tooltip.y - 10
                }}
              >
                {tooltip.content}
              </Tooltip>
            )}
          </AnimatePresence>
        </WorldMap>

        <SidePanel>
          <PanelCard>
            <PanelTitle>
              <MapPin size={20} />
              City Hubs
            </PanelTitle>
            
            <CityList>
              {networkData?.cityHubs?.map((city) => (
                <CityItem
                  key={city.id}
                  selected={selectedCity?.id === city.id}
                  onClick={() => handleCityClick(city)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CityInfo>
                    <CityName>{city.name}</CityName>
                    <CityStats>
                      {city.activeNodes} nodes • {city.totalStaked?.toLocaleString()} HBAR
                    </CityStats>
                  </CityInfo>
                  
                  <NodeStatus status={getNodeStatus(city.load)}>
                    <StatusDot />
                    {(city.load * 100).toFixed(0)}%
                  </NodeStatus>
                </CityItem>
              ))}
            </CityList>
          </PanelCard>

          {selectedCity && (
            <PanelCard>
              <PanelTitle>
                <Server size={20} />
                {selectedCity.name} Details
              </PanelTitle>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Active Nodes:</span>
                  <span style={{ fontWeight: '600' }}>{selectedCity.activeNodes}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Total Staked:</span>
                  <span style={{ fontWeight: '600' }}>{selectedCity.totalStaked?.toLocaleString()} HBAR</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Network Load:</span>
                  <span style={{ fontWeight: '600', color: getNodeStatusColor(selectedCity.load) }}>
                    {(selectedCity.load * 100).toFixed(1)}%
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Region:</span>
                  <span style={{ fontWeight: '600' }}>{selectedCity.region}</span>
                </div>
              </div>
            </PanelCard>
          )}

          <PanelCard>
            <PanelTitle>
              <TrendingUp size={20} />
              Network Health
            </PanelTitle>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="#10b981" />
                <span>All systems operational</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} color="#3b82f6" />
                <span>Real-time monitoring active</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={16} color="#f59e0b" />
                <span>Load balancing enabled</span>
              </div>
            </div>
          </PanelCard>
        </SidePanel>
      </MapContainer>
    </Container>
  );
};

export default DePINNetworkMap;
