import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { balanceCommand } from "@rsksmart/rsk-cli/dist/src/commands/balance.js";
import { txCommand } from "@rsksmart/rsk-cli/dist/src/commands/tx.js";
import { createWalletOptions, generalInteractionOptions } from "./tools/constants.js";
import {
  checkBalanceSchema,
  checkTransactionSchema,
  createWalletSchema,
  deployContractSchema,
  historySchema,
  readContractSchema,
  transferTokenSchema,
  useWalletFromCreationSchema,
  verifyContractSchema,
  issueAttestationSchema,
  verifyAttestationSchema,
  revokeAttestationSchema,
  listAttestationsSchema,
  createSchema,
  attestDeploymentSchema,
  attestVerificationSchema,
  attestTransferSchema,
} from "./tools/schemas.js";
import { provideResponse } from "./handlers/responsesHandler.js";
import { ResponseType } from "./tools/types.js";
import { WalletService } from "./services/WalletService.js";
import { ContractDeploymentService } from "./services/ContractDeploymentService.js";
import { ContractVerificationService } from "./services/ContractVerificationService.js";
import { ContractReadService } from "./services/ContractReadService.js";
import { TransferService } from "./services/TransferService.js";
import { HistoryService } from "./services/HistoryService.js";
import { AttestationService } from "./services/AttestationService.js";
import {
  returnCheckBalanceSuccess,
  returnContractDeployedSuccessfully,
  returnContractReadSuccessfully,
  returnContractVerifiedSuccessfully,
  returnCustomTokenAddress,
  returnErrorInvalidWalletData,
  returnErrorTxNotFound,
  returnHistoryRetrievedSuccessfully,
  returnToCheckBalance,
  returnTokenSelectionOptions,
  returnTransactionFound,
  returnTransferCompletedSuccessfully,
  returnWalletCreatedSuccessfully,
  returnAttestationIssuedSuccessfully,
  returnAttestationVerifiedSuccessfully,
  returnAttestationRevokedSuccessfully,
  returnAttestationsListedSuccessfully,
  returnSchemaCreatedSuccessfully,
  returnDeploymentAttestedSuccessfully,
  returnVerificationAttestedSuccessfully,
  returnTransferAttestedSuccessfully,
} from "./utils/responses.js";

interface PendingOperation {
  id: string;
  type: 'deploy' | 'transfer';
  operation: string;
  parameters: any;
  timestamp: number;
  requiresConfirmation: boolean;
}

const pendingOperations = new Map<string, PendingOperation>();

function generateOperationId(): string {
  return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function cleanExpiredOperations(): void {
  const now = Date.now();
  for (const [id, op] of pendingOperations.entries()) {
    if (now - op.timestamp > 300000) {
      pendingOperations.delete(id);
    }
  }
}

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "rsk-mcp-server",
    version: "0.2.2",
  });

  return server;
}

