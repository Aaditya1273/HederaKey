import * as TokenService from '../services/token';

const createToken = async (req, res) => {
  try {
    const { tokenType, ...tokenData } = req.body;
    
    let result;
    if (tokenType === 'fungible') {
      result = await TokenService.createFungibleToken(tokenData);
    } else if (tokenType === 'nft') {
      result = await TokenService.createNFTCollection(tokenData);
    } else {
      throw new Error('Invalid token type. Must be "fungible" or "nft"');
    }
    
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const mintToken = async (req, res) => {
  try {
    const result = await TokenService.processNFCTokenMint(req.body);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const mintNFT = async (req, res) => {
  try {
    const { tokenId, metadata } = req.body;
    const result = await TokenService.mintNFT({ tokenId, metadata });
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const associateToken = async (req, res) => {
  try {
    const result = await TokenService.associateToken(req.body);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const getTokenInfo = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const result = await TokenService.getTokenInfo(tokenId);
    res.send(result);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

export { createToken, mintToken, mintNFT, associateToken, getTokenInfo };
