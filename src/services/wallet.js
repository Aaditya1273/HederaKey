import {
  Client,
  PrivateKey,
  AccountCreateTransaction,
  AccountBalanceQuery,
  TransferTransaction,
  Hbar,
  AccountId,
  AccountDeleteTransaction
} from '@hashgraph/sdk';
import logger from '../utils/logger';
import { hederaNetwork, hederaOperatorId, hederaOperatorKey } from '../config.json';

// Initialize Hedera client
const client = Client.forTestnet();
client.setOperator(hederaOperatorId, hederaOperatorKey);

const create = async () => {
  try {
    // Generate a new private key for the account
    const newAccountPrivateKey = PrivateKey.generateED25519();
    const newAccountPublicKey = newAccountPrivateKey.publicKey;

    // Create new account with 1000 tinybars starting balance
    const newAccount = await new AccountCreateTransaction()
      .setKey(newAccountPublicKey)
      .setInitialBalance(Hbar.fromTinybars(1000))
      .execute(client);

    // Get the new account ID
    const getReceipt = await newAccount.getReceipt(client);
    const newAccountId = getReceipt.accountId;

    logger.info('WalletService', 'create', `Created new account: ${newAccountId}`);

    return {
      accountId: newAccountId.toString(),
      privateKey: newAccountPrivateKey.toString(),
      publicKey: newAccountPublicKey.toString()
    };
  } catch (error) {
    logger.error('WalletService', 'create', error.message);
    throw {
      errorCode: 500,
      error: error.message
    };
  }
};

const getBalance = async (accountId = null) => {
  try {
    if (!accountId) {
      logger.error('WalletService', 'getBalance', 'Account ID is required');
      throw {
        errorCode: 400,
        error: 'Account ID is required'
      };
    }

    // Validate account ID format
    let hederaAccountId;
    try {
      hederaAccountId = AccountId.fromString(accountId);
    } catch (error) {
      logger.error('WalletService', 'getBalance', 'Invalid account ID format');
      throw {
        errorCode: 400,
        error: `${accountId} is not a valid Hedera account ID`
      };
    }

    // Query the account balance
    const accountBalance = await new AccountBalanceQuery()
      .setAccountId(hederaAccountId)
      .execute(client);

    logger.info('WalletService', 'getBalance', `Balance for ${accountId}: ${accountBalance.hbars.toString()}`);

    return {
      accountId: accountId,
      balance: accountBalance.hbars.toString(),
      balanceInTinybars: accountBalance.hbars.toTinybars().toString()
    };
  } catch (error) {
    logger.error('WalletService', 'getBalance', error.message || error.error);
    throw {
      errorCode: error.errorCode || 500,
      error: error.error || error.message
    };
  }
};

const transaction = async ({ privateKey, destination, amount }) => {
  try {
    logger.info('WalletService', 'transaction', `Transfer: ${amount} HBAR to ${destination}`);

    // Validate input parameters
    if (!privateKey || !amount || !destination || !(parseFloat(amount) > 0)) {
      logger.error('WalletService', 'transaction', 'Invalid transaction parameters');
      throw {
        errorCode: 400,
        error: 'Invalid transaction parameters'
      };
    }

    // Parse private key
    let senderPrivateKey;
    try {
      senderPrivateKey = PrivateKey.fromString(privateKey);
    } catch (error) {
      logger.error('WalletService', 'transaction', 'Invalid private key format');
      throw {
        errorCode: 400,
        error: 'Could not parse private key'
      };
    }

    // Parse destination account ID
    let destinationAccountId;
    try {
      destinationAccountId = AccountId.fromString(destination);
    } catch (error) {
      logger.error('WalletService', 'transaction', 'Invalid destination account ID');
      throw {
        errorCode: 400,
        error: 'Invalid destination account ID format'
      };
    }

    // Get sender account ID from private key (this requires the account to be known)
    // For now, we'll use the operator account as sender
    const senderAccountId = AccountId.fromString(hederaOperatorId);

    // Create transfer transaction
    const transferTx = new TransferTransaction()
      .addHbarTransfer(senderAccountId, Hbar.from(-parseFloat(amount)))
      .addHbarTransfer(destinationAccountId, Hbar.from(parseFloat(amount)))
      .freezeWith(client);

    // Sign and execute the transaction
    const signedTx = await transferTx.sign(senderPrivateKey);
    const txResponse = await signedTx.execute(client);

    // Get transaction receipt
    const receipt = await txResponse.getReceipt(client);
    const transactionId = txResponse.transactionId;

    logger.info('WalletService', 'transaction', `Transaction successful: ${transactionId}`);

    return {
      txHash: transactionId.toString(),
      status: receipt.status.toString(),
      amount: amount,
      from: senderAccountId.toString(),
      to: destinationAccountId.toString()
    };
  } catch (error) {
    logger.error('WalletService', 'transaction', error.message || error.error);
    throw {
      errorCode: error.errorCode || 500,
      error: error.error || error.message
    };
  }
};

const deleteAccount = async ({ privateKey, transferAccountId }) => {
  try {
    // Parse private key
    let accountPrivateKey;
    try {
      accountPrivateKey = PrivateKey.fromString(privateKey);
    } catch (error) {
      throw {
        errorCode: 400,
        error: 'Invalid private key format'
      };
    }

    // Parse transfer account ID
    let transferAccount;
    try {
      transferAccount = AccountId.fromString(transferAccountId);
    } catch (error) {
      throw {
        errorCode: 400,
        error: 'Invalid transfer account ID format'
      };
    }

    // Get account ID from private key (simplified - in real implementation you'd track this)
    const accountToDelete = AccountId.fromString(hederaOperatorId);

    // Create account delete transaction
    const deleteAccountTx = new AccountDeleteTransaction()
      .setAccountId(accountToDelete)
      .setTransferAccountId(transferAccount)
      .freezeWith(client);

    // Sign and execute
    const signedTx = await deleteAccountTx.sign(accountPrivateKey);
    const txResponse = await signedTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    logger.info('WalletService', 'deleteAccount', `Account deleted: ${accountToDelete}`);

    return {
      txHash: txResponse.transactionId.toString(),
      status: receipt.status.toString(),
      deletedAccount: accountToDelete.toString(),
      transferredTo: transferAccount.toString()
    };
  } catch (error) {
    logger.error('WalletService', 'deleteAccount', error.message || error.error);
    throw {
      errorCode: error.errorCode || 500,
      error: error.error || error.message
    };
  }
};

export { create, getBalance, transaction, deleteAccount };