export function configureMcpTools(server: McpServer): void {
  server.tool(
    "start-interaction",
    "Start interaction with the Rootstock CLI functions, start this once someone ask something related to the rootstock (rsk) blockchain",
    {},
    async () => {
      const optionsText = generalInteractionOptions
        .map((option, index) => `${index + 1}. ${option} \n`)
        .join("\n");
      return provideResponse(optionsText, ResponseType.Interaction);
    }
  );

  server.tool(
    "start-wallet-interaction", 
    "Start wallet management interaction. This shows all available wallet operations and management options.",
    {},
    async () => {
      const optionsText = createWalletOptions
        .map((option, index) => `${index + 1}. ${option}`)
        .join("\n");
      return provideResponse(optionsText, ResponseType.Interaction);
    }
  );

  server.tool(
    "list-pending-operations",
    "List all pending operations that require user confirmation",
    {},
    async () => {
      cleanExpiredOperations();
      
      const operations = Array.from(pendingOperations.values())
        .map(op => ({
          id: op.id,
          type: op.type,
          operation: op.operation,
          timestamp: new Date(op.timestamp).toISOString(),
          requiresConfirmation: op.requiresConfirmation
        }));

      if (operations.length === 0) {
        return provideResponse(
          "**No Pending Operations**\n\nThere are no operations waiting for confirmation.",
          ResponseType.Interaction
        );
      }

      const operationsList = operations
        .map(op => `**${op.id}**\n   Type: ${op.type}\n   Operation: ${op.operation}\n   Time: ${op.timestamp}`)
        .join('\n\n');

      return provideResponse(
        `**Pending Operations Requiring Confirmation**\n\n${operationsList}\n\n**To confirm an operation, use**: confirm-operation with the operation ID`,
        ResponseType.Interaction
      );
    }
  );

  server.tool(
    "confirm-operation",
    "Confirm and execute a pending operation",
    { operationId: z.string().describe("The ID of the operation to confirm") },
    async ({ operationId }) => {
      cleanExpiredOperations();
      
      if (!operationId) {
        return provideResponse(
          "**Missing Operation ID**\n\nPlease provide an operation ID to confirm.",
          ResponseType.ErrorTryAgain
        );
      }

      const operation = pendingOperations.get(operationId);
      if (!operation) {
        return provideResponse(
          `**Operation Not Found**\n\nOperation ID '${operationId}' not found or has expired.\n\nUse 'list-pending-operations' to see available operations.`,
          ResponseType.ErrorTryAgain
        );
      }

      pendingOperations.delete(operationId);
      console.warn(`**OPERATION CONFIRMED**: ${operationId} - ${operation.operation}`);

      if (operation.type === 'deploy') {
        const deploymentService = new ContractDeploymentService();
        const result = await deploymentService.processContractDeployment(operation.parameters);
        
        if (result.success) {
          return provideResponse(
            returnContractDeployedSuccessfully("", result.data),
            ResponseType.ContractDeployedSuccessfully
          );
        } else {
          return provideResponse(
            result.error || "Contract deployment failed with unknown error", 
            ResponseType.ErrorDeployingContract
          );
        }
      } else if (operation.type === 'transfer') {
        const transferService = new TransferService();
        const result = await transferService.processTransfer(operation.parameters);
        
        if (result.success) {
          const networkName = result.data.network || (operation.parameters.testnet ? "Rootstock Testnet" : "Rootstock Mainnet");
          return provideResponse(
            returnTransferCompletedSuccessfully(networkName, result.data),
            ResponseType.TransferCompletedSuccessfully
          );
        } else {
          return provideResponse(
            result.error || "Transfer failed with unknown error",
            ResponseType.ErrorTransferFailed
          );
        }
      }

      return provideResponse(
        "**Unknown Operation Type**\n\nThe operation type is not supported.",
        ResponseType.ErrorTryAgain
      );
    }
  );

  server.tool(
    "cancel-operation",
    "Cancel a pending operation",
    { operationId: z.string().describe("The ID of the operation to cancel") },
    async ({ operationId }) => {
      cleanExpiredOperations();
      
      if (!operationId) {
        return provideResponse(
          "**Missing Operation ID**\n\nPlease provide an operation ID to cancel.",
          ResponseType.ErrorTryAgain
        );
      }

      const operation = pendingOperations.get(operationId);
      if (!operation) {
        return provideResponse(
          `**Operation Not Found**\n\nOperation ID '${operationId}' not found or has already expired.\n\nUse 'list-pending-operations' to see available operations.`,
          ResponseType.ErrorTryAgain
        );
      }

      pendingOperations.delete(operationId);
      console.warn(`OPERATION CANCELLED: ${operationId} - ${operation.operation}`);

      return provideResponse(
        `**Operation Cancelled**\n\n**Operation ID**: \`${operationId}\`\n**Operation**: ${operation.operation}\n\nThe operation has been successfully cancelled and removed from pending operations.`,
        ResponseType.Interaction
      );
    }
  );

  server.tool(
    "create-wallet",
    "Create a new wallet based on the selected option. This function will ask for required information step by step.",
    createWalletSchema.shape,
    async ({
      walletOption,
      walletPassword,
      passwordFile,
      walletData,
      walletName,
      replaceCurrentWallet,
      privateKey,
      newMainWallet,
      previousWallet,
      newWalletName,
      deleteWalletName,
    }) => {
      if (!createWalletOptions.includes(walletOption as any)) {
        return provideResponse(
          `**Invalid Option**\n\nThe option "${walletOption}" is not recognized. Please select a valid option.`,
          ResponseType.ErrorTryAgain
        );
      }

      const walletService = new WalletService();

      const result = await walletService.processWalletOperation({
        walletOption,
        walletPassword,
        passwordFile,
        walletData,
        walletName,
        replaceCurrentWallet,
        privateKey,
        newMainWallet,
        previousWallet,
        newWalletName,
        deleteWalletName,
      });

      if (result.success) {
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          returnWalletCreatedSuccessfully(walletOption, [
            result.data.result,
            result.data.walletConfig,
          ]),
          ResponseType[responseType] || ResponseType.WalletCreatedSuccessfully
        );
      } else {
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          result.error || "Unknown error occurred",
          ResponseType[responseType] || ResponseType.ErrorTryAgain
        );
      }
    }
  );

  server.tool(
    "check-balance",
    "Check the balance of a wallet for RBTC or ERC20 tokens on Rootstock blockchain. You can either use an existing wallet file or provide wallet data directly.",
    checkBalanceSchema.shape,
    async ({ testnet, walletName, token, customTokenAddress, walletData }) => {
      try {
        const missingInfo = [];

        if (!token) {
          missingInfo.push(returnTokenSelectionOptions());
        }

        if (token === "Custom Token" && !customTokenAddress) {
          missingInfo.push(returnCustomTokenAddress());
        }

        if (missingInfo.length > 0) {
          return provideResponse(
            returnToCheckBalance("", missingInfo),
            ResponseType.ToCheckBalance
          );
        }

        let processedWalletData = walletData;
        if (typeof walletData === "string") {
          try {
            processedWalletData = JSON.parse(walletData);
          } catch (error) {
            return provideResponse(
              returnErrorInvalidWalletData(
                error instanceof Error ? error.message : String(error)
              ),
              ResponseType.ErrorInvalidWalletData
            );
          }
        }

        const result = await balanceCommand({
          testnet,
          walletName,
          holderAddress: undefined,
          isExternal: true,
          token,
          customTokenAddress,
          walletsData: processedWalletData
        });

        if (result?.success && result.data) {
          const { data } = result;

          return provideResponse(
            returnCheckBalanceSuccess("", data),
            ResponseType.CheckBalanceSuccess
          );
        }

        return provideResponse(
          result?.error || "Unknown error occurred",
          ResponseType.ErrorCheckingBalance
        );
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return provideResponse(
          errorMsg,
          ResponseType.ErrorCheckingBalance
        );
        
      }
    }
  );

  server.tool(
    "use-wallet-from-creation",
    "Use wallet data directly from a previous wallet creation result. This helps avoid re-uploading files.",
    useWalletFromCreationSchema.shape,
    async ({ testnet, token, customTokenAddress, walletCreationResult }) => {
      try {
        const walletService = new WalletService();

        const result = await walletService.checkBalanceFromCreation({
          testnet,
          token,
          customTokenAddress,
          walletCreationResult,
        });

        if (result.success) {
          return {
            content: [
              {
                type: "text",
                text: walletService.formatBalanceFromCreationResponse(result.data),
              },
            ],
          };
        } else {
          const isParsingError = result.error?.includes("Invalid wallet creation result format") || 
                                result.error?.includes("Invalid wallet data structure");
          
          return {
            content: [
              {
                type: "text",
                text: walletService.formatErrorFromCreationResponse(result.error!, isParsingError),
              },
            ],
          };
        }
      } catch (error) {
        const walletService = new WalletService();
        const errorMsg = error instanceof Error ? error.message : String(error);
        
        return {
          content: [
            {
              type: "text",
              text: `**Error processing wallet data**

Error: ${errorMsg}

Please ensure you're providing the complete wallet creation result.`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "check-transaction",
    "Check the status and details of a transaction on Rootstock blockchain using the transaction hash",
    checkTransactionSchema.shape,
    async ({ testnet, txid }) => {
      try {
        if (!txid || txid.trim().length === 0) {
          return provideResponse(
            "",
            ResponseType.ErrorTXIdRequired
          );
        }

        const cleanTxid = txid.trim();

        const txidRegex = /^(0x)?[a-fA-F0-9]{64}$/;
        if (!txidRegex.test(cleanTxid)) {
          return provideResponse(
            cleanTxid,
            ResponseType.ErrorTXHashInvalid
          );
        }

        const result = await txCommand({
          testnet,
          txid: cleanTxid,
          isExternal: true
        });

        if (result?.success && result.data) {
          const { data } = result;

          return provideResponse(
            returnTransactionFound(testnet ? "testnet" : "mainnet", data),
            ResponseType.TransactionFound
          );
        }

        return provideResponse(
          returnErrorTxNotFound(
            result?.error || "Transaction not found or unknown error occurred",
            [testnet ? "testnet" : "mainnet"]
          ),
          ResponseType.ErrorTxNotFound
        );
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return provideResponse(
          errorMsg,
          ResponseType.ErrorCheckingTransaction
        );
      }
    }
  );

  server.tool(
    "deploy-contract",
    "Deploy a smart contract to the Rootstock blockchain using ABI and bytecode",
    deployContractSchema.shape,
    async ({ testnet, abiContent, bytecodeContent, constructorArgs, walletName, walletData, walletPassword, confirmAction }) => {
      console.warn('CRITICAL OPERATION: Contract deployment requested');
      console.warn('Confirmation status:', confirmAction);
      console.warn('Network:', testnet ? 'Testnet' : 'Mainnet');
      
      if (confirmAction !== true) {
        cleanExpiredOperations();
        
        const operationId = generateOperationId();
        const network = testnet ? "Rootstock Testnet" : "Rootstock Mainnet";
        let contractName = "Smart Contract";
        
        try {
          const abi = JSON.parse(abiContent);
          const constructorAbi = abi.find((item: any) => item.type === 'constructor');
          if (constructorAbi && constructorAbi.name) {
            contractName = constructorAbi.name;
          }
        } catch (error) {
          
        }
        
        pendingOperations.set(operationId, {
          id: operationId,
          type: 'deploy',
          operation: `Deploy ${contractName} to ${network}`,
          parameters: { testnet, abiContent, bytecodeContent, constructorArgs, walletName, walletData, walletPassword },
          timestamp: Date.now(),
          requiresConfirmation: true
        });
        
        return provideResponse(
          `**CRITICAL OPERATION PENDING**\n\n**Operation Details:**\n**Contract**: ${contractName}\n**Network**: ${network}\n**Operation ID**: \`${operationId}\`\n\n**This operation requires explicit confirmation for security.**\n\n**Next Steps:**\n1. Review the operation details carefully\n2. Use \`confirm-operation\` with ID: \`${operationId}\`\n3. Or use \`list-pending-operations\` to see all pending operations\n\n**This operation will expire in 5 minutes**`,
          ResponseType.ContractDeploymentConfirmation
        );
      }
      
      console.warn('CRITICAL OPERATION CONFIRMED: Proceeding with contract deployment');

      const deploymentService = new ContractDeploymentService();

      const result = await deploymentService.processContractDeployment({
        testnet,
        abiContent,
        bytecodeContent,
        constructorArgs,
        walletName,
        walletData,
        walletPassword,
      });

      if (result.success) {
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          returnContractDeployedSuccessfully("", result.data),
          ResponseType[responseType] || ResponseType.ContractDeployedSuccessfully
        );
      } else {
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          result.error || "Contract deployment failed with unknown error",
          ResponseType[responseType] || ResponseType.ErrorDeployingContract
        );
      }
    }
  );

  server.tool(
    "verify-contract",
    "Verify a smart contract on the Rootstock blockchain using source code and compilation metadata",
    verifyContractSchema.shape,
    async ({ testnet, contractAddress, contractName, jsonContent, constructorArgs }) => {
      const verificationService = new ContractVerificationService();

      const result = await verificationService.processContractVerification({
        testnet,
        contractAddress,
        contractName,
        jsonContent,
        constructorArgs,
      });

      if (result.success) {
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          returnContractVerifiedSuccessfully("", result.data),
          ResponseType[responseType] || ResponseType.ContractVerifiedSuccessfully
        );
      } else {
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          result.error || "Contract verification failed with unknown error",
          ResponseType[responseType] || ResponseType.ErrorVerifyingContract
        );
      }
    }
  );

  server.tool(
    "read-contract",
    "Read data from a verified smart contract on the Rootstock blockchain by calling view/pure functions",
    readContractSchema.shape,
    async ({ testnet, contractAddress, functionName, functionArgs }) => {
      const contractReadService = new ContractReadService();

      const result = await contractReadService.processContractRead({
        testnet,
        contractAddress,
        functionName,
        functionArgs,
      });

      if (result.success) {
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          returnContractReadSuccessfully("", result.data),
          ResponseType[responseType] || ResponseType.ContractReadSuccessfully
        );
      } else {
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          result.error || "Contract reading failed with unknown error",
          ResponseType[responseType] || ResponseType.ErrorReadingContract
        );
      }
    }
  );

  server.tool(
    "transfer-tokens",
    "Transfer RBTC or ERC20 tokens on Rootstock blockchain between wallets",
    transferTokenSchema.shape,
    async ({ testnet, toAddress, value, tokenAddress, walletName, walletData, walletPassword, confirmAction }) => {
      console.warn('CRITICAL OPERATION: Token transfer requested');
      console.warn('Confirmation status:', confirmAction);
      console.warn('Amount:', value, tokenAddress ? 'ERC20' : 'RBTC');
      console.warn('To:', toAddress);
      console.warn('🌐 Network:', testnet ? 'Testnet' : 'Mainnet');
      
      if (confirmAction !== true) {
        cleanExpiredOperations();
        
        const operationId = generateOperationId();
        const network = testnet ? "Rootstock Testnet" : "Rootstock Mainnet";
        const token = tokenAddress ? "ERC20 Token" : "RBTC";
        
        pendingOperations.set(operationId, {
          id: operationId,
          type: 'transfer',
          operation: `Transfer ${value} ${token} to ${toAddress.substring(0, 6)}...${toAddress.substring(38)} on ${network}`,
          parameters: { testnet, toAddress, value, tokenAddress, walletName, walletData, walletPassword },
          timestamp: Date.now(),
          requiresConfirmation: true
        });
        
        return provideResponse(
          `⚠️ **CRITICAL OPERATION PENDING**\n\n**Transfer Details:**\n**Amount**: ${value} ${token}\n**To**: ${toAddress}\n**Network**: ${network}\n**Operation ID**: \`${operationId}\`\n\n**This operation requires explicit confirmation for security.**\n\n**Next Steps:**\n1. Review the transfer details carefully\n2. Use \`confirm-operation\` with ID: \`${operationId}\`\n3. Or use \`list-pending-operations\` to see all pending operations\n\n**This operation will expire in 5 minutes**`,
          ResponseType.TransferConfirmation
        );
      }
      
      console.warn('CRITICAL OPERATION CONFIRMED: Proceeding with token transfer');

      const transferService = new TransferService();

      const result = await transferService.processTransfer({
        testnet,
        toAddress,
        value,
        tokenAddress,
        walletName,
        walletData,
        walletPassword,
      });

      if (result.success) {
        const networkName = result.data.network || (testnet ? "Rootstock Testnet" : "Rootstock Mainnet");
        const responseType = result.responseType as keyof typeof ResponseType;
        
        return provideResponse(
          returnTransferCompletedSuccessfully(networkName, result.data),
          ResponseType[responseType] || ResponseType.TransferCompletedSuccessfully
        );
      } else {
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          result.error || "Transfer failed with unknown error",
          ResponseType[responseType] || ResponseType.ErrorTransferFailed
        );
      }
    }
  );

  server.tool(
    "check-transaction-history",
    "Check the transaction history of a wallet on Rootstock blockchain using Alchemy API",
    historySchema.shape,
    async ({ testnet, apiKey, number, walletData }) => {
      const historyService = new HistoryService();

      const result = await historyService.processHistory({
        testnet,
        apiKey,
        number,
        walletData,
      });

      if (result.success) {
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          returnHistoryRetrievedSuccessfully(result.data),
          ResponseType[responseType] || ResponseType.HistoryRetrievedSuccessfully
        );
      } else {
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          result.error || "Failed to retrieve transaction history",
          ResponseType[responseType] || ResponseType.ErrorRetrievingHistory
        );
      }
    }
  );

  server.tool(
    "issue-attestation",
    "Issue a new attestation on Rootstock network using RAS (Rootstock Attestation Service)",
    issueAttestationSchema.shape,
    async ({ testnet, recipient, schema, data, expirationTime, revocable, refUID, value, walletName, walletData, walletPassword }) => {
      const attestationService = new AttestationService();

      const result = await attestationService.processIssueAttestation({
        testnet,
        recipient,
        schema,
        data,
        expirationTime,
        revocable,
        refUID,
        value,
        walletName,
        walletData,
        walletPassword,
      });

      if (result.success) {
        const networkName = testnet ? "Rootstock Testnet" : "Rootstock Mainnet";
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          returnAttestationIssuedSuccessfully(networkName, result.data),
          ResponseType[responseType] || ResponseType.AttestationIssuedSuccessfully
        );
      } else {
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          result.error || "Failed to issue attestation",
          ResponseType[responseType] || ResponseType.ErrorIssuingAttestation
        );
      }
    }
  );

  server.tool(
    "verify-attestation",
    "Verify an existing attestation by UID on Rootstock network",
    verifyAttestationSchema.shape,
    async ({ testnet, uid }) => {
      const attestationService = new AttestationService();

      const result = await attestationService.processVerifyAttestation({
        testnet,
        uid,
      });

      if (result.success) {
        const networkName = testnet ? "Rootstock Testnet" : "Rootstock Mainnet";
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          returnAttestationVerifiedSuccessfully(networkName, result.data),
          ResponseType[responseType] || ResponseType.AttestationVerifiedSuccessfully
        );
      } else {
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          result.error || "Failed to verify attestation",
          ResponseType[responseType] || ResponseType.ErrorVerifyingAttestation
        );
      }
    }
  );

  server.tool(
    "revoke-attestation",
    "Revoke an existing attestation by UID on Rootstock network",
    revokeAttestationSchema.shape,
    async ({ testnet, uid, walletName, walletData, walletPassword }) => {
      const attestationService = new AttestationService();

      const result = await attestationService.processRevokeAttestation({
        testnet,
        uid,
        walletName,
        walletData,
        walletPassword,
      });

      if (result.success) {
        const networkName = testnet ? "Rootstock Testnet" : "Rootstock Mainnet";
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          returnAttestationRevokedSuccessfully(networkName, result.data),
          ResponseType[responseType] || ResponseType.AttestationRevokedSuccessfully
        );
      } else {
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          result.error || "Failed to revoke attestation",
          ResponseType[responseType] || ResponseType.ErrorRevokingAttestation
        );
      }
    }
  );

  server.tool(
    "list-attestations",
    "List attestations on Rootstock network by querying EAS contract event logs. Requires a custom rpcUrl — RSK public nodes do not support eth_getLogs.",
    listAttestationsSchema.shape,
    async ({ testnet, recipient, attester, schema, limit, rpcUrl }) => {
      const attestationService = new AttestationService();

      const result = await attestationService.processListAttestations({
        testnet,
        recipient,
        attester,
        schema,
        limit,
        rpcUrl,
      });

      if (result.success) {
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          returnAttestationsListedSuccessfully(result.data),
          ResponseType[responseType] || ResponseType.AttestationsListedSuccessfully
        );
      } else {
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          result.error || "Failed to list attestations",
          ResponseType[responseType] || ResponseType.ErrorListingAttestations
        );
      }
    }
  );

  server.tool(
    "create-schema",
    "Create a new attestation schema on Rootstock network",
    createSchema.shape,
    async ({ testnet, schema, resolverAddress, revocable, walletName, walletData, walletPassword }) => {
      const attestationService = new AttestationService();

      const result = await attestationService.processCreateSchema({
        testnet,
        schema,
        resolverAddress,
        revocable,
        walletName,
        walletData,
        walletPassword,
      });

      if (result.success) {
        const networkName = testnet ? "Rootstock Testnet" : "Rootstock Mainnet";
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          returnSchemaCreatedSuccessfully(networkName, result.data),
          ResponseType[responseType] || ResponseType.SchemaCreatedSuccessfully
        );
      } else {
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          result.error || "Failed to create schema",
          ResponseType[responseType] || ResponseType.ErrorCreatingSchema
        );
      }
    }
  );

  server.tool(
    "attest-deployment",
    "Create a deployment attestation on Rootstock using RAS. Uses default testnet schema UIDs when none is provided.",
    attestDeploymentSchema.shape,
    async ({ testnet, contractAddress, contractName, deployer, blockNumber, transactionHash, timestamp, abiHash, bytecodeHash, schemaUID, recipient, walletName, walletData, walletPassword }) => {
      const attestationService = new AttestationService();

      const result = await attestationService.processDeploymentAttestation({
        testnet,
        contractAddress,
        contractName,
        deployer,
        blockNumber,
        transactionHash,
        timestamp,
        abiHash,
        bytecodeHash,
        schemaUID,
        recipient,
        walletName,
        walletData,
        walletPassword,
      });

      if (result.success) {
        const networkName = testnet ? "Rootstock Testnet" : "Rootstock Mainnet";
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          returnDeploymentAttestedSuccessfully(networkName, result.data),
          ResponseType[responseType] || ResponseType.DeploymentAttestedSuccessfully
        );
      } else {
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          result.error || "Failed to create deployment attestation",
          ResponseType[responseType] || ResponseType.ErrorAttestingDeployment
        );
      }
    }
  );

  server.tool(
    "attest-verification",
    "Create a contract verification attestation on Rootstock using RAS. Uses default testnet schema UIDs when none is provided.",
    attestVerificationSchema.shape,
    async ({ testnet, contractAddress, contractName, verifier, sourceCodeHash, compilationTarget, compilerVersion, optimizationUsed, timestamp, verificationTool, schemaUID, recipient, walletName, walletData, walletPassword }) => {
      const attestationService = new AttestationService();

      const result = await attestationService.processVerificationAttestation({
        testnet,
        contractAddress,
        contractName,
        verifier,
        sourceCodeHash,
        compilationTarget,
        compilerVersion,
        optimizationUsed,
        timestamp,
        verificationTool,
        schemaUID,
        recipient,
        walletName,
        walletData,
        walletPassword,
      });

      if (result.success) {
        const networkName = testnet ? "Rootstock Testnet" : "Rootstock Mainnet";
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          returnVerificationAttestedSuccessfully(networkName, result.data),
          ResponseType[responseType] || ResponseType.VerificationAttestedSuccessfully
        );
      } else {
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          result.error || "Failed to create verification attestation",
          ResponseType[responseType] || ResponseType.ErrorAttestingVerification
        );
      }
    }
  );

  server.tool(
    "attest-transfer",
    "Create a transfer attestation on Rootstock using RAS. Uses default testnet schema UIDs when none is provided.",
    attestTransferSchema.shape,
    async ({ testnet, sender, recipient, amount, tokenAddress, tokenSymbol, transactionHash, blockNumber, timestamp, reason, transferType, schemaUID, walletName, walletData, walletPassword }) => {
      const attestationService = new AttestationService();

      const result = await attestationService.processTransferAttestation({
        testnet,
        sender,
        recipient,
        amount,
        tokenAddress,
        tokenSymbol,
        transactionHash,
        blockNumber,
        timestamp,
        reason,
        transferType,
        schemaUID,
        walletName,
        walletData,
        walletPassword,
      });

      if (result.success) {
        const networkName = testnet ? "Rootstock Testnet" : "Rootstock Mainnet";
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          returnTransferAttestedSuccessfully(networkName, result.data),
          ResponseType[responseType] || ResponseType.TransferAttestedSuccessfully
        );
      } else {
        const responseType = result.responseType as keyof typeof ResponseType;
        return provideResponse(
          result.error || "Failed to create transfer attestation",
          ResponseType[responseType] || ResponseType.ErrorAttestingTransfer
        );
      }
    }
  );
}
