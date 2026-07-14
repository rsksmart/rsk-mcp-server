import {
  RSK_ATTESTATION_CONFIG,
  DEFAULT_SCHEMA_UIDS,
  DEPLOYMENT_SCHEMA,
  VERIFICATION_SCHEMA,
  TRANSFER_SCHEMA,
} from "../utils/attestationConstants.js";
import { createAttestationSigner } from "../utils/walletSigner.js";
import { WalletData } from "../tools/types.js";
import { ethers } from "ethers";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export interface AttestationServiceResult {
  success: boolean;
  data?: any;
  error?: string;
  responseType?: string;
}

export interface IssueAttestationParams {
  testnet: boolean;
  recipient: string;
  schema: string;
  data: string;
  expirationTime?: number;
  revocable?: boolean;
  refUID?: string;
  value?: number;
  walletName?: string;
  walletData?: WalletData;
  walletPassword?: string;
}

export interface VerifyAttestationParams {
  testnet: boolean;
  uid: string;
}

export interface RevokeAttestationParams {
  testnet: boolean;
  uid: string;
  walletName?: string;
  walletData?: WalletData;
  walletPassword?: string;
}

export interface ListAttestationsParams {
  testnet: boolean;
  recipient?: string;
  attester?: string;
  schema?: string;
  limit?: number;
  rpcUrl?: string;
}

export interface CreateSchemaParams {
  testnet: boolean;
  schema: string;
  resolverAddress?: string;
  revocable: boolean;
  walletName?: string;
  walletData?: WalletData;
  walletPassword?: string;
}

export interface AttestDeploymentParams {
  testnet: boolean;
  contractAddress: string;
  contractName: string;
  deployer: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
  abiHash?: string;
  bytecodeHash?: string;
  schemaUID?: string;
  recipient?: string;
  walletName?: string;
  walletData?: WalletData;
  walletPassword?: string;
}

export interface AttestVerificationParams {
  testnet: boolean;
  contractAddress: string;
  contractName: string;
  verifier: string;
  sourceCodeHash: string;
  compilationTarget: string;
  compilerVersion: string;
  optimizationUsed: boolean;
  timestamp: number;
  verificationTool: string;
  schemaUID?: string;
  recipient?: string;
  walletName?: string;
  walletData?: WalletData;
  walletPassword?: string;
}

export interface AttestTransferParams {
  testnet: boolean;
  sender: string;
  recipient: string;
  amount: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  reason?: string;
  transferType: string;
  schemaUID?: string;
  walletName?: string;
  walletData?: WalletData;
  walletPassword?: string;
}

function getEasViewerUrl(uid: string, testnet: boolean = false): string {
  return testnet
    ? `https://explorer.testnet.rootstock.io/ras/attestation/${uid}`
    : `https://explorer.rootstock.io/ras/attestation/${uid}`;
}

function initializeEAS(contractAddress: string, runner: ethers.ContractRunner) {
  const easSdk = require("@ethereum-attestation-service/eas-sdk");
  const EAS = easSdk.EAS;
  const eas = new EAS(contractAddress);
  eas.connect(runner);
  return eas;
}

async function submitAttestation(
  signer: ethers.Signer,
  testnet: boolean,
  schemaUID: string,
  schemaDefinition: string,
  fields: { name: string; value: any; type: string }[],
  recipient: string
): Promise<string | null> {
  try {
    const config = testnet ? RSK_ATTESTATION_CONFIG.testnet : RSK_ATTESTATION_CONFIG.mainnet;
    const eas = initializeEAS(config.contractAddress, signer);

    const easSdk = require("@ethereum-attestation-service/eas-sdk");
    const schemaEncoder = new easSdk.SchemaEncoder(schemaDefinition);
    const encodedData = schemaEncoder.encodeData(fields);

    const tx = await eas.attest({
      schema: schemaUID as `0x${string}`,
      data: {
        recipient: recipient as `0x${string}`,
        expirationTime: 0n,
        revocable: true,
        data: encodedData
      }
    });

    return await tx.wait();
  } catch {
    return null;
  }
}

