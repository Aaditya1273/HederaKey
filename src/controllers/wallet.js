import * as WalletService from '../services/wallet';

const create = async (req, res) => {
  try {
    const newAccount = await WalletService.create();
    res.send(newAccount);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const getBalance = async ({ params: { accountId = null } }, res) => {
  try {
    const balance = await WalletService.getBalance(accountId);
    res.send(balance);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const transaction = async ({ body }, res) => {
  try {
    const txResult = await WalletService.transaction(body);
    res.send(txResult);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

const deleteAccount = async ({ body }, res) => {
  try {
    const deleteResult = await WalletService.deleteAccount(body);
    res.send(deleteResult);
  } catch (error) {
    res.status(error.errorCode || 500).send(error);
  }
};

export { create, getBalance, transaction, deleteAccount };
