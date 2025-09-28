import * as DomainService from '../services/domain';

const resolveDomain = async (req, res) => {
  try {
    const { domain } = req.params;
    const enhancedDomainData = await DomainService.resolveDomainWithHedera(domain);
    res.send(enhancedDomainData);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const reverseResolve = async (req, res) => {
  try {
    const { addresses } = req.body;
    const reverseData = await DomainService.reverseResolveWithHedera(addresses);
    res.send(reverseData);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const getHederaInfo = async (req, res) => {
  try {
    const { accountId } = req.params;
    const hederaInfo = await DomainService.getHederaAccountInfo(accountId);
    res.send(hederaInfo);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const linkToHedera = async (req, res) => {
  try {
    const { domain, hederaAccountId, signature } = req.body;
    const linkingResult = await DomainService.linkDomainToHederaWallet(domain, hederaAccountId, signature);
    res.send(linkingResult);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const queryMirrorNode = async (req, res) => {
  try {
    const { accountId } = req.params;
    const mirrorData = await DomainService.queryHederaMirrorNode(accountId);
    res.send(mirrorData);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

export { resolveDomain, reverseResolve, getHederaInfo, linkToHedera, queryMirrorNode };