export class AttestationService {
  async processIssueAttestation(params: IssueAttestationParams): Promise<AttestationServiceResult> {
    try {
      const signer = await createAttestationSigner({
        testnet: params.testnet,
        walletName: params.walletName,
        isExternal: true,
        walletsData: params.walletData,
        password: params.walletPassword
      });

      if (!signer) {
        return {
          success: false,
          error: "Failed to create wallet signer. Ensure wallet data and password are correct.",
          responseType: "ErrorIssuingAttestation"
        };
      }

      const config = params.testnet ? RSK_ATTESTATION_CONFIG.testnet : RSK_ATTESTATION_CONFIG.mainnet;
      const eas = initializeEAS(config.contractAddress, signer);

      const attestationData = {
        recipient: params.recipient as `0x${string}`,
        expirationTime: BigInt(params.expirationTime || 0),
        revocable: params.revocable !== false,
        refUID: (params.refUID || "0x0000000000000000000000000000000000000000000000000000000000000000") as `0x${string}`,
        data: params.data,
        value: BigInt(params.value || 0)
      };

      const tx = await eas.attest({
        schema: params.schema as `0x${string}`,
        data: attestationData
      });

      const uid = await tx.wait();

      return {
        success: true,
        data: {
          uid,
          recipient: params.recipient,
          schema: params.schema,
          viewUrl: getEasViewerUrl(uid, params.testnet)
        },
        responseType: "AttestationIssuedSuccessfully"
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Failed to issue attestation: ${errorMessage}`,
        responseType: "ErrorIssuingAttestation"
      };
    }
  }

  async processVerifyAttestation(params: VerifyAttestationParams): Promise<AttestationServiceResult> {
    try {
      const rpcUrl = params.testnet
        ? "https://public-node.testnet.rsk.co"
        : "https://public-node.rsk.co";
      const chainId = params.testnet ? 31 : 30;
      const provider = new ethers.JsonRpcProvider(rpcUrl, chainId, { staticNetwork: true });

      const config = params.testnet ? RSK_ATTESTATION_CONFIG.testnet : RSK_ATTESTATION_CONFIG.mainnet;
      const eas = initializeEAS(config.contractAddress, provider);

      const attestation = await eas.getAttestation(params.uid as `0x${string}`);

      if (!attestation) {
        return {
          success: false,
          error: "Attestation not found",
          responseType: "ErrorVerifyingAttestation"
        };
      }

      const exists = attestation.uid !== "0x0000000000000000000000000000000000000000000000000000000000000000";
      const isRevoked = attestation.revocationTime > 0n;
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      const isExpired = attestation.expirationTime > 0n && attestation.expirationTime <= currentTime;
      const isValid = exists && !isRevoked && !isExpired;

      let status = "valid";
      if (!exists) status = "not_found";
      else if (isRevoked) status = "revoked";
      else if (isExpired) status = "expired";

      return {
        success: true,
        data: {
          uid: params.uid,
          valid: isValid,
          status,
          attestation: {
            attester: attestation.attester,
            recipient: attestation.recipient,
            schema: attestation.schema,
            time: Number(attestation.time),
            expirationTime: Number(attestation.expirationTime),
            revocationTime: Number(attestation.revocationTime),
            data: attestation.data
          }
        },
        responseType: "AttestationVerifiedSuccessfully"
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Failed to verify attestation: ${errorMessage}`,
        responseType: "ErrorVerifyingAttestation"
      };
    }
  }

