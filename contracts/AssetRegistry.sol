// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title AssetRegistry
 * @dev NFT contract for real-world asset tokenization with NFC integration
 */
contract AssetRegistry is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // Asset types
    enum AssetType { FARM_SHARE, REAL_ESTATE, CARBON_CREDIT, COMMODITY, ARTWORK, VEHICLE, OTHER }
    
    // Asset structure
    struct Asset {
        uint256 tokenId;
        AssetType assetType;
        string name;
        string description;
        uint256 valuation;
        string location;
        string nfcTagId;
        address owner;
        bool verified;
        uint256 createdAt;
        uint256 lastUpdated;
    }
    
    // Events
    event AssetMinted(uint256 indexed tokenId, address indexed owner, AssetType assetType, string nfcTagId);
    event AssetVerified(uint256 indexed tokenId, address indexed verifier);
    event AssetUpdated(uint256 indexed tokenId, uint256 newValuation);
    event NFCTagLinked(uint256 indexed tokenId, string nfcTagId);
    
    // Mappings
    mapping(uint256 => Asset) public assets;
    mapping(string => uint256) public nfcTagToToken;
    mapping(address => uint256[]) public ownerAssets;
    mapping(AssetType => uint256) public assetTypeCount;
    
    // Authorized verifiers
    mapping(address => bool) public authorizedVerifiers;
    
    // Contract state
    uint256 public totalAssets;
    uint256 public totalValuation;
    
    constructor() ERC721("MindKey Real World Assets", "MKRWA") {}
    
    /**
     * @dev Mint new asset NFT with NFC tag
     */
    function mintAsset(
        address to,
        AssetType assetType,
        string memory name,
        string memory description,
        uint256 valuation,
        string memory location,
        string memory nfcTagId,
        string memory tokenURI
    ) public onlyOwner returns (uint256) {
        require(bytes(nfcTagId).length > 0, "NFC tag ID required");
        require(nfcTagToToken[nfcTagId] == 0, "NFC tag already linked");
        require(valuation > 0, "Valuation must be positive");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        // Create asset record
        assets[tokenId] = Asset({
            tokenId: tokenId,
            assetType: assetType,
            name: name,
            description: description,
            valuation: valuation,
            location: location,
            nfcTagId: nfcTagId,
            owner: to,
            verified: false,
            createdAt: block.timestamp,
            lastUpdated: block.timestamp
        });
        
        // Update mappings
        nfcTagToToken[nfcTagId] = tokenId;
        ownerAssets[to].push(tokenId);
        assetTypeCount[assetType]++;
        totalAssets++;
        totalValuation += valuation;
        
        emit AssetMinted(tokenId, to, assetType, nfcTagId);
        emit NFCTagLinked(tokenId, nfcTagId);
        
        return tokenId;
    }
    
    /**
     * @dev Verify asset by authorized verifier
     */
    function verifyAsset(uint256 tokenId) public {
        require(_exists(tokenId), "Asset does not exist");
        require(authorizedVerifiers[msg.sender] || msg.sender == owner(), "Not authorized to verify");
        
        assets[tokenId].verified = true;
        assets[tokenId].lastUpdated = block.timestamp;
        
        emit AssetVerified(tokenId, msg.sender);
    }
    
    /**
     * @dev Update asset valuation
     */
    function updateValuation(uint256 tokenId, uint256 newValuation) public {
        require(_exists(tokenId), "Asset does not exist");
        require(ownerOf(tokenId) == msg.sender || msg.sender == owner(), "Not authorized");
        require(newValuation > 0, "Valuation must be positive");
        
        uint256 oldValuation = assets[tokenId].valuation;
        assets[tokenId].valuation = newValuation;
        assets[tokenId].lastUpdated = block.timestamp;
        
        // Update total valuation
        totalValuation = totalValuation - oldValuation + newValuation;
        
        emit AssetUpdated(tokenId, newValuation);
    }
    
    /**
     * @dev Get asset by NFC tag ID
     */
    function getAssetByNFC(string memory nfcTagId) public view returns (Asset memory) {
        uint256 tokenId = nfcTagToToken[nfcTagId];
        require(tokenId != 0, "NFC tag not found");
        return assets[tokenId];
    }
    
    /**
     * @dev Get all assets owned by address
     */
    function getAssetsByOwner(address owner) public view returns (uint256[] memory) {
        return ownerAssets[owner];
    }
    
    /**
     * @dev Add authorized verifier
     */
    function addVerifier(address verifier) public onlyOwner {
        authorizedVerifiers[verifier] = true;
    }
    
    /**
     * @dev Remove authorized verifier
     */
    function removeVerifier(address verifier) public onlyOwner {
        authorizedVerifiers[verifier] = false;
    }
    
    /**
     * @dev Get contract statistics
     */
    function getStats() public view returns (
        uint256 _totalAssets,
        uint256 _totalValuation,
        uint256 _farmShares,
        uint256 _realEstate,
        uint256 _carbonCredits
    ) {
        return (
            totalAssets,
            totalValuation,
            assetTypeCount[AssetType.FARM_SHARE],
            assetTypeCount[AssetType.REAL_ESTATE],
            assetTypeCount[AssetType.CARBON_CREDIT]
        );
    }
    
    /**
     * @dev Override transfer to update owner mapping
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        if (from != address(0) && to != address(0)) {
            // Update asset owner
            assets[tokenId].owner = to;
            assets[tokenId].lastUpdated = block.timestamp;
            
            // Update owner assets mapping
            _removeFromOwnerAssets(from, tokenId);
            ownerAssets[to].push(tokenId);
        }
    }
    
    /**
     * @dev Remove token from owner's asset list
     */
    function _removeFromOwnerAssets(address owner, uint256 tokenId) private {
        uint256[] storage assets = ownerAssets[owner];
        for (uint256 i = 0; i < assets.length; i++) {
            if (assets[i] == tokenId) {
                assets[i] = assets[assets.length - 1];
                assets.pop();
                break;
            }
        }
    }
    
    // Override required functions
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
