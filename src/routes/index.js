import { Router } from 'express';
import { version } from '../../package.json';
import { create, getBalance, transaction, deleteAccount } from '../controllers/wallet';
import { resolveDomain, reverseResolve, getHederaInfo, linkToHedera, queryMirrorNode } from '../controllers/domain';
import { createToken, mintToken, mintNFT, associateToken, getTokenInfo } from '../controllers/token';

const router = Router();

// Wallet endpoints
router.get('/createWallet', create);
router.get('/getBalance/:accountId', getBalance);
router.post('/transaction', transaction);
router.post('/deleteAccount', deleteAccount);

// Enhanced domain resolution endpoints
router.get('/domain/resolve/:domain', resolveDomain);
router.post('/domain/reverse', reverseResolve);
router.get('/hedera/account/:accountId', getHederaInfo);
router.post('/domain/link-hedera', linkToHedera);
router.get('/hedera/mirror/:accountId', queryMirrorNode);

// Token endpoints
router.post('/tokens/create', createToken);
router.post('/tokens/mint', mintToken);
router.post('/tokens/mint-nft', mintNFT);
router.post('/tokens/associate', associateToken);
router.get('/tokens/:tokenId', getTokenInfo);

// System endpoints
router.get('/health', (req, res) => res.send({ version }));
router.get('*', (req, res) => res.send('.'));

export default router;