  async processRevokeAttestation(params: RevokeAttestationParams): Promise<AttestationServiceResult> {
    try {
      const signer = await createAttestationSigner({
        testnet: params.testnet,
        walletName: params.walletName,
        isExternal: true,
        walletsData: params.walletData,
        password: params.walletPassword
      });

      if (!signer) {
        return {
          success: false,
          error: "Failed to create wallet signer",
          responseType: "ErrorRevokingAttestation"
        };
      }

      const config = params.testnet ? RSK_ATTESTATION_CONFIG.testnet : RSK_ATTESTATION_CONFIG.mainnet;
      const eas = initializeEAS(config.contractAddress, signer);

      const attestation = await eas.getAttestation(params.uid as `0x${string}`);

      if (!attestation || attestation.uid === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        return {
          success: false,
          error: "Attestation not found",
          responseType: "ErrorRevokingAttestation"
        };
      }

      const tx = await eas.revoke({
        schema: attestation.schema as `0x${string}`,
        data: {
          uid: params.uid as `0x${string}`,
          value: 0n
        }
      });

      const txHash = await tx.wait();

      return {
        success: true,
        data: {
          uid: params.uid,
          transactionHash: txHash,
          viewUrl: getEasViewerUrl(params.uid, params.testnet)
        },
        responseType: "AttestationRevokedSuccessfully"
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Failed to revoke attestation: ${errorMessage}`,
        responseType: "ErrorRevokingAttestation"
      };
    }
  }

  async processListAttestations(params: ListAttestationsParams): Promise<AttestationServiceResult> {
    try {
      const rpcUrl = params.rpcUrl ?? (params.testnet
        ? "https://public-node.testnet.rsk.co"
        : "https://public-node.rsk.co");
      const chainId = params.testnet ? 31 : 30;
      const provider = new ethers.JsonRpcProvider(rpcUrl, chainId, { staticNetwork: true });

      const config = params.testnet
        ? RSK_ATTESTATION_CONFIG.testnet
        : RSK_ATTESTATION_CONFIG.mainnet;

      const EAS_ABI = [
        "event Attested(address indexed recipient, address indexed attester, bytes32 uid, bytes32 indexed schema)"
      ];
      const contract = new ethers.Contract(config.contractAddress, EAS_ABI, provider);

      const limit = params.limit || 10;
      const latestBlock = await provider.getBlockNumber();

      const fromBlock = Math.max(0, latestBlock - 5000);

      const filter = (contract.filters as any)["Attested"](
        params.recipient ?? null,
        params.attester ?? null,
        null,
        params.schema ?? null
      );

      const events = await contract.queryFilter(filter, fromBlock, latestBlock);

      const recent = [...events]
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .slice(0, limit);

      const eas = initializeEAS(config.contractAddress, provider);

      const attestations = await Promise.all(
        recent.map(async (event) => {
          const log = event as ethers.EventLog;
          const uid = log.args[2] as string;

          try {
            const att = await eas.getAttestation(uid as `0x${string}`);
            return {
              uid: att.uid,
              attester: att.attester,
              recipient: att.recipient,
              schema: att.schema,
              time: Number(att.time),
              expirationTime: Number(att.expirationTime),
              revocationTime: Number(att.revocationTime),
            };
          } catch {
            return {
              uid,
              attester: log.args[1] as string,
              recipient: log.args[0] as string,
              schema: log.args[3] as string,
              time: 0,
              expirationTime: 0,
              revocationTime: 0,
            };
          }
        })
      );

      return {
        success: true,
        data: {
          attestations,
          count: attestations.length,
          network: params.testnet ? "RSK Testnet" : "RSK Mainnet",
        },
        responseType: "AttestationsListedSuccessfully"
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const isLogsUnsupported = errorMessage.includes("eth_getLogs") || errorMessage.includes("-32601");
      return {
        success: false,
        error: isLogsUnsupported
          ? "The RSK public node does not support eth_getLogs. Provide a custom rpcUrl from a provider that supports event log queries (e.g., Alchemy, GetBlock, or a private RSK node)."
          : `Failed to list attestations: ${errorMessage}`,
        responseType: "ErrorListingAttestations"
      };
    }
  }

  async processCreateSchema(params: CreateSchemaParams): Promise<AttestationServiceResult> {
    try {
      const signer = await createAttestationSigner({
        testnet: params.testnet,
        walletName: params.walletName,
        isExternal: true,
        walletsData: params.walletData,
        password: params.walletPassword
      });

      if (!signer) {
        return {
          success: false,
          error: "Failed to create wallet signer",
          responseType: "ErrorCreatingSchema"
        };
      }

      const config = params.testnet
        ? RSK_ATTESTATION_CONFIG.testnet
        : RSK_ATTESTATION_CONFIG.mainnet;

      const easSdk = require("@ethereum-attestation-service/eas-sdk");
      const SchemaRegistry = easSdk.SchemaRegistry;

      const schemaRegistry = new SchemaRegistry(config.schemaRegistryAddress);
      schemaRegistry.connect(signer);

      const tx = await schemaRegistry.register({
        schema: params.schema,
        resolverAddress: (params.resolverAddress || "0x0000000000000000000000000000000000000000") as `0x${string}`,
        revocable: params.revocable
      });

      const schemaUID = await tx.wait();

      return {
        success: true,
        data: {
          schemaUID,
          schema: params.schema,
          revocable: params.revocable,
          viewUrl: params.testnet
            ? `https://explorer.testnet.rootstock.io/ras/schema/${schemaUID}`
            : `https://explorer.rootstock.io/ras/schema/${schemaUID}`
        },
        responseType: "SchemaCreatedSuccessfully"
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Failed to create schema: ${errorMessage}`,
        responseType: "ErrorCreatingSchema"
      };
    }
  }

  async processDeploymentAttestation(params: AttestDeploymentParams): Promise<AttestationServiceResult> {
    try {
      const network = params.testnet ? "testnet" : "mainnet";
      const schemaUID = params.schemaUID || DEFAULT_SCHEMA_UIDS[network].deployment;
      if (!schemaUID) {
        return {
          success: false,
          error: "No deployment schema UID available for mainnet. Provide a schemaUID or register one first using create-schema.",
          responseType: "ErrorAttestingDeployment"
        };
      }

      const signer = await createAttestationSigner({
        testnet: params.testnet,
        walletName: params.walletName,
        isExternal: true,
        walletsData: params.walletData,
        password: params.walletPassword
      });

      if (!signer) {
        return {
          success: false,
          error: "Failed to create wallet signer. Ensure wallet data and password are correct.",
          responseType: "ErrorAttestingDeployment"
        };
      }

      const uid = await submitAttestation(
        signer,
        params.testnet,
        schemaUID,
        DEPLOYMENT_SCHEMA,
        [
          { name: "contractName", value: params.contractName, type: "string" },
          { name: "contractAddress", value: params.contractAddress, type: "address" },
          { name: "deployer", value: params.deployer, type: "address" },
          { name: "blockNumber", value: params.blockNumber, type: "uint256" },
          { name: "transactionHash", value: params.transactionHash, type: "bytes32" },
          { name: "timestamp", value: params.timestamp, type: "uint256" },
          { name: "abiHash", value: params.abiHash || "", type: "string" },
          { name: "bytecodeHash", value: params.bytecodeHash || "", type: "string" },
          { name: "version", value: "1.0", type: "string" }
        ],
        params.recipient || params.contractAddress
      );

      if (!uid) {
        return {
          success: false,
          error: "Attestation transaction failed. Check wallet balance and network connectivity.",
          responseType: "ErrorAttestingDeployment"
        };
      }

      return {
        success: true,
        data: {
          uid,
          contractAddress: params.contractAddress,
          contractName: params.contractName,
          deployer: params.deployer,
          viewUrl: getEasViewerUrl(uid, params.testnet)
        },
        responseType: "DeploymentAttestedSuccessfully"
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Failed to attest deployment: ${errorMessage}`,
        responseType: "ErrorAttestingDeployment"
      };
    }
  }

  async processVerificationAttestation(params: AttestVerificationParams): Promise<AttestationServiceResult> {
    try {
      const network = params.testnet ? "testnet" : "mainnet";
      const schemaUID = params.schemaUID || DEFAULT_SCHEMA_UIDS[network].verification;
      if (!schemaUID) {
        return {
          success: false,
          error: "No verification schema UID available for mainnet. Provide a schemaUID or register one first using create-schema.",
          responseType: "ErrorAttestingVerification"
        };
      }

      const signer = await createAttestationSigner({
        testnet: params.testnet,
        walletName: params.walletName,
        isExternal: true,
        walletsData: params.walletData,
        password: params.walletPassword
      });

      if (!signer) {
        return {
          success: false,
          error: "Failed to create wallet signer. Ensure wallet data and password are correct.",
          responseType: "ErrorAttestingVerification"
        };
      }

      const uid = await submitAttestation(
        signer,
        params.testnet,
        schemaUID,
        VERIFICATION_SCHEMA,
        [
          { name: "contractName", value: params.contractName, type: "string" },
          { name: "contractAddress", value: params.contractAddress, type: "address" },
          { name: "verifier", value: params.verifier, type: "address" },
          { name: "sourceCodeHash", value: params.sourceCodeHash, type: "string" },
          { name: "compilationTarget", value: params.compilationTarget, type: "string" },
          { name: "compilerVersion", value: params.compilerVersion, type: "string" },
          { name: "optimizationUsed", value: params.optimizationUsed, type: "bool" },
          { name: "timestamp", value: params.timestamp, type: "uint256" },
          { name: "verificationTool", value: params.verificationTool, type: "string" },
          { name: "version", value: "1.0", type: "string" },
          { name: "schemaVersion", value: "2.0", type: "string" }
        ],
        params.recipient || params.contractAddress
      );

      if (!uid) {
        return {
          success: false,
          error: "Attestation transaction failed. Check wallet balance and network connectivity.",
          responseType: "ErrorAttestingVerification"
        };
      }

      return {
        success: true,
        data: {
          uid,
          contractAddress: params.contractAddress,
          contractName: params.contractName,
          verifier: params.verifier,
          verificationTool: params.verificationTool,
          viewUrl: getEasViewerUrl(uid, params.testnet)
        },
        responseType: "VerificationAttestedSuccessfully"
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Failed to attest verification: ${errorMessage}`,
        responseType: "ErrorAttestingVerification"
      };
    }
  }

  async processTransferAttestation(params: AttestTransferParams): Promise<AttestationServiceResult> {
    try {
      const network = params.testnet ? "testnet" : "mainnet";
      const schemaUID = params.schemaUID || DEFAULT_SCHEMA_UIDS[network].transfer;
      if (!schemaUID) {
        return {
          success: false,
          error: "No transfer schema UID available for mainnet. Provide a schemaUID or register one first using create-schema.",
          responseType: "ErrorAttestingTransfer"
        };
      }

      const signer = await createAttestationSigner({
        testnet: params.testnet,
        walletName: params.walletName,
        isExternal: true,
        walletsData: params.walletData,
        password: params.walletPassword
      });

      if (!signer) {
        return {
          success: false,
          error: "Failed to create wallet signer. Ensure wallet data and password are correct.",
          responseType: "ErrorAttestingTransfer"
        };
      }

      const uid = await submitAttestation(
        signer,
        params.testnet,
        schemaUID,
        TRANSFER_SCHEMA,
        [
          { name: "sender", value: params.sender, type: "address" },
          { name: "recipient", value: params.recipient, type: "address" },
          { name: "amount", value: params.amount, type: "string" },
          { name: "tokenAddress", value: params.tokenAddress || "0x0000000000000000000000000000000000000000", type: "address" },
          { name: "tokenSymbol", value: params.tokenSymbol || "RBTC", type: "string" },
          { name: "transactionHash", value: params.transactionHash, type: "bytes32" },
          { name: "blockNumber", value: params.blockNumber, type: "uint256" },
          { name: "timestamp", value: params.timestamp, type: "uint256" },
          { name: "reason", value: params.reason || "", type: "string" },
          { name: "transferType", value: params.transferType, type: "string" },
          { name: "version", value: "1.0", type: "string" }
        ],
        params.recipient
      );

      if (!uid) {
        return {
          success: false,
          error: "Attestation transaction failed. Check wallet balance and network connectivity.",
          responseType: "ErrorAttestingTransfer"
        };
      }

      return {
        success: true,
        data: {
          uid,
          sender: params.sender,
          recipient: params.recipient,
          amount: params.amount,
          tokenSymbol: params.tokenSymbol || "RBTC",
          viewUrl: getEasViewerUrl(uid, params.testnet)
        },
        responseType: "TransferAttestedSuccessfully"
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: `Failed to attest transfer: ${errorMessage}`,
        responseType: "ErrorAttestingTransfer"
      };
    }
  }
}
