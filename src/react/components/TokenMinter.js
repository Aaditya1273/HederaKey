import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  Coins, 
  Zap, 
  Image, 
  FileText,
  Settings,
  Plus,
  Sparkles
} from 'lucide-react';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SectionTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const TokenTypeSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const TokenTypeCard = styled(motion.button)`
  padding: 20px;
  border: 2px solid ${props => props.selected ? '#4f46e5' : '#e2e8f0'};
  border-radius: 12px;
  background: ${props => props.selected ? 
    'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'white'};
  color: ${props => props.selected ? 'white' : '#1e293b'};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  
  &:hover {
    border-color: #4f46e5;
    box-shadow: 0 5px 15px rgba(79, 70, 229, 0.1);
  }
`;

const TokenIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.selected ? 
    'rgba(255, 255, 255, 0.2)' : 
    'linear-gradient(135deg, #4f46e5, #7c3aed)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.selected ? 'white' : 'white'};
`;

const TokenTypeName = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
`;

const TokenTypeDescription = styled.p`
  font-size: 0.875rem;
  opacity: 0.8;
  margin: 0;
`;

const MintForm = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 25px;
  border: 2px solid #e2e8f0;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
`;

const Input = styled.input`
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

const TextArea = styled.textarea`
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
`;

const AdvancedSettings = styled.div`
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
`;

const SettingsToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  font-weight: 600;
  color: #4f46e5;
  cursor: pointer;
  margin-bottom: 15px;
  
  &:hover {
    color: #7c3aed;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 15px 25px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const PreviewCard = styled.div`
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
`;

const PreviewHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  font-weight: 600;
  color: #1e293b;
`;

const PreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
`;

const PreviewItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PreviewLabel = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 600;
`;

const PreviewValue = styled.div`
  font-weight: 600;
  color: #1e293b;
`;

const TokenMinter = ({ account, onMint, connected }) => {
  const [selectedType, setSelectedType] = useState('fungible');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenData, setTokenData] = useState({
    name: '',
    symbol: '',
    decimals: '8',
    initialSupply: '1000000',
    maxSupply: '',
    description: '',
    website: '',
    freezeDefault: false,
    pauseKey: false,
    wipeKey: false,
    supplyKey: true,
    adminKey: true,
    kycKey: false,
    freezeKey: false,
    feeScheduleKey: false,
    metadata: ''
  });

  const tokenTypes = [
    {
      id: 'fungible',
      name: 'Fungible Token',
      description: 'Standard token like USDC or custom currency',
      icon: Coins
    },
    {
      id: 'nft',
      name: 'NFT Collection',
      description: 'Non-fungible tokens for digital assets',
      icon: Image
    },
    {
      id: 'utility',
      name: 'Utility Token',
      description: 'Access tokens for services or governance',
      icon: Zap
    }
  ];

  const handleInputChange = (field, value) => {
    setTokenData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMint = async (e) => {
    e.preventDefault();
    
    if (!tokenData.name || !tokenData.symbol) {
      toast.error('Token name and symbol are required');
      return;
    }

    if (selectedType === 'fungible' && !tokenData.initialSupply) {
      toast.error('Initial supply is required for fungible tokens');
      return;
    }

    try {
      setLoading(true);
      
      const mintPayload = {
        type: 'mint',
        tokenType: selectedType,
        tokenName: tokenData.name,
        symbol: tokenData.symbol,
        decimals: selectedType === 'fungible' ? parseInt(tokenData.decimals) : 0,
        initialSupply: selectedType === 'fungible' ? tokenData.initialSupply : '1',
        maxSupply: tokenData.maxSupply || undefined,
        description: tokenData.description,
        metadata: tokenData.metadata,
        keys: {
          adminKey: tokenData.adminKey,
          supplyKey: tokenData.supplyKey,
          pauseKey: tokenData.pauseKey,
          freezeKey: tokenData.freezeKey,
          wipeKey: tokenData.wipeKey,
          kycKey: tokenData.kycKey,
          feeScheduleKey: tokenData.feeScheduleKey
        },
        properties: {
          freezeDefault: tokenData.freezeDefault,
          website: tokenData.website
        }
      };
      
      await onMint(mintPayload);
      
      // Reset form
      setTokenData({
        name: '',
        symbol: '',
        decimals: '8',
        initialSupply: '1000000',
        maxSupply: '',
        description: '',
        website: '',
        freezeDefault: false,
        pauseKey: false,
        wipeKey: false,
        supplyKey: true,
        adminKey: true,
        kycKey: false,
        freezeKey: false,
        feeScheduleKey: false,
        metadata: ''
      });
      
      toast.success('Token minting initiated successfully!');
      
    } catch (error) {
      toast.error('Failed to mint token');
    } finally {
      setLoading(false);
    }
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
          <Coins size={48} style={{ marginBottom: '20px', color: '#10b981' }} />
          <h3>Wallet Required</h3>
          <p>Connect your Hedera wallet to mint tokens.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <SectionTitle>
        <Sparkles size={24} />
        Token Minter
      </SectionTitle>
      
      <TokenTypeSelector>
        {tokenTypes.map(type => (
          <TokenTypeCard
            key={type.id}
            selected={selectedType === type.id}
            onClick={() => setSelectedType(type.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <TokenIcon selected={selectedType === type.id}>
              <type.icon size={24} />
            </TokenIcon>
            <TokenTypeName>{type.name}</TokenTypeName>
            <TokenTypeDescription>{type.description}</TokenTypeDescription>
          </TokenTypeCard>
        ))}
      </TokenTypeSelector>

      <MintForm>
        <form onSubmit={handleMint}>
          <FormGrid>
            <FormGroup>
              <Label>Token Name *</Label>
              <Input
                type="text"
                placeholder="My Awesome Token"
                value={tokenData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                maxLength={100}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Symbol *</Label>
              <Input
                type="text"
                placeholder="MAT"
                value={tokenData.symbol}
                onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                maxLength={10}
              />
            </FormGroup>
          </FormGrid>

          {selectedType === 'fungible' && (
            <FormGrid>
              <FormGroup>
                <Label>Decimals</Label>
                <Select
                  value={tokenData.decimals}
                  onChange={(e) => handleInputChange('decimals', e.target.value)}
                >
                  <option value="0">0 (Whole numbers)</option>
                  <option value="2">2 (Like cents)</option>
                  <option value="8">8 (Like HBAR)</option>
                  <option value="18">18 (Like ETH)</option>
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label>Initial Supply</Label>
                <Input
                  type="number"
                  placeholder="1000000"
                  value={tokenData.initialSupply}
                  onChange={(e) => handleInputChange('initialSupply', e.target.value)}
                  min="1"
                />
              </FormGroup>
            </FormGrid>
          )}

          <FormGroup>
            <Label>Description</Label>
            <TextArea
              placeholder="Describe your token's purpose and utility..."
              value={tokenData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              maxLength={500}
            />
          </FormGroup>

          <AdvancedSettings>
            <SettingsToggle onClick={() => setShowAdvanced(!showAdvanced)}>
              <Settings size={16} />
              Advanced Settings
            </SettingsToggle>
            
            {showAdvanced && (
              <>
                <FormGrid>
                  <FormGroup>
                    <Label>Website URL</Label>
                    <Input
                      type="url"
                      placeholder="https://mytoken.com"
                      value={tokenData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>Max Supply (Optional)</Label>
                    <Input
                      type="number"
                      placeholder="Leave empty for unlimited"
                      value={tokenData.maxSupply}
                      onChange={(e) => handleInputChange('maxSupply', e.target.value)}
                    />
                  </FormGroup>
                </FormGrid>

                <FormGroup>
                  <Label>Metadata (JSON)</Label>
                  <TextArea
                    placeholder='{"image": "https://...", "attributes": []}'
                    value={tokenData.metadata}
                    onChange={(e) => handleInputChange('metadata', e.target.value)}
                  />
                </FormGroup>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
                  {[
                    { key: 'adminKey', label: 'Admin Key' },
                    { key: 'supplyKey', label: 'Supply Key' },
                    { key: 'pauseKey', label: 'Pause Key' },
                    { key: 'freezeKey', label: 'Freeze Key' },
                    { key: 'wipeKey', label: 'Wipe Key' },
                    { key: 'kycKey', label: 'KYC Key' }
                  ].map(({ key, label }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={tokenData[key]}
                        onChange={(e) => handleInputChange(key, e.target.checked)}
                      />
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </AdvancedSettings>

          <Button type="submit" disabled={loading}>
            <Plus size={20} />
            {loading ? 'Minting Token...' : `Mint ${tokenTypes.find(t => t.id === selectedType)?.name}`}
          </Button>
        </form>
      </MintForm>

      {(tokenData.name || tokenData.symbol) && (
        <PreviewCard>
          <PreviewHeader>
            <FileText size={20} />
            Token Preview
          </PreviewHeader>
          
          <PreviewGrid>
            <PreviewItem>
              <PreviewLabel>Name</PreviewLabel>
              <PreviewValue>{tokenData.name || 'Not set'}</PreviewValue>
            </PreviewItem>
            
            <PreviewItem>
              <PreviewLabel>Symbol</PreviewLabel>
              <PreviewValue>{tokenData.symbol || 'Not set'}</PreviewValue>
            </PreviewItem>
            
            <PreviewItem>
              <PreviewLabel>Type</PreviewLabel>
              <PreviewValue>{tokenTypes.find(t => t.id === selectedType)?.name}</PreviewValue>
            </PreviewItem>
            
            {selectedType === 'fungible' && (
              <>
                <PreviewItem>
                  <PreviewLabel>Decimals</PreviewLabel>
                  <PreviewValue>{tokenData.decimals}</PreviewValue>
                </PreviewItem>
                
                <PreviewItem>
                  <PreviewLabel>Initial Supply</PreviewLabel>
                  <PreviewValue>{tokenData.initialSupply || '0'}</PreviewValue>
                </PreviewItem>
              </>
            )}
            
            <PreviewItem>
              <PreviewLabel>Admin Keys</PreviewLabel>
              <PreviewValue>
                {[tokenData.adminKey && 'Admin', tokenData.supplyKey && 'Supply', tokenData.pauseKey && 'Pause']
                  .filter(Boolean).join(', ') || 'None'}
              </PreviewValue>
            </PreviewItem>
          </PreviewGrid>
        </PreviewCard>
      )}
    </Container>
  );
};

export default TokenMinter;
