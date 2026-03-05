export type WalletData = {
  wallets: {
    [key: string]: WalletItem;
  };
  currentWallet: string;
};

type WalletItem = {
  address: string;
  encryptedPrivateKey: string;
  iv: string;
};

export type MCPResponse = {
  content: {
    type: "text";
    text: string;
  }[];
  isError?: boolean;
};

export enum ResponseType {
  Interaction = "interaction",
  ErrorReadingPasswordFile = "errorPswFile",
  ErrorMissingInfo = "errorMissingInfo",
  WalletCreatedSuccessfully = "walletCreatedSuccessfully",
  ErrorTryAgain = "errorTryAgain",
  ToCheckBalance = "toCheckBalance",
  ErrorInvalidWalletData = "errorInvalidWalletData",
  CheckBalanceSuccess = "checkBalanceSuccess",
  ErrorCheckingBalance = "errorCheckingBalance",
  ErrorTXIdRequired = "errorTXIdRequired",
  ErrorTXHashInvalid = "errorTXHashInvalid",
  TransactionFound = "transactionFound",
  ErrorTxNotFound = "errorTxNotFound",
  ErrorCheckingTransaction = "errorCheckingTransaction",
  ToDeployContract = "toDeployContract",
  ContractDeployedSuccessfully = "contractDeployedSuccessfully",
  ErrorDeployingContract = "errorDeployingContract",
  ErrorInvalidABI = "errorInvalidABI",
  ErrorInvalidBytecode = "errorInvalidBytecode",
  ToVerifyContract = "toVerifyContract",
  ContractVerifiedSuccessfully = "contractVerifiedSuccessfully",
  ErrorVerifyingContract = "errorVerifyingContract",
  ErrorInvalidContractAddress = "errorInvalidContractAddress",
  ErrorInvalidJSON = "errorInvalidJSON",
  ToReadContract = "toReadContract",
  ContractReadSuccessfully = "contractReadSuccessfully",
  ErrorReadingContract = "errorReadingContract",
  ErrorContractNotVerified = "errorContractNotVerified",
  AvailableFunctions = "availableFunctions",
  TransferCompletedSuccessfully = "transferCompletedSuccessfully",
  ToTransfer = "toTransfer",
  ErrorInvalidTokenAddress = "errorInvalidTokenAddress",
  ErrorInvalidAddress = "errorInvalidAddress",
  ErrorTransferFailed = "errorTransferFailed",
  HistoryRetrievedSuccessfully = "historyRetrievedSuccessfully",
  ToHistory = "toHistory",
  ErrorRetrievingHistory = "errorRetrievingHistory",
  ContractDeploymentConfirmation = "contractDeploymentConfirmation",
  TransferConfirmation = "transferConfirmation",
  
  AttestationIssuedSuccessfully = "attestationIssuedSuccessfully",
  ErrorIssuingAttestation = "errorIssuingAttestation",
  AttestationVerifiedSuccessfully = "attestationVerifiedSuccessfully",
  ErrorVerifyingAttestation = "errorVerifyingAttestation",
  AttestationRevokedSuccessfully = "attestationRevokedSuccessfully",
  ErrorRevokingAttestation = "errorRevokingAttestation",
  AttestationsListedSuccessfully = "attestationsListedSuccessfully",
  ErrorListingAttestations = "errorListingAttestations",
  SchemaCreatedSuccessfully = "schemaCreatedSuccessfully",
  ErrorCreatingSchema = "errorCreatingSchema",
  DeploymentAttestedSuccessfully = "deploymentAttestedSuccessfully",
  ErrorAttestingDeployment = "errorAttestingDeployment",
  VerificationAttestedSuccessfully = "verificationAttestedSuccessfully",
  ErrorAttestingVerification = "errorAttestingVerification",
  TransferAttestedSuccessfully = "transferAttestedSuccessfully",
  ErrorAttestingTransfer = "errorAttestingTransfer",
}