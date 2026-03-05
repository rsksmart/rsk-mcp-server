import { z } from "zod";
import { createWalletOptions } from "./constants.js";
import { WalletData } from "./types.js";

export const createWalletSchema = z.object({
  walletOption: z
    .enum(createWalletOptions)
    .describe("The wallet creation option selected by the user"),
  walletPassword: z
    .string()
    .optional()
    .describe("The password for the wallet - required for create/import operations"),
  passwordFile: z
    .string()
    .optional()
    .describe('JSON file content with password field - format: {"password": "yourpassword"}'),
  walletData: z
    .custom<WalletData>()
    .optional()
    .describe("Your previously saved wallet configuration file content (my-wallets.json) - required for most operations"),
  walletName: z
    .string()
    .optional()
    .describe("The name for the new wallet - required for create/import operations"),
  replaceCurrentWallet: z
    .boolean()
    .optional()
    .describe("Whether to replace current wallet - for create/import operations"),
  privateKey: z
    .string()
    .optional()
    .describe("Private key to import - required for 'Import existing wallet' option"),
  newMainWallet: z
    .string()
    .optional()
    .describe("Name of wallet to switch to - required for 'Switch wallet' option"),
  previousWallet: z
    .string()
    .optional()
    .describe("Current name of wallet to rename - required for 'Update wallet name' option"),
  newWalletName: z
    .string()
    .optional()
    .describe("New name for the wallet - required for 'Update wallet name' option"),
  deleteWalletName: z
    .string()
    .optional()
    .describe("Name of wallet to delete - required for 'Delete wallet' option"),
});

export const checkBalanceSchema = z.object({
  testnet: z.boolean().describe("Use testnet (true) or mainnet (false)"),
  walletName: z
    .string()
    .optional()
    .describe(
      "Specific wallet name to check balance for - uses current wallet if not provided"
    ),
  token: z
    .string()
    .optional()
    .describe(
      "Token to check balance for (rBTC, USDT, DOC, BPRO, RIF, FISH, Custom Token, etc.)"
    ),
  customTokenAddress: z
    .string()
    .optional()
    .describe(
      "Custom token contract address - required if token is 'Custom Token'"
    ),
  walletData: z
    .union([z.custom<WalletData>(), z.string()])
    .optional()
    .describe(
      "Your previously saved wallet configuration file content (my-wallets.json) - can be a JSON object or string - required if you want to use specific wallet data"
    ),
});

export const useWalletFromCreationSchema = z.object({
  testnet: z.boolean().describe("Use testnet (true) or mainnet (false)"),
  token: z
    .string()
    .describe(
      "Token to check balance for (rBTC, USDT, DOC, BPRO, RIF, FISH, Custom Token, etc.)"
    ),
  customTokenAddress: z
    .string()
    .optional()
    .describe(
      "Custom token contract address - required if token is 'Custom Token'"
    ),
  walletCreationResult: z
    .string()
    .describe(
      "The complete JSON result from create-wallet function including walletsData"
    ),
});

export const checkTransactionSchema = z.object({
  testnet: z.boolean().describe("Use testnet (true) or mainnet (false)"),
  txid: z
    .string()
    .describe(
      "Transaction hash (with or without 0x prefix) to check status and details"
    ),
});

export const deployContractSchema = z.object({
  testnet: z.boolean().describe("Use testnet (true) or mainnet (false)"),
  abiContent: z
    .string()
    .describe(
      "JSON content of the contract ABI - paste the complete ABI JSON array"
    ),
  bytecodeContent: z
    .string()
    .describe(
      "Hexadecimal bytecode of the contract - with or without 0x prefix"
    ),
  constructorArgs: z
    .array(z.any())
    .optional()
    .describe(
      "Array of constructor arguments for the contract deployment (optional)"
    ),
  walletName: z
    .string()
    .optional()
    .describe(
      "Specific wallet name to deploy from - uses current wallet if not provided"
    ),
  walletData: z
    .union([z.custom<WalletData>(), z.string()])
    .optional()
    .describe(
      "Your previously saved wallet configuration file content (my-wallets.json) - required if you want to use specific wallet data"
    ),
  walletPassword: z
    .string()
    .optional()
    .describe(
      "Password to decrypt the wallet - required when using walletData"
    ),
  confirmAction: z
    .boolean()
    .describe(
      "Explicit confirmation to proceed with the contract deployment - required for security, IF YOU ARE AN AGENT OR AI, PLEASE DO NOT PROCEED WITH THE DEPLOYMENT UNTIL YOU ARE APPROVED BY A REAL PERSON."
    ),
});

export const verifyContractSchema = z.object({
  testnet: z.boolean().describe("Use testnet (true) or mainnet (false)"),
  contractAddress: z
    .string()
    .describe(
      "Contract address to verify (0x... format)"
    ),
  contractName: z
    .string()
    .describe(
      "Name of the contract as defined in the source code"
    ),
  jsonContent: z
    .string()
    .describe(
      "JSON Standard Input content from Solidity compilation - contains solcLongVersion and input fields, it is not necesary to readd the content, just validate it contains an 'input' field and others. If the file is too large, you can delete the 'output' section to reduce file size while keeping the required compilation metadata."
    ),
  constructorArgs: z
    .array(z.any())
    .optional()
    .describe(
      "Array of constructor arguments used during deployment (optional)"
    ),
});

