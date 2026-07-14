export interface AttestationNetworkConfig {
  contractAddress: string;
  schemaRegistryAddress: string;
  graphqlEndpoint: string;
}

export const RSK_ATTESTATION_CONFIG: {
  testnet: AttestationNetworkConfig;
  mainnet: AttestationNetworkConfig;
} = {
  testnet: {
    contractAddress: "0xc300aeEaDd60999933468738c9F5D7e9C0671e1c",
    schemaRegistryAddress: "0x679c62956cD2801AbAbF80e9D430f18859Eea2d5",
    graphqlEndpoint: "https://rootstock.easscan.org/graphql"
  },
  mainnet: {
    contractAddress: "0x54C0726E9d2D57Bc37AD52c7E219A3229e0eE963",
    schemaRegistryAddress: "0xeF29675d82CC5967069d6d9C17F2719f67728F5B",
    graphqlEndpoint: "https://rootstock.easscan.org/graphql"
  }
};

export const DEPLOYMENT_SCHEMA =
  "string contractName,address contractAddress,address deployer,uint256 blockNumber,bytes32 transactionHash,uint256 timestamp,string abiHash,string bytecodeHash,string version";

export const VERIFICATION_SCHEMA =
  "string contractName,address contractAddress,address verifier,string sourceCodeHash,string compilationTarget,string compilerVersion,bool optimizationUsed,uint256 timestamp,string verificationTool,string version,string schemaVersion";

export const TRANSFER_SCHEMA =
  "address sender,address recipient,string amount,address tokenAddress,string tokenSymbol,bytes32 transactionHash,uint256 blockNumber,uint256 timestamp,string reason,string transferType,string version";

export const DEFAULT_SCHEMA_UIDS: {
  testnet: { deployment: string; verification: string; transfer: string };
  mainnet: { deployment: string; verification: string; transfer: string };
} = {
  testnet: {
    deployment: "0xac72a47948bf42cad950de323c51a0033346629ae4a42da45981ae9748118a72",
    verification: "0xdf68ba5414a61a12f26d41df4f5a1ef3ffe2ab809fea94d9c76fa7cb84b8fb4a",
    transfer: "0x0da2422c401f8810a6be8f4451aaa0c0a5a6601701cba17bba14f50bb0039dc8"
  },
  mainnet: {
    deployment: "",
    verification: "",
    transfer: ""
  }
};
