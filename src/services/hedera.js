const { 
  Client, 
  AccountCreateTransaction, 
  TokenCreateTransaction,
  TokenAssociateTransaction,
  TransferTransaction,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  PrivateKey,
  AccountId,
  Hbar
} = require("@hashgraph/sdk");

class HederaService {
  constructor() {
    this.client = null;
    this.operatorId = null;
    this.operatorKey = null;
    this.initialize();
  }

  initialize() {
    try {
      // Initialize Hedera client
      this.operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID || "0.0.2");
      this.operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY || "302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137");
      
      this.client = Client.forTestnet();
      this.client.setOperator(this.operatorId, this.operatorKey);
      
      console.log("✅ Hedera client initialized");
    } catch (error) {
      console.error("❌ Hedera initialization failed:", error);
    }
  }

  async createAccount() {
    try {
      const newAccountPrivateKey = PrivateKey.generateED25519();
      const newAccountPublicKey = newAccountPrivateKey.publicKey;

      const newAccount = await new AccountCreateTransaction()
        .setKey(newAccountPublicKey)
        .setInitialBalance(Hbar.fromTinybars(1000))
        .execute(this.client);

      const getReceipt = await newAccount.getReceipt(this.client);
      const newAccountId = getReceipt.accountId;

      return {
        accountId: newAccountId.toString(),
        privateKey: newAccountPrivateKey.toString(),
        publicKey: newAccountPublicKey.toString()
      };
    } catch (error) {
      throw new Error(`Account creation failed: ${error.message}`);
    }
  }

  async createToken(tokenData) {
    try {
      const { name, symbol, decimals = 8, initialSupply = 1000000 } = tokenData;

      const tokenCreateTx = await new TokenCreateTransaction()
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setDecimals(decimals)
        .setInitialSupply(initialSupply)
        .setTreasuryAccountId(this.operatorId)
        .setAdminKey(this.operatorKey)
        .setSupplyKey(this.operatorKey)
        .setFreezeDefault(false)
        .execute(this.client);

      const tokenCreateReceipt = await tokenCreateTx.getReceipt(this.client);
      const tokenId = tokenCreateReceipt.tokenId;

      return {
        tokenId: tokenId.toString(),
        name,
        symbol,
        decimals,
        initialSupply,
        txHash: tokenCreateTx.transactionId.toString()
      };
    } catch (error) {
      throw new Error(`Token creation failed: ${error.message}`);
    }
  }

  async transferTokens(fromAccountId, toAccountId, tokenId, amount) {
    try {
      const transferTx = await new TransferTransaction()
        .addTokenTransfer(tokenId, fromAccountId, -amount)
        .addTokenTransfer(tokenId, toAccountId, amount)
        .execute(this.client);

      const transferReceipt = await transferTx.getReceipt(this.client);

      return {
        success: true,
        txHash: transferTx.transactionId.toString(),
        status: transferReceipt.status.toString()
      };
    } catch (error) {
      throw new Error(`Token transfer failed: ${error.message}`);
    }
  }

  async createTopic(memo = "MindKey NFC Topic") {
    try {
      const topicCreateTx = await new TopicCreateTransaction()
        .setTopicMemo(memo)
        .setAdminKey(this.operatorKey)
        .setSubmitKey(this.operatorKey)
        .execute(this.client);

      const topicCreateReceipt = await topicCreateTx.getReceipt(this.client);
      const topicId = topicCreateReceipt.topicId;

      return {
        topicId: topicId.toString(),
        memo,
        txHash: topicCreateTx.transactionId.toString()
      };
    } catch (error) {
      throw new Error(`Topic creation failed: ${error.message}`);
    }
  }

  async submitMessage(topicId, message) {
    try {
      const messageTx = await new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(JSON.stringify(message))
        .execute(this.client);

      const messageReceipt = await messageTx.getReceipt(this.client);

      return {
        success: true,
        topicId: topicId.toString(),
        txHash: messageTx.transactionId.toString(),
        sequenceNumber: messageReceipt.topicSequenceNumber.toString()
      };
    } catch (error) {
      throw new Error(`Message submission failed: ${error.message}`);
    }
  }

  async getAccountBalance(accountId) {
    try {
      const balance = await this.client.getAccountBalance(accountId);
      
      return {
        accountId: accountId.toString(),
        hbarBalance: balance.hbars.toString(),
        tokens: balance.tokens ? Object.fromEntries(balance.tokens) : {}
      };
    } catch (error) {
      throw new Error(`Balance query failed: ${error.message}`);
    }
  }
}

module.exports = new HederaService();