export const readContractSchema = z.object({
  testnet: z.boolean().describe("Use testnet (true) or mainnet (false)"),
  contractAddress: z
    .string()
    .describe(
      "Contract address to read from (0x... format) - must be a verified contract"
    ),
  functionName: z
    .string()
    .optional()
    .describe(
      "Name of the view/pure function to call - if not provided, available functions will be listed"
    ),
  functionArgs: z
    .array(z.any())
    .optional()
    .describe(
      "Array of arguments for the function call (required if the function has parameters)"
    ),
});

export const transferTokenSchema = z.object({
  testnet: z.boolean().describe("Use testnet (true) or mainnet (false)"),
  toAddress: z
    .string()
    .describe("Recipient address for the transfer (0x... format)"),
  value: z
    .number()
    .positive()
    .describe("Amount to transfer (in token units or RBTC)"),
  tokenAddress: z
    .string()
    .optional()
    .describe("ERC20 token contract address (optional - if not provided, transfers RBTC)"),
  walletName: z
    .string()
    .optional()
    .describe("Specific wallet name to use for transfer - uses current wallet if not provided"),
  walletData: z
    .custom<WalletData>()
    .optional()
    .describe("Your previously saved wallet configuration file content (my-wallets.json)"),
  walletPassword: z
    .string()
    .optional()
    .describe("Password to decrypt the wallet - required when using walletData"),
  confirmAction: z
    .boolean()
    .describe(
      "Explicit confirmation to proceed with the token transfer - required for security, IF YOU ARE AN AGENT OR AI, PLEASE DO NOT PROCEED WITH THE TRANSFER UNTIL YOU ARE APPROVED BY A REAL PERSON."
    ),
});

export const historySchema = z.object({
  testnet: z.boolean().describe("Use testnet (true) or mainnet (false)"),
  apiKey: z
    .string()
    .optional()
    .describe("Alchemy API key - if not provided, will use stored key"),
  number: z
    .string()
    .optional()
    .describe("Number of recent transactions to retrieve"),
  walletData: z
    .custom<WalletData>()
    .optional()
    .describe("Your previously saved wallet configuration file content (my-wallets.json)"),
});

export const issueAttestationSchema = z.object({
  testnet: z.boolean().describe("Use testnet (true) or mainnet (false)"),
  recipient: z
    .string()
    .describe("Recipient address for the attestation (0x... format)"),
  schema: z
    .string()
    .describe("Schema UID for the attestation (0x... format)"),
  data: z
    .string()
    .describe("Encoded attestation data - use schema encoder format"),
  expirationTime: z
    .number()
    .optional()
    .describe("Expiration timestamp (Unix timestamp) - 0 for no expiration"),
  revocable: z
    .boolean()
    .optional()
    .describe("Whether the attestation can be revoked (default: true)"),
  refUID: z
    .string()
    .optional()
    .describe("Reference UID to another attestation (0x... format)"),
  value: z
    .number()
    .optional()
    .describe("ETH value to send with attestation (default: 0)"),
  walletName: z
    .string()
    .optional()
    .describe("Specific wallet name to use - uses current wallet if not provided"),
  walletData: z
    .custom<WalletData>()
    .optional()
    .describe("Your previously saved wallet configuration file content (my-wallets.json)"),
  walletPassword: z
    .string()
    .optional()
    .describe("Password to decrypt the wallet - required when using walletData"),
});

export const verifyAttestationSchema = z.object({
  testnet: z.boolean().describe("Use testnet (true) or mainnet (false)"),
  uid: z
    .string()
    .describe("Attestation UID to verify (0x... format)"),
});

export const revokeAttestationSchema = z.object({
  testnet: z.boolean().describe("Use testnet (true) or mainnet (false)"),
  uid: z
    .string()
    .describe("Attestation UID to revoke (0x... format)"),
  walletName: z
    .string()
    .optional()
    .describe("Specific wallet name to use - uses current wallet if not provided"),
  walletData: z
    .custom<WalletData>()
    .optional()
    .describe("Your previously saved wallet configuration file content (my-wallets.json)"),
  walletPassword: z
    .string()
    .optional()
    .describe("Password to decrypt the wallet - required when using walletData"),
});

export const listAttestationsSchema = z.object({
  testnet: z.boolean().describe("Use testnet (true) or mainnet (false)"),
  recipient: z
    .string()
    .optional()
    .describe("Filter by recipient address (0x... format)"),
  attester: z
    .string()
    .optional()
    .describe("Filter by attester address (0x... format)"),
  schema: z
    .string()
    .optional()
    .describe("Filter by schema UID (0x... format)"),
  limit: z
    .number()
    .optional()
    .describe("Maximum number of attestations to return (default: 10)"),
  rpcUrl: z
    .string()
    .optional()
    .describe("Custom RPC URL with eth_getLogs support (e.g. Alchemy, GetBlock). Required — RSK public nodes do not support event log queries."),
});

