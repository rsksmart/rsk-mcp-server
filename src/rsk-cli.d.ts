declare module "@rsksmart/rsk-cli/dist/src/utils/attestation.js" {
  export const RSK_ATTESTATION_CONFIG: {
    testnet: { contractAddress: string; schemaRegistryAddress: string; graphqlEndpoint: string };
    mainnet: { contractAddress: string; schemaRegistryAddress: string; graphqlEndpoint: string };
  };
  export const DEFAULT_SCHEMA_UIDS: {
    testnet: { deployment: string; verification: string; transfer: string };
    mainnet: { deployment: string; verification: string; transfer: string };
  };
  export function createDeploymentAttestation(signer: any, data: any, options?: any): Promise<string | null>;
  export function createVerificationAttestation(signer: any, data: any, options?: any): Promise<string | null>;
  export function createTransferAttestation(signer: any, data: any, options?: any): Promise<string | null>;
}

declare module "@rsksmart/rsk-cli/dist/src/utils/walletSigner.js" {
  export function createAttestationSigner(options?: any): Promise<any>;
}