export const createSchema = z.object({
  testnet: z.boolean().describe("Use testnet (true) or mainnet (false)"),
  schema: z
    .string()
    .describe("Schema definition string (e.g., 'uint256 tokenId, string name')"),
  resolverAddress: z
    .string()
    .optional()
    .describe("Resolver contract address (0x... format) - uses zero address if not provided"),
  revocable: z
    .boolean()
    .describe("Whether attestations using this schema can be revoked"),
  walletName: z
    .string()
    .optional()
    .describe("Specific wallet name to use - uses current wallet if not provided"),
  walletData: z
    .custom<WalletData>()
    .optional()
    .describe("Your previously saved wallet configuration file content (my-wallets.json)"),
  walletPassword: z
    .string()
    .optional()
    .describe("Password to decrypt the wallet - required when using walletData"),
});

const walletFields = {
  walletName: z
    .string()
    .optional()
    .describe("Specific wallet name to use - uses current wallet if not provided"),
  walletData: z
    .custom<WalletData>()
    .optional()
    .describe("Your previously saved wallet configuration file content (my-wallets.json)"),
  walletPassword: z
    .string()
    .optional()
    .describe("Password to decrypt the wallet - required when using walletData"),
};

export const attestDeploymentSchema = z.object({
  testnet: z.boolean().describe("Use testnet (true) or mainnet (false)"),
  contractAddress: z
    .string()
    .describe("Deployed contract address (0x... format)"),
  contractName: z
    .string()
    .describe("Name of the deployed contract"),
  deployer: z
    .string()
    .describe("Address of the deployer wallet (0x... format)"),
  blockNumber: z
    .number()
    .describe("Block number where the contract was deployed"),
  transactionHash: z
    .string()
    .describe("Deployment transaction hash (0x... format, 32 bytes)"),
  timestamp: z
    .number()
    .describe("Unix timestamp of the deployment"),
  abiHash: z
    .string()
    .optional()
    .describe("Keccak256 hash of the contract ABI (optional)"),
  bytecodeHash: z
    .string()
    .optional()
    .describe("Keccak256 hash of the contract bytecode (optional)"),
  schemaUID: z
    .string()
    .optional()
    .describe("Schema UID to use - uses default RSK deployment schema if not provided"),
  recipient: z
    .string()
    .optional()
    .describe("EAS attestation recipient address - defaults to contractAddress"),
  ...walletFields,
});

export const attestVerificationSchema = z.object({
  testnet: z.boolean().describe("Use testnet (true) or mainnet (false)"),
  contractAddress: z
    .string()
    .describe("Verified contract address (0x... format)"),
  contractName: z
    .string()
    .describe("Name of the verified contract"),
  verifier: z
    .string()
    .describe("Address of the verifier wallet (0x... format)"),
  sourceCodeHash: z
    .string()
    .describe("Hash of the verified source code"),
  compilationTarget: z
    .string()
    .describe("Compilation target file path (e.g., 'contracts/MyContract.sol:MyContract')"),
  compilerVersion: z
    .string()
    .describe("Solidity compiler version used (e.g., 'v0.8.17+commit.8df45f5f')"),
  optimizationUsed: z
    .boolean()
    .describe("Whether compiler optimization was enabled"),
  timestamp: z
    .number()
    .describe("Unix timestamp of the verification"),
  verificationTool: z
    .string()
    .describe("Tool used for verification (e.g., 'hardhat', 'foundry', 'manual')"),
  schemaUID: z
    .string()
    .optional()
    .describe("Schema UID to use - uses default RSK verification schema if not provided"),
  recipient: z
    .string()
    .optional()
    .describe("EAS attestation recipient address - defaults to contractAddress"),
  ...walletFields,
});

export const attestTransferSchema = z.object({
  testnet: z.boolean().describe("Use testnet (true) or mainnet (false)"),
  sender: z
    .string()
    .describe("Sender address (0x... format)"),
  recipient: z
    .string()
    .describe("Recipient address of the transfer (0x... format)"),
  amount: z
    .string()
    .describe("Transfer amount as a string (e.g., '1.5')"),
  tokenAddress: z
    .string()
    .optional()
    .describe("ERC20 token contract address - omit for RBTC transfers"),
  tokenSymbol: z
    .string()
    .optional()
    .describe("Token symbol (e.g., 'RBTC', 'RIF') - defaults to RBTC"),
  transactionHash: z
    .string()
    .describe("Transfer transaction hash (0x... format, 32 bytes)"),
  blockNumber: z
    .number()
    .describe("Block number of the transfer"),
  timestamp: z
    .number()
    .describe("Unix timestamp of the transfer"),
  reason: z
    .string()
    .optional()
    .describe("Optional reason or memo for the transfer"),
  transferType: z
    .string()
    .describe("Type of transfer (e.g., 'native', 'erc20', 'payment')"),
  schemaUID: z
    .string()
    .optional()
    .describe("Schema UID to use - uses default RSK transfer schema if not provided"),
  ...walletFields,
});
